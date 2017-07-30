/*!
 * VisualEditor DataModel VisualDiff class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global treeDiffer */

/**
 * VisualDiff
 *
 * Gets the diff between two VisualEditor DataModel DocumentNodes
 *
 * @class
 * @constructor
 * @param {ve.dm.Document} oldDoc
 * @param {ve.dm.Document} newDoc
 * @param {Number} [timeout=1000] Timeout after which to stop performing linear diffs (in ms)
 */
ve.dm.VisualDiff = function VeDmVisualDiff( oldDoc, newDoc, timeout ) {
	this.oldDoc = oldDoc.cloneFromRange();
	this.newDoc = newDoc.cloneFromRange();
	this.oldDocNode = this.oldDoc.getDocumentNode();
	this.newDocNode = this.newDoc.getDocumentNode();
	this.oldDocChildren = this.getDocChildren( this.oldDocNode );
	this.newDocChildren = this.getDocChildren( this.newDocNode );
	this.oldDocInternalListNode = this.oldDoc.getInternalList().getListNode();
	this.newDocInternalListNode = this.newDoc.getInternalList().getListNode();
	this.treeDiffer = treeDiffer;
	// eslint-disable-next-line camelcase,new-cap
	this.linearDiffer = new ve.DiffMatchPatch( this.oldDoc.getStore(), this.newDoc.getStore() );
	this.endTime = new Date().getTime() + ( timeout || 1000 );

	this.freezeInternalListIndices( this.oldDoc );
	this.freezeInternalListIndices( this.newDoc );

	this.docDiff = {};
	this.internalListDiff = {};
	this.diff = {
		docDiff: this.docDiff,
		internalListDiff: this.getInternalListDiffInfo()
	};

	this.computeDiff( this.oldDocChildren, this.newDocChildren, this.docDiff, 'doc' );
};

/**
 * Get the children of the document that are not internal list nodes
 *
 * @param {ve.dm.Node} docNode The document node
 * @returns {Array} The children of the document node
 */
ve.dm.VisualDiff.prototype.getDocChildren = function ( docNode ) {
	var i, ilen,
		docChildren = [];

	for ( i = 0, ilen = docNode.children.length; i < ilen; i++ ) {
		if (
			!( docNode.children[ i ] instanceof ve.dm.InternalListNode )
		) {
			docChildren.push( docNode.children[ i ] );
		}
	}

	return docChildren;
};

/**
 * Attach the internal list indexOrder to each node referenced by the internal
 * list, ahead of document merge.
 *
 * @param {ve.dm.Document} doc
 */
ve.dm.VisualDiff.prototype.freezeInternalListIndices = function ( doc ) {
	var i, ilen, j, jlen, group, groupName,
		groupIndexOrder, nodeIndex, refNodes,
		nodes = doc.getInternalList().nodes,
		internalListGroups = doc.getInternalList().getNodeGroups();

	for ( groupName in internalListGroups ) {
		group = internalListGroups[ groupName ];
		groupIndexOrder = group.indexOrder;
		for ( i = 0, ilen = groupIndexOrder.length; i < ilen; i++ ) {
			nodeIndex = groupIndexOrder[ i ];
			refNodes = nodes[ groupName ].keyedNodes[ nodes[ groupName ].firstNodes[ nodeIndex ].registeredListKey ];
			for ( j = 0, jlen = refNodes.length; j < jlen; j++ ) {
				ve.setProp( refNodes[ j ].element, 'internal', 'overrideIndex', i + 1 );
			}
		}
	}
};

/**
 * Get the diff between the two trees, in two steps: (1) Compare the children
 * of the old and new root nodes and record any pair where the old child and
 * new child are identical. (If an old child is identical to two new children, it
 * will be paired with the first one only.) (2) If any children of the old or new
 * root nodes remain unpaired, decide whether they are an old child that has
 * been removed, a new child that has been inserted, or a pair in which the old
 * child was changed into the new child.
 *
 * @param {Array} oldRootChildren Children of the old root node
 * @param {Array} newRootChildren Children of the new root node
 * @param {Object} diff Object that will contain information about the diff
 * @param {String} diffType The type of diff to perform
 */
