/*!
 * VisualEditor UserInterface DiffElement class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Creates a ve.ui.DiffElement object.
 *
 * @class
 * @extends OO.ui.Element
 *
 * @constructor
 * @param {ve.dm.VisualDiff} [visualDiff] Diff to visualize
 */
ve.ui.DiffElement = function VeUiDiffElement( visualDiff ) {
	var diff = visualDiff.diff;

	// Parent constructor
	ve.ui.DiffElement.super.call( this );

	this.$element.addClass( 've-ui-diffElement' );
	this.elementId = 0;

	// Documents
	this.oldDoc = visualDiff.oldDoc;
	this.newDoc = visualDiff.newDoc;
	this.oldDocChildren = this.oldDoc.getDocumentNode().children;
	this.newDocChildren = this.newDoc.getDocumentNode().children;

	// Diff
	this.oldToNew = diff.docChildrenOldToNew;
	this.newToOld = diff.docChildrenNewToOld;
	this.insert = diff.docChildrenInsert;
	this.remove = diff.docChildrenRemove;

	this.$overlays = $( '<div>' ).addClass( 've-ui-diffElement-overlays' );
	this.$content = $( '<div>' ).addClass( 've-ui-diffElement-content' );
	this.$document = $( '<div>' ).addClass( 've-ui-diffElement-document' );
	this.$sidebar = $( '<div>' ).addClass( 've-ui-diffElement-sidebar' );

	this.descriptions = new ve.ui.ChangeDescriptionsSelectWidget();
	this.descriptions.connect( this, { highlight: 'onDescriptionsHighlight' } );
	this.onWindowResizeDebounced = ve.debounce( this.onWindowResize.bind( this ), 250 );
	$( this.getElementWindow() ).on( 'resize', this.onWindowResizeDebounced );

	this.$document.on( {
		mousemove: this.onDocumentMouseMove.bind( this )
	} );

	// DOM
	this.$element
		.append(
			this.$overlays,
			this.$content.append( this.$document ),
			this.$sidebar.append( this.descriptions.$element )
		)
		.addClass( 've-ui-diffElement' );
	this.renderDiff();
	this.$element.toggleClass( 've-ui-diffElement-hasDescriptions', !this.descriptions.isEmpty() );
};

/* Inheritance */

OO.inheritClass( ve.ui.DiffElement, OO.ui.Element );

/* Methods */

ve.ui.DiffElement.prototype.getDiffElementById = function ( elementId ) {
	return this.$document.find( '[data-diff-id=' + elementId + ']' );
};

ve.ui.DiffElement.prototype.onDescriptionsHighlight = function ( item ) {
	var i, l, elementRects, overlayRect;
	if ( this.lastItem ) {
		this.getDiffElementById( this.lastItem.getData() ).css( 'outline', '' );
		this.$overlays.empty();
	}
	if ( item ) {
		overlayRect = this.$overlays[ 0 ].getBoundingClientRect();
		elementRects = ve.ce.FocusableNode.static.getRectsForElement( this.getDiffElementById( item.getData() ), overlayRect ).rects;
		for ( i = 0, l = elementRects.length; i < l; i++ ) {
			this.$overlays.append(
				$( '<div>' ).addClass( 've-ui-diffElement-highlight' ).css( {
					top: elementRects[ i ].top,
					left: elementRects[ i ].left,
					width: elementRects[ i ].width,
					height: elementRects[ i ].height
				} )
			);
		}
		this.lastItem = item;
	}
};

ve.ui.DiffElement.prototype.onDocumentMouseMove = function ( e ) {
	var elementId = $( e.target ).closest( '[data-diff-id]' ).attr( 'data-diff-id' );
	if ( elementId !== undefined ) {
		this.descriptions.highlightItem(
			this.descriptions.getItemFromData( +elementId )
		);
	} else {
		this.descriptions.highlightItem();
	}
};

ve.ui.DiffElement.prototype.onWindowResize = function () {
	this.positionDescriptions();
};

