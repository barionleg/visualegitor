/*!
 * VisualEditor DataModel TreeModifier class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel tree modifier, following the algorithm in T162762.
 *
 * The top-level process() method applies a transaction to the document in two stages. First,
 * calculateTreeOperations() translates the linear transaction into tree operations; then,
 * applyTreeOperations() updates both the linear model and the document tree simultaneously.
 *
 * Each tree operation takes one of the following forms:
 *
 * { type: 'insertNode', isContent: <boolean>, at: <Path>, element: <OpenElementLinModItem> }
 * { type: 'removeNode', isContent: <boolean>, at: <Path>, element: <OpenElementLinModItem> }
 * { type: 'moveNode', isContent: <boolean>, from: <Path>, to: <Path> }
 * { type: 'insertText', isContent: true, at: <Path>, data: <TextLinModItem[]> }
 * { type: 'removeText', isContent: true, at: <Path>, data: <TextLinModItem[]> }
 * { type: 'moveText', isContent: true, from: <Path>, to: <Path>, length: <number> }
 *
 * Note that moveNode/moveText do not specify what content is being moved, and all the Node
 * operations always operate on a single node at a time.
 *
 * <Path> is number[] representing the tree path from the DocumentNode to the position, except
 * that within ContentBranchNodes, the offset is the linearized offset of the position.
 *
 * <OpenElementLinModItem> is the linear model value representing the node being inserted or
 * removed, like { type: 'paragraph' } .
 *
 * <TextLinModItem[]> is the linear model values representing the text, like
 * [ 'y', 'o', 'u', ' ', [ 'm', [ 'he4e7c54e2204d10b ] ], [ 'e' 'he4e7c54e2204d10b ] ] .
 *
 * The isContent flag is true if the operation is taking place inside a ContentBranchNode
 * (so it is always true for text).
 *
 * NOTE: Instances of this class are not recyclable: you can only call .process( tx ) on them once.
 *
 * @class
 * @constructor
 */
ve.dm.TreeModifier = function VeDmTreeModifier() {
	// XXX we only need these two for dump() in tests
	this.document = null;
	this.insertions = null;

	/**
	 * @property {Array} data Live document linear data
	 */
	this.data = null;

	/**
	 * @property {ve.dm.Node[]} deletions Array (acting as set) of removed nodes
	 */
	this.deletions = null;

	/**
	 * @property {ve.dm.TreeCursor} remover Tree cursor for removals
	 */
	this.remover = null;

	/**
	 * @property {ve.dm.TreeCursor} inserter Tree cursor for insertions
	 */
	this.inserter = null;

	/**
	 * @property {Object[]} treeOps Array of tree ops being built
	 */
	this.treeOps = null;

	/**
	 * @property {number[]} insertedNodes Nodes to be inserted at context
	 */
	this.insertedNodes = null;

	/**
	 * @property {number[]} insertedPositions Position within nodes to be inserted
	 */
	this.insertedPositions = null;

	/**
	 * @property {Object} adjustmentTree Sparse tree, paths as indexes
	 * @property {number} adjustmentTree.inserted Child items inserted at this position
	 * @property {number} adjustmentTree.removed Child items removed at this position
	 * @property {Object} adjustmentTree.i Subtree at position i
	 */
	this.adjustmentTree = null;
};

OO.initClass( ve.dm.TreeModifier );

// Static methods

/**
 * Apply tree operations to document tree and linear data simultaneously
 *
 * @param {boolean} isReversed Whether the transaction is an undo
 * @param {ve.dm.Document} document The document to modify
 * @param {Object[]} treeOps The tree operations
 */
ve.dm.TreeModifier.static.applyTreeOperations = function ( isReversed, document, treeOps ) {
	var i, iLen;
	for ( i = 0, iLen = treeOps.length; i < iLen; i++ ) {
		this.applyTreeOperation( isReversed, document, treeOps[ i ] );
	}
};

/**
 * Apply a tree operation to document tree and linear data simultaneously
 *
 * @param {boolean} isReversed Whether the transaction is an undo
 * @param {ve.dm.Document} document The document to modify
 * @param {Object} treeOp The tree operation
 */
