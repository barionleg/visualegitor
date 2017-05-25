/*!
 * VisualEditor DataModel TreeModifier class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel tree modifier, following the algorithm in T162762.
 *
 * This class applies operations from a transaction to the document tree, after the linear model
 * has already been updated.
 *
 * NOTE: Instances of this class are not recyclable: you can only call .process() on them once.
 *
 * @class
 * @param {ve.dm.Document} doc Document
 * @param {ve.dm.Transaction} transaction Transaction
 * @constructor
 */
ve.dm.TreeModifier = function VeDmTreeModifier( doc, transaction ) {
	// Properties
	this.document = doc;
	this.data = doc.data;
	this.transaction = transaction;
	this.operations = transaction.getOperations();
	this.deletions = [];
	this.insertions = [];
	this.remover = new ve.dm.TreeCursor( doc.getDocumentNode(), this.insertions );
	this.inserter = new ve.dm.TreeCursor( doc.getDocumentNode(), this.deletions );
	this.undoSplices = [];
};

/**
 * The top level method: modify the tree according to the transaction.
 *
 * See T162762 for algorithm.
 */
ve.dm.TreeModifier.prototype.process = function () {
	var i, iLen;
	for ( i = 0, iLen = this.operations.length; i < iLen; i++ ) {
		this.processOperation( this.operations[ i ] );
	}
	this.processImplicitFinalRetain();
	this.applyDeletions();
};

/**
 * Modify the tree according to an operation
 *
 * #processImplicitFinalRetain then #applyDeletions should be called once all
 * operations have been processed
 *
 * @param {Object} op The operation
 */