ve.ui.DiffElement.prototype.positionDescriptions = function () {
	var diffElement = this;
	this.descriptions.getItems().forEach( function ( item ) {
		var elementRect, itemRect;

		item.$element.css( 'top', '' );

		itemRect = item.$element[ 0 ].getBoundingClientRect();
		elementRect = diffElement.getDiffElementById( item.getData() )[ 0 ].getBoundingClientRect();

		if ( elementRect.top > itemRect.top ) {
			item.$element.css( 'top', elementRect.top - itemRect.top - 2 );
		}

	} );
};

ve.ui.DiffElement.prototype.destroy = function () {
	$( this.getElementWindow() ).off( 'resize', this.onWindowResizeDebounced );
};

/**
 * Render the diff
 */
ve.ui.DiffElement.prototype.renderDiff = function () {
	var i, j, k, ilen, jlen, klen, nodes, move, elements, spacerNode, noChanges,
		documentNode = this.$document[ 0 ],
		anyChanges = false,
		spacer = false,
		diffQueue = [];

	spacerNode = document.createElement( 'div' );
	spacerNode.setAttribute( 'class', 've-ui-diffElement-spacer' );
	spacerNode.appendChild( document.createTextNode( '⋮' ) );

	ilen = Math.max( this.oldDocChildren.length, this.newDocChildren.length );
	jlen = ilen;

	for ( i = 0, j = 0; i < ilen, j < jlen; i++, j++ ) {
		if ( this.oldDocChildren[ i ] === undefined ) {

			// Everything else in the new doc is an insert
			nodes = this.newDocChildren.slice( j );
			for ( k = 0, klen = nodes.length; k < klen; k++ ) {
				diffQueue.push( [ 'getNodeElements', nodes[ k ], 'insert' ] );
			}

		} else if ( this.newDocChildren[ j ] === undefined ) {

			// Everything else in the old doc is a remove
			nodes = this.oldDocChildren.slice( i );
			for ( k = 0, klen = nodes.length; k < klen; k++ ) {
				diffQueue.push( [ 'getNodeElements', nodes[ k ], 'remove' ] );
			}

		} else if ( this.remove.indexOf( i ) !== -1 ) {

			// The old node is a remove. Decrement the new node index
			// to compare the same new node to the next old node
			diffQueue.push( [ 'getNodeElements', this.oldDocChildren[ i ], 'remove' ] );
			j--;

		} else if ( this.insert.indexOf( j ) !== -1 ) {

			// The new node is an insert. Decrement the old node index
			// to compare the same old node to the next new node
			diffQueue.push( [ 'getNodeElements', this.newDocChildren[ j ], 'insert' ] );
			i--;

		} else if ( typeof this.newToOld[ j ] === 'number' ) {

			// The old and new node are exactly the same, but still
			// need to check if there has been a move
			move = this.newToOld[ j ] === i ? undefined :
				( this.newToOld[ j ] > i ? 'up' : 'down' );
			diffQueue.push( [ 'getNodeElements', this.newDocChildren[ j ], 'none', move ] );

		} else {

			// The new node is modified from the old node. Get the
			// diff and also check if there has been a move
			move = this.newToOld[ j ].node === i ? undefined :
				( this.newToOld[ j ].node > i ? 'up' : 'down' );
			diffQueue.push( [ 'getChangedNodeElements', this.newToOld[ j ].node, move ] );

		}
	}

	function isUnchanged( item ) {
		return !item || ( item[ 2 ] === 'none' && !item[ 3 ] );
	}

	for ( i = 0, ilen = diffQueue.length; i < ilen; i++ ) {
		if (
			!isUnchanged( diffQueue[ i - 1 ] ) ||
			!isUnchanged( diffQueue[ i ] ) ||
			!isUnchanged( diffQueue[ i + 1 ] )
		) {
			spacer = false;
			anyChanges = true;
			elements = this[ diffQueue[ i ][ 0 ] ].apply( this, diffQueue[ i ].slice( 1 ) );
			while ( elements.length ) {
				documentNode.appendChild(
					documentNode.ownerDocument.adoptNode( elements[ 0 ] )
				);
				elements.shift();
			}
		} else if ( !spacer ) {
			spacer = true;
			documentNode.appendChild( spacerNode.cloneNode( true ) );
		}
	}

	if ( !anyChanges ) {
		noChanges = document.createElement( 'div' );
		noChanges.setAttribute( 'class', 've-ui-diffElement-no-changes' );
		noChanges.appendChild( document.createTextNode( ve.msg( 'visualeditor-diff-no-changes' ) ) );
		documentNode.innerHTML = '';
		documentNode.appendChild( noChanges );
	}
};