ve.dm.TreeModifier.static.applyTreeOperation = function ( isReversed, document, treeOp ) {
	var wantText, f, t, a, data, node, adjustment,
		changedBranchNodes = [];

	function ensureText( position ) {
		var pre, post, newNode,
			node = position.node,
			offset = position.offset;
		if ( node.type === 'text' ) {
			return position;
		}
		pre = node.children[ offset - 1 ];
		post = node.children[ offset ];
		if ( post && post.type === 'text' ) {
			// Prefer post to pre, because we might want to remove text. (We shouldn't
			// really have two adjacent text nodes, though)
			return { node: post, offset: 0 };
		}
		if ( pre && pre.type === 'text' ) {
			return { node: pre, offset: pre.length };
		}
		// There are no adjacent text nodes; insert one
		if ( !node.hasChildren() ) {
			throw new Error( 'Cannot add a child to ' + node.type + ' node' );
		}
		newNode = new ve.dm.TextNode( 0 );
		node.splice( offset, 0, newNode );
		return { node: newNode, offset: 0 };
	}

	function ensureNotText( position ) {
		var parentNode, parentOffset, length, newNode,
			node = position.node,
			offset = position.offset;
		if ( node.type !== 'text' ) {
			return position;
		}
		parentNode = node.parent;
		parentOffset = node.parent.children.indexOf( node );
		if ( offset === 0 ) {
			// Position before the text node
			return { node: parentNode, offset: parentOffset };
		}
		if ( offset === node.length ) {
			return { node: parentNode, offset: parentOffset + 1 };
		}
		// Else we must split the text node
		length = node.length - offset;
		node.adjustLength( -length );
		newNode = new ve.dm.TextNode( length );
		parentNode.splice( parentOffset + 1, 0, newNode );
		return { node: newNode, offset: 0 };
	}

	function findContentPosition( node, contentOffset ) {
		var i, offset, childLength, child;

		if ( contentOffset === 0 ) {
			return { node: node, offset: 0 };
		}
		// Find the child that will take us up to or past the contentOffset
		offset = 0;
		for ( i = 0; ; i++ ) {
			child = node.children[ i ];
			if ( !child ) {
				throw new Error( 'Node does not reach offset' );
			}
			childLength = child.getOuterLength();
			offset += childLength;
			if ( offset >= contentOffset ) {
				break;
			}
		}
		if ( offset === contentOffset ) {
			return { node: node, offset: i + 1 };
		}
		return { node: child, offset: offset - childLength + contentOffset };
	}

	function prepareSplice( pathAndOffset, isContent, wantText ) {
		var i, iLen, position,
			path = pathAndOffset.slice( 0, -1 ),
			offset = pathAndOffset[ pathAndOffset.length - 1 ],
			node = document.documentNode;

		// Find node
		for ( i = 0, iLen = path.length; i < iLen; i++ ) {
			node = node.children[ path[ i ] ];
		}
		if ( isContent ) {
			// Determine position from (linearized) content offset
			if ( wantText ) {
				position = ensureText( findContentPosition( node, offset ) );
			} else {
				position = ensureNotText( findContentPosition( node, offset ) );
			}
		} else {
			position = { node: node, offset: offset };
		}
		// Get linear offset
		if ( position.node.type === 'text' || position.offset === 0 ) {
			position.linearOffset = position.node.getRange().start + position.offset;
		} else {
			position.linearOffset = node.children[ offset - 1 ].getOuterRange().end;
		}
		return position;
	}

	// Increment the change counter on the closest containing branch node at this offset
	// (This is used when converting to/from HTML, to decide whether loaded metadata offsets
	// need round tripping)
	function markBranchNodeChanged( offset ) {
		var item,
			adjustment = isReversed ? -1 : 1,
			i = offset - 1;

		while ( i >= 0 ) {
			item = document.data.getData( i-- );
			if ( !(
				ve.dm.LinearData.static.isOpenElementData( item ) &&
				ve.dm.nodeFactory.lookup(
					ve.dm.LinearData.static.getType( item )
				).prototype instanceof ve.dm.BranchNode
			) ) {
				continue;
			}
			if ( item.internal && item.internal.changesSinceLoad !== undefined ) {
				// Guard against marking the same node twice
				if ( changedBranchNodes.indexOf( item ) === -1 ) {
					changedBranchNodes.push( item );
					item.internal.changesSinceLoad += adjustment;
				}
			}
			// This is a branch node boundary, so go no further
			break;
		}
	}

	function spliceLinear( offset, remove, data ) {
		var content;
		data = data || [];
		content = ve.batchSplice( document.data, offset, remove, data );
		markBranchNodeChanged( offset );
		return content;
	}

	function canonicalizeTextNodes( node, offset ) {
		var pre = node.children[ offset - 1 ],
			post = node.children[ offset ];
		if ( post && post.type === 'text' && post.length === 0 ) {
			// Remove empty text node
			node.splice( offset, 1 );
			post = node.children[ offset ];
		}
		if ( pre && post && pre.type === 'text' && post.type === 'text' ) {
			pre.adjustLength( post.length );
			node.splice( offset, 1 );
		}
	}

	function checkEqual( actual, expected ) {
		var jActual = JSON.stringify( actual ),
			jExpected = JSON.stringify( expected );
		if ( jActual !== jExpected ) {
			throw new Error( 'Expected ' + jExpected + ' but got ' + jActual );
		}
	}

	wantText = treeOp.type.slice( -4 ) === 'Text';
	f = treeOp.from && prepareSplice( treeOp.from, treeOp.isContent, wantText );
	t = treeOp.to && prepareSplice( treeOp.to, treeOp.isContent, wantText );
	a = treeOp.at && prepareSplice( treeOp.at, treeOp.isContent, wantText );

	// Always adjust linear data before tree, to ensure consistency when node events
	// are emitted.
	if ( treeOp.type === 'removeNode' ) {
		// The node should have no contents, so its outer length should be 2
		data = spliceLinear( a.linearOffset, a.node.getOuterLength() );
		checkEqual( data[ 0 ], treeOp.element );
		a.node.splice( a.offset, 1 );
		canonicalizeTextNodes( a.node, a.offset );
	} else if ( treeOp.type === 'insertNode' ) {
		spliceLinear( a.linearOffset, 0, [ treeOp.element, { type: '/' + treeOp.element.type } ] );
		a.node.splice( a.offset, 0, ve.dm.nodeFactory.createFromElement( treeOp.element ) );
	} else if ( treeOp.type === 'moveNode' ) {
		data = spliceLinear( f.linearOffset, f.node.getOuterLength() );
		node = f.node.splice( f.offset, 1 );
		adjustment = t.linearOffset > f.linearOffset ? data.length : 0;
		spliceLinear( t.linearOffset - adjustment, 0, data );
		t.node.splice( t.offset, node );
	} else if ( treeOp.type === 'removeText' ) {
		data = spliceLinear( a.linearOffset, treeOp.data.length );
		checkEqual( data, treeOp.data );
		a.node.adjustLength( -treeOp.data.length );
		canonicalizeTextNodes( a.node.parent, a.node.parent.children.indexOf( a.node ) );
	} else if ( treeOp.type === 'insertText' ) {
		spliceLinear( a.linearOffset, 0, treeOp.data );
		a.node.adjustLength( treeOp.data.length );
	} else if ( treeOp.type === 'moveText' ) {
		data = spliceLinear( f.linearOffset, treeOp.length );
		f.node.adjustLength( -treeOp.length );
		adjustment = t.linearOffset > f.linearOffset ? data.length : 0;
		spliceLinear( t.linearOffset - adjustment, 0, data );
		t.node.adjustLength( treeOp.length );
	} else {
		throw new Error( 'Unknown tree op type: ' + treeOp.type );
	}
};