ve.dm.TreeModifier.prototype.processOperation = function ( op ) {
	var retainLength, i, iLen, data, item;
	if ( op.type === 'retain' ) {
		retainLength = op.length;
		while ( retainLength > 0 ) {
			retainLength -= this.processRetain( retainLength );
		}
	} else if ( op.type === 'replace' ) {
		for ( i = 0, iLen = op.remove.length; i < iLen; i++ ) {
			item = op.remove[ i ];
			if ( item.type ) {
				this.processRemove( item );
				continue;
			}
			// Group the whole current run of text, and process it
			data = [ item ];
			while ( ++i < iLen && !op.remove[ i ].type ) {
				item = op.remove[ i ];
				data.push( item );
			}
			i--;
			this.processRemove( data );
		}
		for ( i = 0, iLen = op.insert.length; i < iLen; i++ ) {
			item = op.insert[ i ];
			if ( item.type ) {
				this.processInsert( item );
				continue;
			}
			// Group the whole current run of text, and process it
			data = [ item ];
			while ( ++i < iLen && !op.insert[ i ].type ) {
				item = op.insert[ i ];
				data.push( item );
			}
			i--;
			this.processInsert( data );
		}
	}
	// Else another type of operation: do nothing
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
		if ( node instanceof ve.dm.TextNode ) {
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
 * Apply #ve.batchSplice to the linear data, and push reversal to the undo stack
 *
 * @param {number} offset Offset to splice at. This MUST NOT be negative, unlike Array#splice
 * @param {number} remove Number of elements to remove at the offset
 * @param {Array} data Array of items to insert at the offset
 * @return {Array} Array of items removed
 */
ve.dm.TreeModifier.prototype.spliceLinear = function ( offset, remove, data ) {
	var removed = ve.batchSplice( this.data, offset, remove, data );
	this.undoSplices.push( [ offset, data.length, removed ] );
	return removed;
};

/**
 * Undo the linear splices applied
 */
ve.dm.TreeModifier.prototype.undoLinearSplices = function () {
	var i, splice;
	for ( i = this.undoSplices.length - 1; i >= 0; i-- ) {
		splice = this.undoSplices[ i ];
		ve.batchSplice( this.data, splice[ 0 ], splice[ 1 ], splice[ 2 ] );
	}
};

ve.dm.TreeModifier.prototype.applyDeletions = function () {
	var i, node, parent, idx, pre, post,
		// Clone to avoid really obscure debugging issues if splice calls back into
		// TreeModifier somehow (at the time of writing that's impossible but hey)
		deletions = this.deletions.slice();
	// Iterate in reverse order to ensure a node's parent is not (yet) deleted. This works
	// because the deletions are sorted in document order (they are appended by the remover
	// when it crosses open tags), so a node cannot appear before its parent.
	for ( i = deletions.length - 1; i >= 0; i-- ) {
		node = deletions[ i ];
		parent = node.parent;
		idx = parent.children.indexOf( node );
		parent.splice( idx, 1 );
		pre = parent.children[ idx - 1 ];
		post = parent.children[ idx ];
		if (
			pre instanceof ve.dm.TextNode &&
			post instanceof ve.dm.TextNode &&
			deletions.indexOf( pre ) === -1
		) {
			parent.splice( idx, 1 );
			pre.adjustLength( post.length );
		}
	}
};

/**
 * Ensure the cursor is in a text node, without changing the linear offset
 *
 * This may require creating a new text node
 */
ve.dm.TreeModifier.prototype.ensureTextNode = function () {
	if ( this.inserter.node instanceof ve.dm.TextNode ) {
		return;
	}
	if ( !this.inserter.node.hasChildren() ) {
		throw new Error( 'Cannot ensureTextNode in childless node' );
	}
	// Position the cursor inside a text node
	if ( this.inserter.node.children[ this.inserter.offset ] instanceof ve.dm.TextNode ) {
		// The next node is a text node; step in
		if ( this.cursorsMatch() ) {
			this.remover.stepIn();
		}
		this.inserter.stepIn();
	} else if ( this.inserter.node.children[ this.inserter.offset - 1 ] instanceof ve.dm.TextNode ) {
		// The previous node is a text node; move backwards, step in and jump to the end
		if ( this.cursorsMatch() ) {
			this.remover.offset--;
			this.remover.stepIn();
			this.remover.offset = this.remover.node.length;
		}
		this.inserter.offset--;
		this.inserter.stepIn();
		this.inserter.offset = this.inserter.node.length;
	} else {
		// There are no adjacent text nodes; insert one and step in
		this.insertNode( new ve.dm.TextNode(), [] );
		if ( this.cursorsMatch() ) {
			this.remover.stepIn();
		}
		this.inserter.stepIn();
	}
};

/**
 * Ensure the inserter is not in a text node, without changing the linear offset
 *
 * This may require splitting the text node
 */
ve.dm.TreeModifier.prototype.ensureNotTextNode = function () {
	var length, newNode,
		node = this.inserter.node,
		offset = this.inserter.offset;
	if ( !( node instanceof ve.dm.TextNode ) ) {
		return;
	}
	this.inserter.stepOut();
	if ( offset === 0 ) {
		// Position the cursor before the text node
		this.inserter.offset--;
	} else if ( offset < node.length ) {
		// Split the node
		length = this.inserter.node.length - offset;
		node.adjustLength( -length );
		this.remover.adjustPath( this.inserter.path, this.inserter.offset, 0, -length );
		newNode = new ve.dm.TextNode( length );
		this.insertNode( newNode );
		this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1, length );
		if ( this.remover.node === node && this.remover.offset > offset ) {
			// Logically, this should not be possible
			throw new Error( 'Remover in split portion of text node' );
		}
	}
};

/**
 * Remove the node and linear data at the remove cursor, without moving the cursor
 *
 * Joins text nodes automatically as appropriate
 *
 * @return {Object} The removed content
 * @return {ve.dm.Node} removed.node The removed node
 * @return {Array} removed.data The removed linear data
 */
ve.dm.TreeModifier.prototype.removeNode = function () {
	var node, data, pre, post, preLength;

	// Adjust linear data before tree, to ensure consistency when node events are emitted
	node = this.remover.node.children[ this.remover.offset ];
	data = this.spliceLinear( this.remover.linearOffset, node.getOuterLength(), [] );
	this.remover.node.splice( this.remover.offset, 1 );
	this.inserter.adjustPath( this.remover.path, this.remover.offset, -1, -node.getOuterLength() );

	// If the removal caused two text nodes to be adjacent, then merge them
	pre = this.remover.node.children[ this.remover.offset - 1 ];
	post = this.remover.node.children[ this.remover.offset ];
	if ( pre instanceof ve.dm.TextNode && post instanceof ve.dm.TextNode ) {
		// Lengthen the text node before the remover, and remove the text node after it

		// TODO: these operations are not tree synchronization safe. Should do two
		// linear splices to match the tree operations.
		preLength = pre.length;

		if ( this.inserter.node === post ) {
			this.inserter.node = pre;
			this.inserter.offset += preLength;
			pre.adjustLength( post.length );
			this.remover.node.splice( this.remover.offset, 1 );
		} else {
			pre.adjustLength( post.length );
			this.inserter.adjustPath( this.remover.path, this.remover.offset, 0, post.length );
			this.remover.node.splice( this.remover.offset, 1 );
			this.inserter.adjustPath( this.remover.path, this.remover.offset, -1, -post.length );
		}
		this.remover.nodes.push( pre );
		this.remover.node = pre;
		this.remover.path.push( this.remover.offset - 1 );
		this.remover.offset = preLength;
	}
	return { node: node, data: data };
};

/**
 * Insert a node at the insert cursor, without moving the cursor
 *
 * Splits text nodes automatically as appropriate
 *
 * @param {ve.dm.Node} node The node to insert
 * @param {Array} data The data to insert
 */
ve.dm.TreeModifier.prototype.insertNode = function ( node, data ) {
	this.ensureNotTextNode();
	if ( !this.inserter.node.hasChildren() ) {
		throw new Error( 'Cannot add a child to ' + this.inserter.node.type + ' node' );
	}
	// Adjust linear data before tree, to ensure consistency when node events are emitted
	this.spliceLinear( this.inserter.linearOffset, 0, data );
	this.inserter.node.splice( this.inserter.offset, 0, node );
	this.insertions.push( node );
	this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1, data.length );
};