/**
 * Get the HTML for the diff of a single child of the document node that has
 * been removed from the old document, inserted into the new document, or that
 * has moved but is otherwise unchanged.
 *
 * @param {ve.dm.Node} node The node being diffed. Will be from the old
 * document if it has been removed, or the new document if it has been inserted
 * or moved
 * @param {string} action 'remove', 'insert' or, if moved, 'none'
 * @param {string} [move] 'up' or 'down' if the node has moved
 * @return {HTMLElement[]} HTML to display the action/move
 */
ve.ui.DiffElement.prototype.getNodeElements = function ( node, action, move ) {
	var nodeData, body, element,
		nodeDoc = action === 'remove' ? this.oldDoc : this.newDoc,
		documentSlice = nodeDoc.cloneFromRange( node.getOuterRange() );

	// Get the linear model for the node
	nodeData = documentSlice.data.data;

	// Add the classes to the outer element (in case there was a move)
	nodeData[ 0 ] = this.addAttributesToNode( nodeData[ 0 ], nodeDoc, { 'data-diff-action': action, 'data-diff-move': move } );

	// Get the html for the linear model with classes
	// Doc is always the new doc when inserting into the store
	documentSlice.getStore().merge( this.newDoc.getStore() );
	// forClipboard is true, so that we can render otherwise invisible nodes
	body = ve.dm.converter.getDomFromModel( documentSlice, true ).body;

	if ( action !== 'none' ) {
		element = document.createElement( 'div' );
		element.setAttribute( 'class', 've-ui-diffElement-doc-child-change' );
		while ( body.childNodes.length ) {
			element.appendChild(
				element.ownerDocument.adoptNode( body.childNodes[ 0 ] )
			);
		}
		return [ element ];
	}

	// Convert NodeList to real array
	return Array.prototype.slice.call( body.childNodes );
};

/**
 * Get the HTML for the diff of a single child of the document node that has
 * changed from the old document to the new document. It may also have moved.
 *
 * @param {number} oldNodeIndex The index of the old node in this.oldDocChildren
 * @param {string} [move] 'up' or 'down' if the node has moved
 * @return {HTMLElement[]} HTML elements to display the action/move
 */