/**
 * The top level method: modify document tree according to transaction
 *
 * @param {ve.dm.Document} document The document
 * @param {ve.dm.Transaction} transaction The transaction
 */
ve.dm.TreeModifier.prototype.process = function ( document, transaction ) {
	this.setup( document );
	this.calculateTreeOperations( transaction );
	// XXX Do we need the prior rollback logic? Or not because treeOps is guaranteed to work?
	this.constructor.static.applyTreeOperations( transaction.isReversed, document, this.treeOps );
};

/**
 * Setup state variables
 *
 * @param {ve.dm.Document} document The document to be processed
 */
ve.dm.TreeModifier.prototype.setup = function ( document ) {
	// XXX we only need these two properties for dump() in tests
	this.document = document;
	this.insertions = [];

	// Initialize state
	this.data = document.data;
	this.deletions = [];
	this.remover = new ve.dm.TreeCursor( document.getDocumentNode(), [] );
	this.inserter = new ve.dm.TreeCursor( document.getDocumentNode(), this.deletions );
	this.treeOps = [];
	this.insertedNodes = [];
	this.insertedPositions = [];
	this.adjustmentTree = {};
};

/**
 * Transform linear operations into tree operations
 *
 * @param {ve.dm.Transaction} transaction The transaction
 */
ve.dm.TreeModifier.prototype.calculateTreeOperations = function ( transaction ) {
	var i, iLen,
		linearOps = transaction.operations;
	for ( i = 0, iLen = linearOps.length; i < iLen; i++ ) {
		this.processLinearOperation( linearOps[ i ] );
	}
	this.processImplicitFinalRetain();
};