/**
 * Test whether both pointers are in the same node
 *
 * @return {boolean} True if the paths are identical
 */
ve.dm.TreeModifier.prototype.pathsMatch = function () {
	return this.remover.node && this.remover.node === this.inserter.node;
};

/**
 * Test whether both pointers point to the same location
 *
 * @return {boolean} True if the paths and offsets are identical
 */
ve.dm.TreeModifier.prototype.cursorsMatch = function () {
	return this.pathsMatch() && this.remover.offset === this.inserter.offset;
};

/**
 * Process the retention of content passed by one step of the remover
 *
 * @param {number} maxLength The maximum amount of content to retain
 * @return {number} The amount of content retained
 */
ve.dm.TreeModifier.prototype.processRetain = function ( maxLength ) {
	var removerStep, inserterStep,
		remover = this.remover,
		inserter = this.inserter;

	remover.normalize();
	inserter.normalize();
	if ( this.cursorsMatch() ) {
		// Pointers are in the same location, so advance them together.
		// This is the only way both pointers can ever enter the same node;
		// in any other case, a node entered at an 'open' tag by one pointer
		// is marked as either as a deletion or a creation, so the other
		// pointer will not follow.
		removerStep = remover.stepAtMost( maxLength );
		inserterStep = inserter.stepAtMost( maxLength );
		if ( !removerStep || !inserterStep ) {
			throw new Error( 'Remover or inserter past end' );
		}
		if ( removerStep.length !== inserterStep.length ) {
			throw new Error( 'Remover and inserter unexpectedly diverged' );
		}
		if ( removerStep.type === 'close' ) {
			this.removeLastIfInDeletions();
		}
		return removerStep.length;
	}
	// Else pointers are not in the same location (in fact they cannot lie in the
	// same node)
	removerStep = remover.stepAtMost( maxLength );
	if ( removerStep.type === 'crosstext' ) {
		this.moveLastCrossText();
	} else if ( removerStep.type === 'cross' ) {
		this.moveLast();
	} else if ( removerStep.type === 'open' ) {
		this.cloneLastOpen();
		this.inserter.stepIn();
		this.deletions.push( removerStep.item );
	} else if ( removerStep.type === 'close' ) {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		inserterStep = inserter.stepOut();
		// TODO check the steps match
		if ( this.deletions.indexOf( removerStep.item ) !== -1 ) {
			this.removeLast();
			this.deletions.splice( this.deletions.indexOf( removerStep.item ), 1 );
		}
	}
	return removerStep.length;
};