ve.ui.DiffElement.prototype.getChangedNodeElements = function ( oldNodeIndex, move ) {
	var i, ilen, j, jlen, k, klen,
		iModified, jModified, element, body,
		newNodeIndex = this.oldToNew[ oldNodeIndex ].node,
		nodeRange = this.newDocChildren[ newNodeIndex ].getOuterRange(),
		documentSlice = this.newDoc.cloneFromRange( nodeRange ),
		nodeData = documentSlice.data.data,
		alreadyProcessed = {
			remove: {},
			insert: {}
		},
		diff = this.oldToNew[ oldNodeIndex ].diff,
		treeDiff = diff.treeDiff,
		diffInfo = diff.diffInfo,
		oldTree = diff.oldTree,
		newTree = diff.newTree,
		oldNodes = oldTree.orderedNodes,
		newNodes = newTree.orderedNodes,
		correspondingNodes = this.oldToNew[ oldNodeIndex ].correspondingNodes;

	/**
	 * Splice in the removed data for the subtree rooted at this node, from the old
	 * document.
	 *
	 * @param {number} nodeIndex The index of this node in the subtree rooted at
	 * this document child
	 */
	function highlightRemovedSubTree( nodeIndex ) {
		var i, ilen, subTreeRootNode, subTreeRootNodeData, siblingNodes,
			newPreviousNodeIndex, oldPreviousNodeIndex, insertIndex, descendants;

		// Get outer data for this node from the old doc and add remove class
		subTreeRootNode = oldNodes[ nodeIndex ];
		subTreeRootNodeData = this.oldDoc.getData( subTreeRootNode.node.getOuterRange() );
		subTreeRootNodeData[ 0 ] = this.addAttributesToNode( subTreeRootNodeData[ 0 ], this.oldDoc, { 'data-diff-action': 'remove' } );

		// If this node is a child of the document node, then it won't have a "previous
		// node" (see below), in which case, insert it just before its corresponding
		// node in the new document.
		if ( subTreeRootNode.index === 0 ) {
			insertIndex = newNodes[ correspondingNodes.oldToNew[ 0 ] ]
				.node.getOuterRange().from - nodeRange.from;
		} else {

			// Find the node that corresponds to the "previous node" of this node. The
			// "previous node" is either:
			// - the rightmost left sibling that corresponds to a node in the new document
			// - or if there isn't one, then this node's parent (which must correspond to
			// a node in the new document, or this node would have been marked already
			// processed)
			siblingNodes = subTreeRootNode.parent.children;
			for ( i = 0, ilen = siblingNodes.length; i < ilen; i++ ) {
				if ( siblingNodes[ i ].index === nodeIndex ) {
					break;
				} else {
					oldPreviousNodeIndex = siblingNodes[ i ].index;
					newPreviousNodeIndex = correspondingNodes.oldToNew[ oldPreviousNodeIndex ] || newPreviousNodeIndex;
				}
			}

			// If previous node was found among siblings, insert the removed subtree just
			// after its corresponding node in the new document. Otherwise insert the
			// removed subtree just inside its parent node's corresponding node.
			if ( newPreviousNodeIndex ) {
				insertIndex = newNodes[ newPreviousNodeIndex ].node.getOuterRange().to - nodeRange.from;
			} else {
				newPreviousNodeIndex = correspondingNodes.oldToNew[ subTreeRootNode.parent.index ];
				insertIndex = newNodes[ newPreviousNodeIndex ].node.getOuterRange().from - nodeRange.from;
			}

		}

		ve.batchSplice( nodeData, insertIndex, 0, subTreeRootNodeData );

		// Mark all children as already processed
		// In the future, may also annotate all descendants
		descendants = oldTree.getNodeDescendants( subTreeRootNode );
		for ( i = 0, ilen = descendants.length; i < ilen; i++ ) {
			alreadyProcessed.remove[ descendants[ i ].index ] = true;
		}
	}

	/**
	 * Mark this node as inserted.
	 *
	 * @param {number} nodeIndex The index of this node in the subtree rooted at
	 * this document child
	 */
	function highlightInsertedSubTree( nodeIndex ) {
		var i, ilen, subTreeRootNode, subTreeRootNodeRangeStart, descendants;

		// Find index of first data element for this node
		subTreeRootNode = newNodes[ nodeIndex ];
		subTreeRootNodeRangeStart = subTreeRootNode.node.getOuterRange().from - nodeRange.from;

		// Add insert class
		nodeData[ subTreeRootNodeRangeStart ] = this.addAttributesToNode(
			nodeData[ subTreeRootNodeRangeStart ], this.newDoc, { 'data-diff-action': 'insert' }
		);

		// Mark all children as already processed
		// In the future, may also annotate all descendants
		descendants = newTree.getNodeDescendants( subTreeRootNode );
		for ( i = 0, ilen = descendants.length; i < ilen; i++ ) {
			alreadyProcessed.insert[ descendants[ i ].index ] = true;
		}
	}

	/**
	 * Mark this node as changed and, if it is a content branch node, splice in
	 * the diff data.
	 *
	 * @param {number} nodeIndex The index of this node in the subtree rooted at
	 * this document child
	 */
	function highlightChangedSubTree( nodeIndex ) {
		var subTreeRootNode, subTreeRootNodeRangeStart, subTreeRootNodeData, annotatedData,
			subTreeDiffInfo = diffInfo[ k ];

		// The new node was changed.
		// Get data for this node
		subTreeRootNode = newNodes[ nodeIndex ];
		subTreeRootNodeRangeStart = subTreeRootNode.node.getOuterRange().from - nodeRange.from;

		if ( subTreeDiffInfo.linearDiff ) {
			// If there is a content change, splice it in
			subTreeRootNodeData = subTreeDiffInfo.linearDiff;
			annotatedData = this.annotateNode( subTreeRootNodeData );
			ve.batchSplice( nodeData, subTreeRootNodeRangeStart + 1, subTreeRootNode.node.length, annotatedData );
		}
		if ( subTreeDiffInfo.attributeChange ) {
			// If there is no content change, just add change class
			nodeData[ subTreeRootNodeRangeStart ] = this.addAttributesToNode(
				nodeData[ subTreeRootNodeRangeStart ], this.newDoc, { 'data-diff-action': 'change' }
			);
		}

		if ( subTreeDiffInfo.attributeChange ) {
			this.compareNodeAttributes( nodeData, subTreeRootNodeRangeStart, this.newDoc, subTreeDiffInfo.attributeChange );
		}
	}

	// Iterate backwards over trees so that changes are made from right to left
	// of the data, to avoid having to update ranges
	ilen = Math.max( oldNodes.length, newNodes.length );
	jlen = ilen;
	for ( i = 0, j = 0; i < ilen && j < jlen; i++, j++ ) {

		iModified = newNodes.length - 1 - i;
		jModified = oldNodes.length - 1 - j;

		if ( iModified < 0 ) {

			// The rest of the nodes have been removed
			if ( !( jModified in alreadyProcessed.remove ) ) {
				highlightRemovedSubTree.call( this, jModified );
			}

		} else if ( jModified < 0 ) {

			// The rest of the nodes have been inserted
			if ( !( iModified in alreadyProcessed.insert ) ) {
				highlightInsertedSubTree.call( this, iModified );
			}

		} else if ( correspondingNodes.newToOld[ iModified ] === jModified ) {

			// The new node was changed.
			for ( k = 0, klen = treeDiff.length; k < klen; k++ ) {
				if ( treeDiff[ k ][ 0 ] === jModified && treeDiff[ k ][ 1 ] === iModified ) {
					if ( !( jModified in alreadyProcessed.remove ) &&
						!( iModified in alreadyProcessed.insert ) ) {

						if ( diffInfo[ k ].replacement ) {

							// We are treating these nodes as removed and inserted
							highlightRemovedSubTree.call( this, jModified );
							highlightInsertedSubTree.call( this, iModified );

						} else {

							// There could be any combination of content, attribute and type changes
							highlightChangedSubTree.call( this, iModified, jModified );

						}

					}
				}
			}

		} else if ( correspondingNodes.newToOld[ iModified ] === undefined ) {

			// The new node was inserted.
			if ( !( iModified in alreadyProcessed.insert ) ) {
				highlightInsertedSubTree.call( this, iModified );
			}
			j--;

		} else if ( correspondingNodes.newToOld[ iModified ] < jModified ) {

			// The old node was removed.
			if ( !( jModified in alreadyProcessed.remove ) ) {
				highlightRemovedSubTree.call( this, jModified );
			}
			i--;

		}
	}

	element = document.createElement( 'div' );
	element.setAttribute( 'class', 've-ui-diffElement-doc-child-change' );
	if ( move ) {
		element.setAttribute( 'data-diff-move', move );
	}

	documentSlice.getStore().merge( this.newDoc.getStore() );
	// forClipboard is true, so that we can render otherwise invisible nodes
	body = ve.dm.converter.getDomFromModel( documentSlice, true ).body;

	while ( body.childNodes.length ) {
		element.appendChild(
			element.ownerDocument.adoptNode( body.childNodes[ 0 ] )
		);
	}

	return [ element ];
};