/**
 * Translate a linear operation into tree operations
 *
 * #processImplicitFinalRetain should be called once all operations have been processed
 *
 * @param {Object} linearOp The linear operation
 */
ve.dm.TreeModifier.prototype.processLinearOperation = function ( linearOp ) {
	var retainLength, i, iLen, item, data;
	if ( linearOp.type === 'retain' ) {
		retainLength = linearOp.length;
		while ( retainLength > 0 ) {
			retainLength -= this.processRetain( retainLength );
		}
	} else if ( linearOp.type === 'replace' ) {
		for ( i = 0, iLen = linearOp.remove.length; i < iLen; i++ ) {
			item = linearOp.remove[ i ];
			if ( item.type ) {
				this.processRemove( item );
				continue;
			}
			// Group the whole current run of text, and process it
			data = [ item ];
			while ( ++i < iLen && !linearOp.remove[ i ].type ) {
				item = linearOp.remove[ i ];
				data.push( item );
			}
			i--;
			this.processRemove( data );
		}
		for ( i = 0, iLen = linearOp.insert.length; i < iLen; i++ ) {
			item = linearOp.insert[ i ];
			if ( item.type ) {
				this.processInsert( item );
				continue;
			}
			// Group the whole current run of text, and process it
			data = [ item ];
			while ( ++i < iLen && !linearOp.insert[ i ].type ) {
				item = linearOp.insert[ i ];
				data.push( item );
			}
			i--;
			this.processInsert( data );
		}
	}
	// Else the linear operation type must be 'attribute': do nothing
};

/**
 * Retain to the end of the content
 */
ve.dm.TreeModifier.prototype.processImplicitFinalRetain = function () {
	// Pretend there is an implicit retain to the end of the document
	// TODO: fix our tests so this is unnecessary, then check for exhaustion instead
	var node, retainLength, item;
	while ( true ) {
		node = this.remover.node;
		if ( !node || (
			node === this.remover.root &&
			this.remover.offset === node.children.length
		) ) {
			return;
		}
		if ( node.type === 'text' ) {
			// Retain all remaining text; if there is no remaining text then
			// retain a single offset.
			retainLength = Math.max( 1, node.length - this.remover.offset );
		} else if ( !node.hasChildren() ) {
			retainLength = 1;
		} else {
			item = node.children[ this.remover.offset ];
			retainLength = item ? item.getOuterLength() : 1;
		}
		this.processRetain( retainLength );
	}
};

/**
 * Test whether both pointers point to the same location
 *
 * @return {boolean} True if the paths and offsets are identical
 */
ve.dm.TreeModifier.prototype.cursorsMatch = function () {
	var removerPosition, inserterPosition;
	if ( this.insertedPositions.length > 0 ) {
		return false;
	}
	removerPosition = this.getRemoverPosition( {
		path: this.remover.path,
		offset: this.remover.offset,
		node: this.remover.node
	} );
	inserterPosition = this.getInserterPosition();
	return JSON.stringify( removerPosition ) === JSON.stringify( inserterPosition );
};

/**
 * Process the retention of content passed by one step of the remover
 *
 * @param {number} maxLength The maximum amount of content to retain
 * @return {number} The amount of content retained
 */