/**
 * Process the removal of some items
 *
 * @param {Object|Array} data Either an open/close tag, or an array of text items
 */
ve.dm.TreeModifier.prototype.processRemove = function ( data ) {
	var expected, removed,
		step = this.remover.stepAtMost( data.length || 1 );

	function takeFirst( charOrArray ) {
		return charOrArray[ 0 ];
	}

	if ( step.type === 'crosstext' ) {
		removed = this.removeLastCrossText();
		removed = removed.map( takeFirst ).join( '' );
		expected = data.map( takeFirst ).join( '' );
		if ( removed !== expected ) {
			throw new Error( 'Expected to remove "' + expected +
				'" but actually removed "' + removed + '"' );
		}
	} else if ( step.type === 'cross' ) {
		// TODO: verify removed content
		this.removeLast();
	} else if ( step.type === 'open' ) {
		this.deletions.push( step.item );
	}
	// Else step.type === 'close': do nothing
	this.removeLastIfInDeletions();
	// TODO: verify removed content
};

/**
 * Process the insertion of one item
 *
 * @param {Object|Array} data Either an open/close tag, or an array of text items
 */
ve.dm.TreeModifier.prototype.processInsert = function ( data ) {
	var step,
		inserter = this.inserter,
		type = data.type ? ( data.type.slice( 0, 1 ) === '/' ? 'close' : 'open' ) : 'crosstext';
	if ( type === 'open' ) {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			// Step past the end of the text node, even if that skips past some
			// content (in which case the remover logically must later cross that
			// content in either processRemove or processRetain).
			inserter.stepOut();
		}
		this.create( data );
		inserter.stepIn();
	} else if ( type === 'crosstext' ) {
		this.insertText( data );
	} else if ( type === 'close' ) {
		// Step past the next close tag, even if that skips past some content (in which
		// case the remover logically must later cross that content in either
		// processRemove or processRetain).
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		step = inserter.stepOut();
		if ( step.item.type !== data.type.slice( 1 ) ) {
			throw new Error( 'Expected close tag for ' + data.type.slice( 1 ) +
				', not ' + step.item.type );
		}
	}
};

/**
 * Clone the node just opened by the remover, and insert it at the inserter
 */
ve.dm.TreeModifier.prototype.cloneLastOpen = function () {
	var element, node,
		step = this.remover.lastStep;
	if ( step.type !== 'open' ) {
		throw new Error( 'Expected step of type open, not ' + step.type );
	}
	element = step.item.getClonedElement();
	node = ve.dm.nodeFactory.createFromElement( element );
	if ( this.inserter.node instanceof ve.dm.TextNode ) {
		this.inserter.stepOut();
	}
	// This will crash if not a BranchNode (showing the tx is invalid)
	this.insertNode( node, [ element, { type: '/' + step.item.type } ] );
};

/**
 * Remove the node just crossed or closed by the remover, and its linear data
 *
 * @return {Object} The removed content
 * @return {ve.dm.Node} return.node The removed node
 * @return {Array} return.data The removed linear data
 */