ve.ui.DiffElement.static.compareAttributes = function ( oldAttributes, newAttributes ) {
	var key,
		attributeChanges = {};

	function compareKeys( a, b ) {
		if ( typeof a === 'object' && typeof b === 'object' ) {
			return ve.compare( a, b );
		} else {
			return a === b;
		}
	}

	for ( key in oldAttributes ) {
		if ( !compareKeys( oldAttributes[ key ], newAttributes[ key ] ) ) {
			attributeChanges[ key ] = { from: oldAttributes[ key ], to: newAttributes[ key ] };
		}
	}
	for ( key in newAttributes ) {
		if ( !oldAttributes.hasOwnProperty( key ) && newAttributes[ key ] !== undefined ) {
			attributeChanges[ key ] = { from: oldAttributes[ key ], to: newAttributes[ key ] };
		}
	}
	return attributeChanges;
};

ve.ui.DiffElement.prototype.compareNodeAttributes = function ( data, offset, doc, attributeChange ) {
	var changes, elementId,
		attributeChanges = this.constructor.static.compareAttributes( attributeChange.oldAttributes, attributeChange.newAttributes );

	changes = ve.dm.modelRegistry.lookup( data[ offset ].type ).static.describeChanges( attributeChanges, attributeChange.newAttributes );
	elementId = this.addChangeDescriptionItem( changes );
	data[ offset ] = this.addAttributesToNode( data[ offset ], doc, { 'data-diff-id': elementId } );
};