ve.dm.VisualDiff.prototype.computeDiff = function ( oldRootChildren, newRootChildren, diff, diffType ) {
	var i, ilen, j, jlen,
		oldRootChildrenToDiff = [],
		newRootChildrenToDiff = [];

	diff.rootChildrenOldToNew = {};
	diff.rootChildrenNewToOld = {};
	diff.rootChildrenRemove = [];
	diff.rootChildrenInsert = [];

	// STEP 1: Find identical root-node children

	for ( i = 0, ilen = oldRootChildren.length; i < ilen; i++ ) {
		for ( j = 0, jlen = newRootChildren.length; j < jlen; j++ ) {
			if ( !diff.rootChildrenNewToOld.hasOwnProperty( j ) &&
				this.compareRootChildren( oldRootChildren[ i ], newRootChildren[ j ] ) ) {

				diff.rootChildrenOldToNew[ i ] = j;
				diff.rootChildrenNewToOld[ j ] = i;
				break;

			}
			// If no new nodes equalled the old node, add it to nodes to diff
			if ( j === jlen - 1 ) {
				oldRootChildrenToDiff.push( i );
			}
		}
	}

	for ( j = 0; j < jlen; j++ ) {
		if ( !diff.rootChildrenNewToOld.hasOwnProperty( j ) ) {
			newRootChildrenToDiff.push( j );
		}
	}

	// STEP 2: Find removed, inserted and modified root-node children

	if ( oldRootChildrenToDiff.length !== 0 || newRootChildrenToDiff.length !== 0 ) {

		if ( oldRootChildrenToDiff.length === 0 ) {

			// Everything new is an insert
			diff.rootChildrenInsert = newRootChildrenToDiff;

		} else if ( newRootChildrenToDiff.length === 0 ) {

			// Everything old is a remove
			diff.rootChildrenRemove = oldRootChildrenToDiff;

		} else {

			// Find out which remaining docChildren are removed, inserted or modified
			this.findModifiedRootChildren(
				oldRootChildrenToDiff, newRootChildrenToDiff, oldRootChildren, newRootChildren, diff, diffType
			);

		}
	}
};

/**
 * Compare the linear data for two root-child nodes
 *
 * @param {ve.dm.Node} oldRootChild Child of the old root node
 * @param {ve.dm.Node} newRootChild Child of the new root node
 * @return {boolean} The linear data is the same
 */
ve.dm.VisualDiff.prototype.compareRootChildren = function ( oldRootChild, newRootChild ) {
	var i, ilen, oldData, newData, oldStore, newStore;

	if ( oldRootChild.length !== newRootChild.length || oldRootChild.type !== newRootChild.type ) {
		return false;
	}

	oldData = this.oldDoc.getData( oldRootChild.getOuterRange() );
	newData = this.newDoc.getData( newRootChild.getOuterRange() );

	if ( JSON.stringify( oldData ) === JSON.stringify( newData ) ) {
		return true;
	}

	// If strings are not equal, the data may still be the same as far as
	// we are concerned so should compare them properly.
	oldStore = this.oldDoc.getStore();
	newStore = this.newDoc.getStore();

	for ( i = 0, ilen = oldData.length; i < ilen; i++ ) {
		if ( oldData[ i ] !== newData[ i ] &&
			!ve.dm.ElementLinearData.static.compareElements( oldData[ i ], newData[ i ], oldStore, newStore ) ) {
			return false;
		}
	}

	return true;
};

/**
 * Diff each child of the old root node against each child of the new root
 * node; but if the differs decide that an old child is similar enough to a
 * new child, record these as a change from the old child to the new child and
 * don't diff any more children against either child.
 *
 * This might not find the optimal diff in some cases (e.g. if the old child is
 * similar to two of the new children), but diffing every old child against
 * every new child could have a heavy performance cost.
 *
 * @param {Array} oldIndices Indices of the old root children diff
 * @param {Array} newIndices Indices of the new root children diff
 * @param {Array} oldRootChildren Children of the old root node
 * @param {Array} newRootChildren Children of the new root node
 * @param {Object} diff Object that will contain information about the diff
 * @param {String} diffType The type of diff to perform
 */