ve.dm.TreeModifier.prototype.processRetain = function ( maxLength ) {
	var removerStep, inserterStep, element, inserterPosition,
		remover = this.remover,
		inserter = this.inserter;

	if ( this.cursorsMatch() ) {
		// Pointers are in the same location, so advance them together.
		// This is the only way both pointers can ever enter the same node;
		// in any other case, a node entered at an 'open' tag by one pointer
		// is marked as either as a deletion or a creation, so the other
		// pointer will not follow.
		removerStep = remover.stepAtMost( maxLength );
		inserterStep = inserter.stepAtMost( maxLength );
		if ( !removerStep ) {
			throw new Error( 'Remover past end' );
		}
		if ( !inserterStep ) {
			throw new Error( 'Inserter past end' );
		}
		if ( !this.cursorsMatch() ) {
			throw new Error( 'Remover and inserter unexpectedly diverged' );
		}
		return removerStep.length;
	}
	// Else pointers are not in the same location (in fact they cannot lie in the
	// same node)
	removerStep = remover.stepAtMost( maxLength );
	if ( removerStep.type === 'crosstext' ) {
		this.pushTreeOp( {
			type: 'moveText',
			isContent: true,
			from: this.getRemoverPosition( removerStep ),
			to: this.getInserterPosition(),
			length: removerStep.length
		} );
		if ( this.insertedPositions.length ) {
			this.insertedPositions[ this.insertedPositions.length - 1 ] += removerStep.length;
		}
	} else if ( removerStep.type === 'cross' ) {
		inserterPosition = this.getInserterPosition();
		this.pushTreeOp( {
			type: 'moveNode',
			isContent: this.isNodeContent( removerStep.node ),
			from: this.getRemoverPosition( removerStep ),
			to: inserterPosition
		} );
		if ( this.insertedPositions.length ) {
			this.markAdjustmentNodeComplete( inserterPosition );
			this.insertedPositions[ this.insertedPositions.length - 1 ]++;
		}
	} else if ( removerStep.type === 'open' ) {
		this.deletions.push( removerStep.item );
		// Clone last open and step in
		element = removerStep.item.getClonedElement( true );
		this.pushTreeOp( {
			type: 'insertNode',
			isContent: this.isNodeContent( removerStep.node ),
			at: this.getInserterPosition(),
			element: element
		} );
		this.insertedNodes.push( element );
		this.insertedPositions.push( 0 );
	} else if ( removerStep.type === 'close' ) {
		if ( this.insertedPositions.length ) {
			this.markAdjustmentNodeComplete( this.getRemoverPosition( removerStep ).slice( 0, -1 ) );
			this.insertedNodes.pop();
			this.insertedPositions.pop();
			if ( this.insertedPositions.length ) {
				this.insertedPositions[ this.insertedPositions.length - 1 ]++;
			}
		} else {
			if ( inserter.node.type === 'text' ) {
				inserter.stepOut();
			}
			inserterStep = inserter.stepOut();
			if ( inserterStep.item.type !== removerStep.item.type ) {
				throw new Error( 'Expected ' + removerStep.item.type + ', not ' +
	inserterStep.item.type );
			}
		}
		this.pushRemoveLastIfInDeletions();
	}
	return removerStep.length;
};

/**
 * Process the removal of some items
 *
 * @param {Object|Array} itemOrData An open tag, a close tag, or an array of text items
 */
ve.dm.TreeModifier.prototype.processRemove = function ( itemOrData ) {
	var start,
		cursorsMatch = this.cursorsMatch(),
		length = itemOrData.length || 1,
		step = this.remover.stepAtMost( length );

	if ( cursorsMatch && ( step.type === 'cross' || step.type === 'crosstext' ) ) {
		this.inserter.stepAtMost( length );
	}

	if ( step.type === 'crosstext' ) {
		start = step.node.getRange().start + step.offset;
		this.pushTreeOp( {
			type: 'removeText',
			isContent: true,
			at: this.getRemoverPosition( step ),
			data: this.data.slice( start, start + step.length )
		} );
	} else if ( step.type === 'cross' ) {
		this.pushRemoveLast();
	} else if ( step.type === 'open' ) {
		this.deletions.push( step.item );
	} else if ( step.type === 'close' ) {
		this.pushRemoveLastIfInDeletions();
	}
};

/**
 * Process the insertion an open tag, a close tag, or an array of text items
 *
 * @param {Object|Array} itemOrData An open tag, a close tag, or an array of text items
 */