ve.ui.DiffElement.prototype.addChangeDescriptionItem = function ( changes ) {
	var i, l,
		elementId = this.elementId,
		$label = $( [] );

	for ( i = 0, l = changes.length; i < l; i++ ) {
		$label = $label.add( $( '<div>' ).text( changes[ i ] ) );
	}
	this.descriptions.addItems( [
		new OO.ui.OptionWidget( {
			label: $label,
			data: elementId,
			classes: [ 've-ui-diffElement-attributeChange' ]
		} )
	] );
	this.elementId++;
	return elementId;
};

/**
 * Add attributes to a node.
 *
 * @param {Object} nodeData Linear data to be highlighted
 * @param {ve.dm.Document} nodeDoc The document from which the data is taken
 * @param {Object} attributes Attributes to set
 * @return {Object} Highlighted linear data
 */
ve.ui.DiffElement.prototype.addAttributesToNode = function ( nodeData, nodeDoc, attributes ) {
	var key, originalDomElementsIndex, domElements,
		node = ve.copy( nodeData );

	// Don't let any nodes get unwrapped
	if ( ve.getProp( node, 'internal', 'generated' ) ) {
		delete node.internal.generated;
	}

	if ( node.originalDomElementsIndex ) {
		domElements = ve.copy( nodeDoc.getStore().value( node.originalDomElementsIndex ) );
		domElements.map( function ( element ) {
			return element.cloneNode( true );
		} );
	} else {
		domElements = [ document.createElement( 'span' ) ];
	}
	for ( key in attributes ) {
		if ( attributes[ key ] !== undefined ) {
			// eslint-disable-next-line no-loop-func
			domElements.forEach( function ( element ) {
				element.setAttribute( key, attributes[ key ] );
			} );
		}
	}
	originalDomElementsIndex = this.newDoc.getStore().index(
		domElements, domElements.map( ve.getNodeHtml ).join( '' )
	);
	node.originalDomElementsIndex = originalDomElementsIndex;

	return node;
};

/**
 * Annotate some data to highlight diff
 *
 * @param {Array} linearDiff Linear diff, mapping arrays of linear data to diff
 * actions (remove, insert or retain)
 * @return {Array} Data with annotations added
 */