ve.dm.TreeModifier.prototype.removeLast = function () {
	var step = this.remover.lastStep;
	if ( step.type !== 'cross' && step.type !== 'close' ) {
		throw new Error( 'Expected step of type cross/close, not ' + step.type );
	}
	this.remover.offset--;
	this.remover.linearOffset -= step.item.getOuterLength();
	return this.removeNode();
};

/**
 * Remove the node just crossed or closed by the remover, if it is in the deletions list
 *
 * Also remove its linear data
 */
ve.dm.TreeModifier.prototype.removeLastIfInDeletions = function () {
	var step = this.remover.lastStep;
	if (
		( step.type === 'cross' || step.type === 'close' ) &&
		this.deletions.indexOf( step.item ) !== -1
	) {
		this.removeLast();
		this.deletions.splice( this.deletions.indexOf( step.item ), 1 );
	}
};

/**
 * Remove the text just crossed or closed by the remover
 *
 * @return {Array} The linear data removed
 */
ve.dm.TreeModifier.prototype.removeLastCrossText = function () {
	var pathsMatch, data,
		step = this.remover.lastStep,
		length = step.length,
		node = this.remover.node,
		offset = this.remover.offset;
	if ( step.type !== 'crosstext' ) {
		throw new Error( 'Expected step of type crosstext, not ' + step.type );
	}
	this.remover.offset -= length;
	this.remover.linearOffset -= length;

	this.inserter.normalize();
	pathsMatch = this.pathsMatch();
	if ( pathsMatch ) {
		if ( this.inserter.offset >= offset + length ) {
			this.inserter.offset -= length;
			this.inserter.linearOffset -= length;
		} else if ( this.inserter.offset > offset ) {
			throw new Error( 'Inserter lies in the removed range' );
		}
	}
	// Adjust linear data before tree, to ensure consistency when node events are emitted
	data = this.spliceLinear( this.remover.linearOffset, length, [] );
	node.adjustLength( -length );
	this.inserter.adjustPath( this.remover.path, this.remover.offset, 0, -length );
	if ( node.length === 0 ) {
		// Remove empty text node
		if ( pathsMatch ) {
			this.inserter.stepOut();
			this.inserter.offset--;
		}
		this.remover.stepOut();
		this.remover.offset--;
		this.removeNode();
	}
	return data;
};

/**
 * Move the text crossed at the remover's last step to the inserter
 */
ve.dm.TreeModifier.prototype.moveLastCrossText = function () {
	var data;
	if (
		this.remover.node === this.inserter.node &&
		this.remover.offset < this.inserter.offset
	) {
		throw new Error( 'Ambiguous text move within the same node' );
	}
	data = this.removeLastCrossText();
	this.insertText( data );
};

/**
 * Move the content crossed at the remover's last step to the inserter
 */
ve.dm.TreeModifier.prototype.moveLast = function () {
	var moving = this.removeLast();
	this.insertNode( moving.node, moving.data );
	this.inserter.offset++;
	this.inserter.linearOffset += moving.data.length;
};

ve.dm.TreeModifier.prototype.insertText = function ( data ) {
	var pathsMatch;
	this.ensureTextNode();
	pathsMatch = this.pathsMatch();
	if ( pathsMatch && this.inserter.offset > this.remover.offset ) {
		throw new Error( 'Cannot insert ahead of remover in same text node' );
	}
	// Adjust linear data before tree, to ensure consistency when node events are emitted
	this.spliceLinear( this.inserter.linearOffset, 0, data );
	this.inserter.node.adjustLength( data.length );
	this.remover.adjustPath( this.inserter.path, this.inserter.offset, data.length, data.length );
	this.inserter.offset += data.length;
	this.inserter.linearOffset += data.length;
};

/**
 * Create a node and attach it at the inserter (without moving the cursor)
 *
 * @param {Object} item Linear model open tag
 */
ve.dm.TreeModifier.prototype.create = function ( item ) {
	var node = ve.dm.nodeFactory.createFromElement( item );
	this.ensureNotTextNode();
	this.insertNode( node, [ item, { type: '/' + item.type } ] );
};