ve.dm.TreeModifier.prototype.processInsert = function ( itemOrData ) {
	var item, type, data, element, step,
		inserter = this.inserter;

	if ( itemOrData.type ) {
		item = itemOrData;
		type = item.type.slice( 0, 1 ) === '/' ? 'close' : 'open';
	} else {
		data = itemOrData;
		type = 'crosstext';
	}

	if ( type === 'open' ) {
		if ( inserter.node.type === 'text' ) {
			// Step past the end of the text node, even if that skips past some
			// content (in which case the remover logically must later cross that
			// content in either processRemove or processRetain).
			inserter.stepOut();
		}
		element = ve.copy( item );
		this.pushTreeOp( {
			type: 'insertNode',
			isContent: this.insertedNodes.length > 0 ?
				this.isTypeContent( this.insertedNodes[ this.insertedNodes.length - 1 ].type ) :
				this.isNodeContent( this.inserter.node ),
			at: this.getInserterPosition(),
			element: element
		} );
		this.insertedNodes.push( element );
		this.insertedPositions.push( 0 );
	} else if ( type === 'crosstext' ) {
		this.pushTreeOp( {
			type: 'insertText',
			isContent: true,
			at: this.getInserterPosition(),
			data: ve.copy( data )
		} );
		if ( this.insertedPositions.length ) {
			this.insertedPositions[ this.insertedPositions.length - 1 ] += data.length;
		}
	} else if ( type === 'close' ) {
		if ( this.insertedPositions.length ) {
			this.markAdjustmentNodeComplete( this.getInserterPosition().slice( 0, -1 ) );
			this.insertedNodes.pop();
			this.insertedPositions.pop();
			if ( this.insertedPositions.length ) {
				this.insertedPositions[ this.insertedPositions.length - 1 ]++;
			}
		} else {
			// Step past the next close tag, even if that skips past some content (in which
			// case the remover logically must later cross that content in either
			// processRemove or processRetain).
			if ( inserter.node.type === 'text' ) {
				inserter.stepOut();
			}
			step = inserter.stepOut();
			if ( step.item.type !== item.type.slice( 1 ) ) {
				throw new Error( 'Expected closing for ' + step.item.type +
					' but got closing for ' + item.type.slice( 1 ) );
			}
		}
	}
};

ve.dm.TreeModifier.prototype.pushRemoveLast = function () {
	var range,
		step = this.remover.lastStep;
	if ( step.item.type === 'text' ) {
		range = step.item.getRange();
		this.pushTreeOp( {
			type: 'removeText',
			isContent: true,
			at: this.getRemoverPosition( step ),
			data: this.data.slice( range.start, range.end )
		} );
	} else {
		this.pushTreeOp( {
			type: 'removeNode',
			isContent: this.isNodeContent( step.node ),
			at: this.getRemoverPosition( step ),
			element: step.item.getClonedElement( true )
		} );
	}
};

ve.dm.TreeModifier.prototype.pushRemoveLastIfInDeletions = function () {
	var i = this.deletions.indexOf( this.remover.lastStep.item );
	if ( i !== -1 ) {
		this.pushRemoveLast();
	}
};

ve.dm.TreeModifier.prototype.pushTreeOp = function ( treeOp ) {
	var length;
	this.treeOps.push( treeOp );
	if ( treeOp.type === 'moveText' ) {
		this.modifyAdjustmentTree( treeOp.from, -treeOp.length, false );
	} else if ( treeOp.type === 'moveNode' ) {
		this.modifyAdjustmentTree( treeOp.from, -1, true );
		if ( this.insertedPositions.length === 0 ) {
			this.modifyAdjustmentTree( treeOp.to, length, false );
		}
	} else if ( treeOp.type === 'insertNode' || treeOp.type === 'insertText' ) {
		length = treeOp.type === 'insertNode' ? 1 : treeOp.data.length;
		if ( this.insertedPositions.length === 0 ) {
			this.modifyAdjustmentTree( treeOp.at, length, false );
		}
	} else if ( treeOp.type === 'removeText' ) {
		this.modifyAdjustmentTree( treeOp.at, -treeOp.data.length, false );
	} else if ( treeOp.type === 'removeNode' ) {
		this.modifyAdjustmentTree( treeOp.at, -1, true );
	}
};

