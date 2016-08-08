function sortChangeBase (a, b) {
    if (a['baseIndex'] === b['baseIndex']) {
        if (a['_textStart'] && b['_textStart']) {
            return a['_textStart'] > b['_textStart'] ? 1 : -1;
        }
        return 0;
    } else if (!a['baseIndex'] && b['baseIndex']) {
        return -1;
    } else if (a['baseIndex'] && !b['baseIndex']) {
        return 1;
    }
    var aIndices = a['baseIndex'].split('>');
    var bIndices = b['baseIndex'].split('>');
    var equal = true;
    var i = 0;
    while (equal && i < aIndices.length && i < bIndices.length) {
        var aN = parseInt(aIndices[i], 10);
        var bN = parseInt(bIndices[i], 10);
        if (aN === bN) {
            i++;
            continue;
        } else if (isNaN(aN) || isNaN(bN)) {
            return isNaN(aN) ? 1 : -1;
        } else {
            return aN > bN ? 1 : -1;
        }
    }

    return 0;
}
(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.reconcile = mod.exports;
    }
})(this, function (exports) {
    /**
     * reconcile.js
     * An implementation of the reconciliation algorithm presented by Facebook
     * react.js (https://facebook.github.io/react/docs/reconciliation.html). This
     * handles the diff between two nodes using the above algorithm. Additionally,
     * this library will generate the diff actions, and allow you to perform
     * a patch and applied Change using a three-way merge option.
     *
     * The MIT License (MIT)
     * Copyright (c) 2015 Thomas Holloway <nyxtom@gmail.com>
     */

    /**
     * @typedef {{
     *    action: (string),
     *    element: (null|undefined|Node|Element|DocumentFragment),
     *    baseIndex: (null|undefined|string),
     *    sourceIndex: (null|undefined|string),
     *    _deleted: (null|undefined|string|number),
     *    _inserted: (null|undefined|string|number),
     *    _length: (null|undefined|string|number),
     *    name: (null|undefined|string|number)
     * }} Change
     *
     * @typedef {{
     *    map: Object,
     *    indices: Array<number>
     * }} MapElementsResult
     *
     * @typedef {{
     *    compare: Array<Array<Node|Element|DocumentFragment>>,
     *    diff: Array<Change>
     * }} MoveComparisonResult
     *
     * @typedef {{
     *    mine: Change,
     *    theirs: Change
     * }} ChangeConflict
     *
     * @typedef {{
     *    unapplied: Array<Change>,
     *    conflicts: Array<ChangeConflict>
     * }} ApplyResult
     *
     * @typedef {{
     *     lastParent: (null|undefined|Node|Element|DocumentFragment),
     *     lastParentIndex: (null|undefined|string),
     *     node: (null|undefined|Node|Element|DocumentFragment),
     *     found: (boolean)
     * }} FindNodeAtIndexResult
     *
     * @typedef {{
     *     parent: (Node|Element|DocumentFragment),
     *     insertion: (Node|Element|DocumentFragment),
     *     source: (null|undefined|Node|Element|DocumentFragment),
     *     change: Change,
     *     appendOnly: (boolean)
     * }} AppliedMoveAction
     */

    'use strict';

    /**
     * Simple escape utility for html entities.
     * @param {string} s
     * @return {string}
     */
    function escape(s) {
        var n = s;
        n = n.replace(/&/g, '&amp;');
        n = n.replace(/</g, '&lt;');
        n = n.replace(/>/g, '&gt;');
        n = n.replace(/"/g, '&quot;');

        return n;
    }

    /**
     * Maps a list of nodes by their id or generated id.
     * @param {NodeList} nodes
     * @return {MapElementsResult}
     */
    function mapElements(nodes) {
        var map = {};
        var tags = {};
        var node;

        var indices = [];
        for (var i = 0, len = nodes.length; i < len; i++) {
            node = nodes[i];
            //var id = node.id ? node.id : generateId(node, tags);
            var id = ve.getProp( node, 'element', 'internal', 'id' ) || generateId(node, tags);
            map[id] = node;
            node._i = i;
            node._id = id;
            indices.push(i);
        }

        return { 'map': map, 'indices': indices };
    }

    /**
     * Generates a unique id for a given node by its tag name and existing
     * tags used for disambiguation as well as a given counter per tag use.
     * @param {Node|Element|DocumentFragment} node
     * @param {Object} tags
     * @return {string}
     */
    function generateId(node, tags) {
        // get the tag or create one from the other node types
        //var tag = node.tagName ? node.tagName : 'x' + node.nodeType;
        var tag = node.type;

        // set the counter to zero
        if (!tags[tag]) {
            tags[tag] = 0;
        }

        // increment the counter for that tag
        tags[tag]++;

        return tag + tags[tag];
    }

    /**
     * Generate moves creates a diff for a given map, nodes and base element
     * to iterate over the elements in either forward or reverse order. This allows
     * us to determine whether the reverse or in order diff creates more or less moves.
     * Reducing the number of changes required for moves, insertions and deletions is
     * important to reducing future conflicts.
     *
     * @param {MapElementsResult} map
     * @param {NodeList} nodes
     * @param {Array<Number>} indices
     * @param {Node|Element|DocumentFragment} base
     * @param {boolean} reverse
     * @param {null|undefined|string} index
     * @return {MoveComparisonResult}
     */
    function generateMoves(map, nodes, indices, base, reverse, index) {
        var moves = [];
        var compare = [];
        var operateMap = {};
        var tags = {};

        // iterate over the nodes and base nodes in the given order
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[reverse ? nodes.length - i - 1 : i],
                bound = base.children[reverse ? base.children.length - indices[i] - 1 : indices[i]],
                //id = node.id ? node.id : generateId(node, tags);
                id = ve.getProp( node, 'element', 'internal', 'id' ) || generateId(node, tags);

            // skip if we already performed an insertion map
            if (operateMap[id]) {
                continue;
            }

            // check if the node has an id
            // if it exists in the base map, then move that node to the correct
            // position, this will usually be the same node, which means no dom move
            // is necessary, otherwise clone the node from the source (new inserts)
            var existing = map[id];
            if (existing) {
                if (existing !== bound) {
                    var relativeBaseIndex = reverse ? base.children.length - existing._i - 1 : existing._i;
                    moves.push({
                        'action': 'moveChildElement',
                        'element': existing,
                        'baseIndex': index + '>' + relativeBaseIndex,
                        'sourceIndex': index + '>' + i });

                    // move the index so we can retrieve the next appropriate node
                    indices.splice(i, 0, indices.splice(relativeBaseIndex, 1)[0]);
                }
                // if (!node.isEqualNode(existing)) {
                if (!ve.compare( node.element, existing.element ) || !compareData(node, existing)) {
                    compare.push([node, existing]);
                }
            } else {
                //var inserted = node.cloneNode(true);
                var inserted = node;
                var relativeBaseIndex = reverse ? nodes.length - i - 1 : i;
                moves.push({
                    'action': 'insertChildElement',
                    'element': inserted,
                    'baseIndex': index + '>' + relativeBaseIndex,
                    'sourceIndex': index + '>' + relativeBaseIndex });
            }
            operateMap[id] = true;
        }

        // Remove any tail nodes in the base
        for (var i = 0, len = base.children.length; i < len; i++) {
            var remove = base.children[i];
            var removeId = remove._id;
            if (!operateMap[removeId]) {
                moves.push({
                    'action': 'removeChildElement',
                    'element': remove,
                    'baseIndex': index + '>' + remove._i,
                    'sourceIndex': null });
            }
        }

        return { 'compare': compare, 'diff': moves };
    };

    /**
     * Performs a simple diff between two different strings. The
     * result is an array of changes to be made at various indices
     * to transform base to source.
     *
     * Javascript Diff Algorithm
     *  By John Resig (http://ejohn.org/)
     *  Modified by Chu Alan "sprite"
     *  Modified by Thomas Holloway to support
     *  returning a list of diff changes for reconcile.js
     *
     * Released under the MIT license.
     *
     * More Info:
     *  http://ejohn.org/projects/javascript-diff-algorithm/
     *  http://ejohn.org/files/jsdiff.js
     *
     * @param {string} source
     * @param {string} base
     * @param {null|undefined|string} index
     * @param {null|undefined|Node|Element|DocumentFragment} baseElement
     * @return {Array<Change>}
     */
    function diffString(source, base, index, baseElement) {
        var o = base == '' ? [] : base.split(/\s+/);
        var n = source == '' ? [] : source.split(/\s+/);
        var ns = new Object();
        var os = new Object();

        for (var i = 0; i < n.length; i++) {
            if (ns[n[i]] == null) ns[n[i]] = {
                rows: new Array(),
                o: null
            };
            ns[n[i]].rows.push(i);
        }

        for (var i = 0; i < o.length; i++) {
            if (os[o[i]] == null) os[o[i]] = {
                rows: new Array(),
                n: null
            };
            os[o[i]].rows.push(i);
        }

        for (var i in ns) {
            if (ns[i].rows.length == 1 && typeof os[i] != 'undefined' && os[i].rows.length == 1) {
                n[ns[i].rows[0]] = {
                    text: n[ns[i].rows[0]],
                    row: os[i].rows[0]
                };
                o[os[i].rows[0]] = {
                    text: o[os[i].rows[0]],
                    row: ns[i].rows[0]
                };
            }
        }

        for (var i = 0; i < n.length - 1; i++) {
            if (n[i].text != null && n[i + 1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null && n[i + 1] == o[n[i].row + 1]) {
                n[i + 1] = {
                    text: n[i + 1],
                    row: n[i].row + 1
                };
                o[n[i].row + 1] = {
                    text: o[n[i].row + 1],
                    row: i + 1
                };
            }
        }

        for (var i = n.length - 1; i > 0; i--) {
            if (n[i].text != null && n[i - 1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null && n[i - 1] == o[n[i].row - 1]) {
                n[i - 1] = {
                    text: n[i - 1],
                    row: n[i].row - 1
                };
                o[n[i].row - 1] = {
                    text: o[n[i].row - 1],
                    row: i - 1
                };
            }
        }

        var oSpace = base.match(/\s+/g);
        if (oSpace == null) {
            oSpace = [''];
        } else {
            oSpace.push('');
        }
        var nSpace = source.match(/\s+/g);
        if (nSpace == null) {
            nSpace = [''];
        } else {
            nSpace.push('');
        }

        var changes = [];
        var baseIndex = 0;
        if (n.length == 0) {
            var deletedText = '';
            for (var i = 0; i < o.length; i++) {
                deletedText += o[i] + oSpace[i];
                baseIndex += o[i].length + oSpace[i].length;
            }
            if (o.length > 0) {
                changes.push({
                    'action': 'deleteText',
                    'element': baseElement,
                    'baseIndex': index,
                    'sourceIndex': index,
                    '_textStart': 0,
                    '_textEnd': baseIndex,
                    '_deleted': deletedText,
                    '_length': deletedText.length
                });
            }
        } else {
            var current = null;
            if (n[0].text == null) {
                for (var i = 0; i < o.length; i++) {
                    if (o[i].text != null) {
                        if (current != null) {
                            changes.push(current);
                        }
                        current = null;
                        continue;
                    }

                    if (current == null) {
                        current = {
                            'action': 'deleteText',
                            'element': baseElement,
                            'baseIndex': index,
                            'sourceIndex': index,
                            '_textStart': baseIndex,
                            '_textEnd': 0,
                            '_deleted': '',
                            '_length': 0
                        };
                    }

                    // update the current deletion parameters
                    current['_deleted'] += o[i] + oSpace[i];
                    current['_length'] = current['_deleted'].length;
                    baseIndex += current['_length'];
                    current['_textEnd'] = baseIndex;
                }

                if (current != null) {
                    changes.push(current);
                    current = null;
                }
            }

            var k = 0;
            for (var i = 0; i < n.length; i++) {
                if (n[i].text == null) {

                    // ensure that previous changes are added to the changeset if
                    // they happen to differ from an expected insertion below
                    if (current != null && current['action'] === 'deleteText') {
                        changes.push(current);
                        current = null;
                    }

                    if (current == null) {
                        current = {
                            'action': 'insertText',
                            'element': baseElement,
                            'baseIndex': index,
                            'sourceIndex': index,
                            '_textStart': baseIndex,
                            '_textEnd': 0,
                            '_inserted': '',
                            '_length': 0
                        };
                    }

                    // update the current insertion parameters
                    current['_inserted'] += n[i] + nSpace[i];
                    current['_length'] = current['_inserted'].length;
                    baseIndex += current['_length'];
                    current['_textEnd'] = baseIndex;
                } else {
                    baseIndex += n[i].text.length + nSpace[i].length;
                    // edge case for white space insertions
                    if (n[k].text == null) {
                        continue;
                    }
                    for (k = n[k].row + 1; k < o.length && o[k].text == null; k++) {
                        // ensure that the previous changes are added to the changeset
                        if (current != null && current['action'] === 'insertText') {
                            changes.push(current);
                            current = null;
                        }

                        if (current == null) {
                            current = {
                                'action': 'deleteText',
                                'element': baseElement,
                                'baseIndex': index,
                                'sourceIndex': index,
                                '_textStart': baseIndex,
                                '_textEnd': 0,
                                '_deleted': '',
                                '_length': 0
                            };
                        }

                        // update the current insertion parameters
                        current['_deleted'] += o[k] + oSpace[k];
                        current['_length'] = current['_deleted'].length;
                        baseIndex += current['_length'];
                        current['_textEnd'] = baseIndex;
                    }
                }
            }

            // ensure that remaining changes are pushed to the changeset
            if (current != null) {
                changes.push(current);
                current = null;
            }
        }

        return changes;
    };

    function compareData( a, b ) {
        var aData = a.doc.getDataFromNode( a ),
            bData = b.doc.getDataFromNode( b );

        return ve.compare( aData, bData );
    }

    function getText( node ) {
        return node.doc.data.getText( true, node.getRange() );
    }

    /**
     * Merges two given nodes by checking their content
     * node type, attribute differences and finally their
     * child nodes through various diff operations. This
     * will merge and return the diff as a list.
     * @param {Node|Element|DocumentFragment} source
     * @param {Node|Element|DocumentFragment} base
     * @param {null|undefined|string} index
     * @return {Array<Change>}
     */
    function diff(source, base, index) {
        var diffActions = [];
        if (index == null) {
            index = '0'; // 0 for root node
        }
        // if the source and base is either a text node or a comment node,
        // then we can simply say the difference is their text content
        if (source.type === base.type && (source.type === 'text')) {
            if (!compareData(base, source)) {
                var textActions = diffString(getText(source), getText(base), index, base);
                if (textActions.length > 0) {
                    diffActions = diffActions.concat(textActions);
                }
            }

            return diffActions;
        }

        // look for differences between the nodes by their attributes
        //if (source.attributes && base.attributes) {
            var attributes = source.getAttributes(),
                value,
                name;

            // iterate over the source attributes that we want to copy over to the new base node
            //for (var i = attributes.length; i--;) {
            for (name in attributes) {
                // value = attributes[i].nodeValue;
                // name = attributes[i].nodeName;
                value = attributes[name];

                var val = base.getAttribute(name);
                // VE values can be objects or arrays, as well as strings
                if ((typeof value !== 'object' && value !== val) || !ve.compare( value, val )) {
                    if (val == null) {
                        diffActions.push({
                            'action': 'setAttribute',
                            'name': name,
                            'element': base,
                            'baseIndex': index,
                            'sourceIndex': index,
                            '_inserted': value });
                    } else {
                        // if the attribute happens to be a style
                        // only generate style Updates
                        // if (name === 'style') {
                        //     var styleChanges = diffStyleString(value, val, index, base);
                        //     if (styleChanges.length > 0) {
                        //         diffActions = diffActions.concat(styleChanges);
                        //     }
                        // } else {
                            diffActions.push({
                                'action': 'setAttribute',
                                'name': name,
                                'element': base,
                                'baseIndex': index,
                                'sourceIndex': index,
                                '_deleted': val,
                                '_inserted': value });
                        //}
                    }
                }
            }

            // iterate over attributes to remove that the source no longer has
            attributes = base.getAttributes();
            for (name in attributes) {
                //name = attributes[i].nodeName;
                if (source.getAttribute(name) === undefined) {
                    diffActions.push({
                        'action': 'removeAttribute',
                        'name': name,
                        'baseIndex': index,
                        'sourceIndex': index,
                        '_deleted': attributes[name] });
                }
            }
        //}

        // insert, delete, and move child nodes based on a predictable id
        var compare = [];
        if (source.children && base.children) {
            var mapResult = mapElements(base.children),
                nodes = source.children;

            var map = mapResult['map'];
            var indices = mapResult['indices'];

            var moves = generateMoves(map, nodes, indices.slice(0), base, false, index);
            if (moves['diff'].length > 1) {
                var backwardMoves = generateMoves(map, nodes, indices.slice(0), base, true, index);
                if (backwardMoves['diff'].length < moves['diff'].length) {
                    moves = backwardMoves;
                }
            }
            diffActions = diffActions.concat(moves['diff']);
            compare = moves['compare'];
        }

        // at this point we should have child nodes of equal length
        if (compare.length > 0) {
            for (var i = 0, len = compare.length; i < len; i++) {
                var sourceChildNode = compare[i][0];
                var baseChildNode = compare[i][1];

                // perform the diff between the given source and base child nodes
                var childDiffs = diff(sourceChildNode, baseChildNode, index + '>' + baseChildNode._i);

                // if there was any difference, concat those to our existing actions
                if (childDiffs.length > 0) {
                    diffActions = diffActions.concat(childDiffs);
                }

                // remove temporary data stored on the node
                delete baseChildNode._i;
                delete baseChildNode._id;
            }
        }

        return diffActions;
    }

    /**
     * Compares two changes and whether they are essentially performing the
     * same change. A change is qualified as the same if it performs the same
     * operation, at the same indices, inserting/deleting/moving or updating data.
     *
     * @param {Change} change1
     * @param {Change} change2
     * @return {boolean}
     */
    function isEqualChange(change1, change2) {
        return change1['baseIndex'] === change2['baseIndex'] && change1['sourceIndex'] === change2['sourceIndex'] &&
            change1['action'] === change2['action'] && change1['name'] === change2['name'] && change1['_deleted'] === change2['_deleted'] &&
            change1['_inserted'] === change2['_inserted'] && change1['element'] && change2['element'] &&
            change1['element'].type === change2['element'].type &&
            (
                change1['element'].type === 'text' && change2['element'].type === 'text' && getText(change1['element']) === getText(change2['element']) ||
                //ve.compare(change1['element'].element, change2['element'].element)
                compareData(change1['element'], change2['element'])
            ) &&
            change1['_textStart'] === change2['_textStart'] && change1['_textEnd'] === change2['_textEnd'];
    }

    /**
     * Determines if the given changes (child, parent) has a base index that is
     * root of the other one in the dom tree.
     *
     * @param {Change} changeChild
     * @param {Change} changeParent
     * @return {boolean}
     */
    function isParentChange(changeChild, changeParent) {
        return changeChild['baseIndex'].indexOf(changeParent['baseIndex']) === 0 && changeChild['baseIndex'] !== changeParent['baseIndex'];
    };

    /**
     * Given two ranges, we can determine whether they overlay by calculating
     * whether the total range (max - min) is less than the combined width of
     * each range.
     *
     * @param {Change} range1
     * @param {Change} range2
     * @return {boolean}
     */
    function isOverlappingRanges(range1, range2) {
        return Math.max(range1['_textEnd'], range2['_textEnd']) - Math.min(range1['_textStart'], range2['_textStart']) < range1['_length'] + range2['_length'];
    }

    /**
     * Sorts each change set item by their source index in the tree.
     *
     * @param {Change} a
     * @param {Change} b
     * @return {number}
     */
    function sortChange(a, b) {
        if (a['sourceIndex'] === b['sourceIndex']) {
            if (a['_textStart'] && b['_textStart']) {
                return a['_textStart'] > b['_textStart'] ? 1 : -1;
            }
            return 0;
        } else if (!a['sourceIndex'] && b['sourceIndex']) {
            return -1;
        } else if (a['sourceIndex'] && !b['sourceIndex']) {
            return 1;
        }
        var aIndices = a['sourceIndex'].split('>');
        var bIndices = b['sourceIndex'].split('>');
        var equal = true;
        var i = 0;
        while (equal && i < aIndices.length && i < bIndices.length) {
            var aN = parseInt(aIndices[i], 10);
            var bN = parseInt(bIndices[i], 10);
            if (aN === bN) {
                i++;
                continue;
            } else if (isNaN(aN) || isNaN(bN)) {
                return isNaN(aN) ? 1 : -1;
            } else {
                return aN > bN ? 1 : -1;
            }
        }

        return 0;
    }

    /**
     * Locates a given child element from a given parsed index if one exists.
     *
     * @param {Node|Element|DocumentFragment} node
     * @param {null|undefined|string} index
     * @return {?FindNodeAtIndexResult}
     */
    var findChildAtIndex = function findChildAtIndex(node, index) {
        if (!index || !node.children || node.children.length === 0) {
            return null;
        }

        var result = {};
        var indices = index.split('>');
        var found = true;
        var lastParentIndex = '';
        for (var i = 1, len = indices.length; i < len; i++) {
            var nodeIndex = parseInt(indices[i], 10);
            if (node.children && node.children.length > nodeIndex) {
                node = node.children[nodeIndex];
            } else {
                lastParentIndex = indices.slice(0, i - 1).join('>');
                found = false;
                break;
            }
        }

        result['lastParent'] = found ? node.parentNode : node;
        result['lastParentIndex'] = found ? index.slice(0, index.lastIndexOf('>')) : lastParentIndex;
        result['node'] = found ? node : null;
        result['found'] = found;
        return result;
    };

    exports.diff = diff;
    exports.diffString = diffString;
    exports.isEqualChange = isEqualChange;
    exports.isParentChange = isParentChange;
    exports.sortChange = sortChange;
});