ve.dm.VisualDiff.prototype.findModifiedRootChildren = function ( oldIndices, newIndices, oldRootChildren, newRootChildren, diff, diffType ) {
	var diffResults, i, j,
		ilen = oldIndices.length,
		jlen = newIndices.length;

	for ( i = 0; i < ilen; i++ ) {
		for ( j = 0; j < jlen; j++ ) {

			if ( oldIndices[ i ] !== null && newIndices[ j ] !== null ) {

				// Try to diff the nodes. If they are too different, diffResults will be false
				// TODO: Add the internalList case, once implemented
				switch ( diffType ) {
					case 'doc':
						diffResults = this.getDocChildDiff(
							oldRootChildren[ oldIndices[ i ] ],
							newRootChildren[ newIndices[ j ] ]
						);
						break;
				}

				if ( diffResults ) {
					diff.rootChildrenOldToNew[ oldIndices[ i ] ] = {
						node: newIndices[ j ],
						diff: diffResults,
						// TODO: Neaten this
						correspondingNodes: this.treeDiffer.Differ.prototype.getCorrespondingNodes(
							diffResults.treeDiff, diffResults.oldTree.orderedNodes.length, diffResults.newTree.orderedNodes.length
						)
					};
					diff.rootChildrenNewToOld[ newIndices[ j ] ] = {
						node: oldIndices[ i ]
					};

					oldIndices[ i ] = null;
					newIndices[ j ] = null;
					break;
				}

			}

		}
	}

	// Any nodes remaining in the 'toDiff' arrays are removes and inserts
	for ( i = 0; i < ilen; i++ ) {
		if ( oldIndices[ i ] !== null ) {
			diff.rootChildrenRemove.push( oldIndices[ i ] );
		}
	}
	for ( j = 0; j < jlen; j++ ) {
		if ( newIndices[ j ] !== null ) {
			diff.rootChildrenInsert.push( newIndices[ j ] );
		}
	}

};

/**
 * Get the diff between a child of the old document node and a child of the new
 * document node. There are three steps: (1) Do a tree diff to find the minimal
 * transactions between the old child and the new child. Allowed transactions
 * are: remove a node, insert a node, or change an old node to a new node. (The
 * cost of each transaction is the same, and the change always costs the same,
 * no matter how similar the nodes are.) The tree differ is not currently aware
 * of legal relationships between nodes, and ve.dm.ContentBranchNodes are
 * treated as leaves. (2) Do a linear diff on the linear data of any changed
 * pair that are both ve.dm.ContentBranchNodes. (3) Find the ratio of the
 * linear data that has changed to the linear data that is retained. If this is
 * above a threshold, the children are too different and the old child has not
 * been changed to make the new child, and the diff should be discarded.
 * Otherwise the diff should be cleaned and returned.
 *
 * TODO: It would be possible to discover moves by comparing removed and
 * inserted nodes from the tree differ.
 *
 * @param {ve.dm.Node} oldDocChild Child of the old document node
 * @param {ve.dm.Node} newDocChild Child of the new document node
 * @param {number} [threshold=0.5] minimum retained : changed ratio allowed
 * @return {Array|boolean} The diff, or false if the children are too different
 */