ve.dm.TreeModifier.prototype.findOrCreateAdjustmentNode = function ( position ) {
	var i, len, offset,
		adjustmentNode = this.adjustmentTree;
	for ( i = 0, len = position.length; i < len; i++ ) {
		offset = position[ i ];
		if ( !adjustmentNode[ offset ] ) {
			adjustmentNode[ offset ] = {};
		}
		adjustmentNode = adjustmentNode[ offset ];
	}
	return adjustmentNode;
};

ve.dm.TreeModifier.prototype.markAdjustmentNodeComplete = function ( position ) {
	var adjustmentNode = this.findOrCreateAdjustmentNode( position );
	adjustmentNode.complete = true;
};

ve.dm.TreeModifier.prototype.modifyAdjustmentTree = function ( position, diff, deleteDescendants ) {
	var i,
		adjustmentNode = this.findOrCreateAdjustmentNode( position );
	if ( diff > 0 ) {
		adjustmentNode.inserted = ( adjustmentNode.inserted || 0 ) + diff;
	} else {
		adjustmentNode.removed = ( adjustmentNode.removed || 0 ) - diff;
	}
	if ( deleteDescendants ) {
		for ( i in adjustmentNode ) {
			if ( i === 'inserted' || i === 'removed' ) {
				continue;
			}
			delete adjustmentNode[ i ];
		}
	}
};

ve.dm.TreeModifier.prototype.getRemoverPosition = function ( step ) {
	return this.getAdjustedPosition(
		this.getRawPosition( step.path, step.offset, step.node ),
		false
	);
};

ve.dm.TreeModifier.prototype.getInserterPosition = function () {
	return this.getAdjustedPosition(
		this.getRawPosition(
			this.inserter.path,
			this.inserter.offset,
			this.inserter.node
		),
		true,
		this.insertedPositions.length > 0
	).concat( this.insertedPositions );
};

/**
 * @param {number[]} path Path to a node
 * @param {number} offset Offset within the node
 * @param {ve.dm.Node} node The node
 * @return {number[]} The path, with offsets inside a ContentBranchNode linearised
 */
ve.dm.TreeModifier.prototype.getRawPosition = function ( path, offset, node ) {
	var i, len, nodesBefore;
	if ( node.parent instanceof ve.dm.ContentBranchNode ) {
		nodesBefore = node.parent.children;
		path = path.slice();
		len = path.pop();
	} else if ( node instanceof ve.dm.ContentBranchNode ) {
		nodesBefore = node.children;
		len = offset;
		offset = 0;
	}

	if ( nodesBefore ) {
		for ( i = 0; i < len; i++ ) {
			offset += nodesBefore[ i ].type === 'text' ? nodesBefore[ i ].length : 1;
		}
	}
	return path.concat( offset );
};

ve.dm.TreeModifier.prototype.getAdjustedPosition = function ( position, isInserter /* , isInsideInsertedNode */ ) {
	var i, iLen, j, jLen, childNode, inserted, removed,
		node = this.adjustmentTree;

	position = position.slice();
	// Adjust each offset in the path so inserted nodes are counted
	for ( i = 0, iLen = position.length; i < iLen; i++ ) {
		for ( j = 0, jLen = position[ i ] + 1; j < jLen; j++ ) {
			childNode = node[ j ];
			if ( !childNode ) {
				continue;
			}
			inserted = childNode.inserted || 0;
			removed = childNode.removed || 0;

			if ( i < iLen - 1 || j < jLen - 1 ) {
				// This offset is strictly before position
				position[ i ] += inserted - removed;
			} else {
				if ( !isInserter ) {
					position[ i ] -= removed;
				}
				if ( childNode.complete ) {
					position[ i ] += inserted;
				}
			}
		}
		node = node[ position[ i ] ];
		if ( !node ) {
			break;
		}
	}
	return position;
};

ve.dm.TreeModifier.prototype.isTypeContent = function ( type ) {
	return !!ve.dm.nodeFactory.canNodeContainContent( type );
};

ve.dm.TreeModifier.prototype.isNodeContent = function ( node ) {
	return !!node.constructor.static.canContainContent;
};

/* Initialization */

ve.dm.treeModifier = new ve.dm.TreeModifier();