ve.ui.DiffElement.prototype.annotateNode = function ( linearDiff ) {
	var i, ilen, range, type, typeAsString, annType, domElementType, changes, added, removed, elementId,
		start = 0, // The starting index for a range for building an annotation
		end, transaction, annotatedLinearDiff,
		domElement, domElements, originalDomElementsIndex,
		diffDoc, diffDocData,
		diffElement = this;

	// Make a new document from the diff
	diffDocData = linearDiff[ 0 ][ 1 ];
	for ( i = 1, ilen = linearDiff.length; i < ilen; i++ ) {
		diffDocData = diffDocData.concat( linearDiff[ i ][ 1 ] );
	}
	diffDoc = this.newDoc.cloneWithData( diffDocData );

	// Add spans with the appropriate attributes for removes and inserts
	// TODO: do insert and remove outside of loop
	for ( i = 0; i < ilen; i++ ) {
		end = start + linearDiff[ i ][ 1 ].length;
		if ( start !== end ) {
			range = { start: start, end: end };
			type = linearDiff[ i ][ 0 ];
			if ( type !== 0 ) {
				switch ( type ) {
					case -1:
						typeAsString = 'remove';
						domElementType = 'del';
						annType = 'textStyle/delete';
						break;
					case 1:
						typeAsString = 'insert';
						domElementType = 'ins';
						annType = 'textStyle/insert';
						break;
					case -2:
						typeAsString = 'change-remove';
						domElementType = 'span';
						annType = 'textStyle/span';
						break;
					case 2:
						typeAsString = 'change-insert';
						domElementType = 'span';
						annType = 'textStyle/span';
						break;
				}
				domElement = document.createElement( domElementType );
				domElement.setAttribute( 'data-diff-action', typeAsString );
				domElements = [ domElement ];

				if ( linearDiff[ i ].annotationChanges ) {
					changes = [];
					added = [];
					removed = [];
					linearDiff[ i ].annotationChanges.forEach( function ( annotationChange ) {
						var attributeChanges;
						if ( annotationChange.oldAnnotation && annotationChange.newAnnotation ) {
							attributeChanges = diffElement.constructor.static.compareAttributes(
								annotationChange.oldAnnotation.getAttributes(),
								annotationChange.newAnnotation.getAttributes()
							);
							changes = changes.concat( ve.dm.modelRegistry.lookup( annotationChange.newAnnotation.getType() ).static.describeChanges(
								attributeChanges, annotationChange.newAnnotation.getAttributes()
							) );
						} else if ( annotationChange.newAnnotation ) {
							added.push( OO.ui.resolveMsg( annotationChange.newAnnotation.constructor.static.description ) || annotationChange.newAnnotation.getType() );
						} else if ( annotationChange.oldAnnotation ) {
							removed.push( OO.ui.resolveMsg( annotationChange.oldAnnotation.constructor.static.description ) || annotationChange.oldAnnotation.getType() );
						}
					} );
					if ( added.length ) {
						changes.push( 'Added: ' + added.join( ', ' ) );
					}
					if ( removed.length ) {
						changes.push( 'Removed: ' + removed.join( ', ' ) );
					}
					if ( changes.length ) {
						elementId = diffElement.addChangeDescriptionItem( changes );
						domElement.setAttribute( 'data-diff-id', elementId );
					}
				}

				originalDomElementsIndex = diffDoc.getStore().index(
					domElements,
					domElements.map( ve.getNodeHtml ).join( '' )
				);

				transaction = ve.dm.TransactionBuilder.static.newFromAnnotation(
					diffDoc, range, 'set',
					ve.dm.annotationFactory.create(
						annType,
						{
							type: annType,
							originalDomElementsIndex: originalDomElementsIndex
						}
					)
				);
				diffDoc.commit( transaction );
			}
		}
		start = end;
	}

	// Merge the stores and get the data
	this.newDoc.getStore().merge( diffDoc.getStore() );
	annotatedLinearDiff = diffDoc.getData( { start: 0, end: diffDoc.getLength() } );

	return annotatedLinearDiff;
};