ve.dm.VisualDiff.prototype.getDocChildDiff = function ( oldDocChild, newDocChild, threshold ) {
	var i, ilen, j, jlen,
		treeDiff, linearDiff,
		oldNode, newNode,
		replacement,
		oldDocChildTree,
		newDocChildTree,
		removeLength,
		insertLength,
		diffLength = 0,
		keepLength = 0,
		diffInfo = [],
		DIFF_DELETE = ve.DiffMatchPatch.static.DIFF_DELETE,
		DIFF_INSERT = ve.DiffMatchPatch.static.DIFF_INSERT;

	threshold = threshold === undefined ? 0.5 : threshold;

	oldDocChildTree = new this.treeDiffer.Tree( oldDocChild, ve.DiffTreeNode );
	newDocChildTree = new this.treeDiffer.Tree( newDocChild, ve.DiffTreeNode );

	treeDiff = new this.treeDiffer.Differ( oldDocChildTree, newDocChildTree )
		.transactions[ oldDocChildTree.orderedNodes.length - 1 ][ newDocChildTree.orderedNodes.length - 1 ];

	// Length of old content is length of old node minus the open and close
	// tags for each child node
	keepLength = oldDocChild.length - 2 * ( oldDocChildTree.orderedNodes.length - 1 );

	// Tree diff timed out: record as full remove and insert
	if ( !treeDiff ) {
		treeDiff = [];
		linearDiff = null;
		diffLength = oldDocChild.length + newDocChild.length;
		keepLength = 0;
	}

	for ( i = 0, ilen = treeDiff.length; i < ilen; i++ ) {

		removeLength = 0;
		insertLength = 0;

		if ( treeDiff[ i ][ 0 ] !== null && treeDiff[ i ][ 1 ] !== null ) {

			// There is a change
			oldNode = oldDocChildTree.orderedNodes[ treeDiff[ i ][ 0 ] ].node;
			newNode = newDocChildTree.orderedNodes[ treeDiff[ i ][ 1 ] ].node;

			if ( !oldNode.canContainContent() && !newNode.canContainContent() ) {

				// There is no content change
				replacement = oldNode.type !== newNode.type;
				diffInfo[ i ] = {
					linearDiff: null,
					replacement: replacement,
					attributeChange: !replacement && !ve.compare( oldNode.getAttributes(), newNode.getAttributes() ) ?
						{
							oldAttributes: oldNode.getAttributes(),
							newAttributes: newNode.getAttributes()
						} :
						false
				};
				continue;

			} else if ( !newNode.canContainContent() ) {

				// Content was removed
				diffInfo[ i ] = {
					linearDiff: null,
					replacement: true,
					attributeChange: false
				};
				removeLength = oldNode.length;

			} else if ( !oldNode.canContainContent() ) {

				// Content was inserted
				diffInfo[ i ] = {
					linearDiff: null,
					replacement: true,
					attributeChange: false
				};
				insertLength = newNode.length;

			// If we got this far, they are both CBNs
			} else {
				replacement = oldNode.type !== newNode.type;

				if ( !replacement && new Date().getTime() < this.endTime ) {
					linearDiff = this.linearDiffer.getCleanDiff(
						this.oldDoc.getData( oldNode.getRange() ),
						this.newDoc.getData( newNode.getRange() ),
						{ keepOldText: false }
					);
				} else {
					linearDiff = null;
					removeLength += oldNode.getLength();
					insertLength += newNode.getLength();
				}

				diffInfo[ i ] = {
					linearDiff: linearDiff,
					replacement: replacement,
					attributeChange: !replacement && !ve.compare( oldNode.getAttributes(), newNode.getAttributes() ) ?
						{
							oldAttributes: oldNode.getAttributes(),
							newAttributes: newNode.getAttributes()
						} :
						false
				};

				if ( linearDiff ) {
					// Record how much content was removed and inserted
					for ( j = 0, jlen = linearDiff.length; j < jlen; j++ ) {
						if ( linearDiff[ j ][ 0 ] === DIFF_INSERT ) {
							insertLength += linearDiff[ j ][ 1 ].length;
						} else if ( linearDiff[ j ][ 0 ] === DIFF_DELETE ) {
							removeLength += linearDiff[ j ][ 1 ].length;
						}
					}
				}

			}

		} else if ( treeDiff[ i ][ 0 ] !== null ) {

			// Node was removed
			oldNode = oldDocChildTree.orderedNodes[ treeDiff[ i ][ 0 ] ];
			if ( oldNode.node.canContainContent() ) {
				removeLength = oldNode.node.length;
			}

		} else {

			// Node was inserted
			newNode = newDocChildTree.orderedNodes[ treeDiff[ i ][ 1 ] ];
			if ( newNode.node.canContainContent() ) {
				insertLength = newNode.node.length;
			}

		}

		keepLength -= removeLength;
		diffLength += removeLength + insertLength;

	}

	// Only return the diff if enough content has changed
	if ( keepLength < threshold * diffLength ) {
		return false;
	}

	return {
		treeDiff: treeDiff,
		diffInfo: diffInfo,
		oldTree: oldDocChildTree,
		newTree: newDocChildTree
	};

};

/*
 * NB This method does not work for diffing historical revisions and will soon
 * be replaced.
 *
 * Get the diff between the old document's internal list and the new document's
 * internal list. The diff is grouped by list group, and each node in each list
 * group is marked as removed, inserted, the same, or changed (in which case the
 * linear diff is given).
 *
 * @return {Object} Internal list diff object
 */
ve.dm.VisualDiff.prototype.getInternalListDiffInfo = function () {
	var i, ilen, diff, internalListDiffGroup,
		group, groupIndexOrder, nodeIndex, item,
		oldDocNodeGroups = this.oldDoc.getInternalList().getNodeGroups(),
		newDocNodeGroups = this.newDoc.getInternalList().getNodeGroups(),
		retainedInternalListItems = {},
		removedInternalListItems = {},
		internalListDiffInfo = [];

	// Find all nodes referenced by the new document's internal list
	for ( group in newDocNodeGroups ) {
		groupIndexOrder = newDocNodeGroups[ group ].indexOrder;
		internalListDiffInfo[ group ] = [];
		for ( i = 0, ilen = groupIndexOrder.length; i < ilen; i++ ) {
			nodeIndex = groupIndexOrder[ i ];
			retainedInternalListItems[ nodeIndex ] = true;
			internalListDiffInfo[ group ].push( {
				indexOrder: i,
				nodeIndex: nodeIndex,
				removed: false
			} );
			internalListDiffInfo[ group ].changes = false; // Becomes true later if there are changes
		}
	}

	// Find all nodes referenced by the old document's internal list
	for ( group in oldDocNodeGroups ) {
		groupIndexOrder = oldDocNodeGroups[ group ].indexOrder;
		for ( i = 0; i < groupIndexOrder.length - 1; i++ ) {
			nodeIndex = groupIndexOrder[ i ];
			if ( retainedInternalListItems[ nodeIndex ] ) {
				continue;
			}
			// TODO: Work out what should happen if the whole list group was removed
			if ( internalListDiffInfo[ group ] === undefined ) {
				internalListDiffInfo[ group ] = [];
				internalListDiffInfo[ group ].changes = false; // Becomes true later
			}
			internalListDiffInfo[ group ].push( {
				indexOrder: i,
				nodeIndex: nodeIndex,
				removed: true
			} );
			removedInternalListItems[ nodeIndex ] = group;
		}
	}

	for ( group in internalListDiffInfo ) {
		internalListDiffGroup = internalListDiffInfo[ group ].sort( function ( a, b ) {
			if ( a.indexOrder === b.indexOrder ) {
				return a.removed ? 1 : -1;
			}
			return a.indexOrder > b.indexOrder ? 1 : -1;
		} );
		for ( i = 0, ilen = internalListDiffGroup.length; i < ilen; i++ ) {
			item = internalListDiffGroup[ i ];
			if ( item.nodeIndex > this.oldDocInternalListNode.children.length - 1 ) {
				// Item was inserted
				item.diff = 1;
				internalListDiffGroup.changes = true;
			} else if ( item.nodeIndex in removedInternalListItems ) {
				// Item was removed
				item.diff = -1;
				internalListDiffGroup.changes = true;
			} else {
				// Item corresponds to the item in the old document's internal list with
				// the same index. They could be the same or changed.
				diff = this.getDocChildDiff(
					this.oldDocInternalListNode.children[ item.nodeIndex ],
					this.newDocInternalListNode.children[ item.nodeIndex ],
					0
				);
				if ( diff.diffInfo && diff.diffInfo.length > 0 ) {
					// Item was changed from an old item
					item.diff = diff;
					internalListDiffGroup.changes = true;
				} else {
					// Item is unchanged
					item.diff = 0;
				}
			}
		}
	}

	return internalListDiffInfo;
};
