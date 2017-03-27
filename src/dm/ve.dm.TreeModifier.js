/*!
 * VisualEditor DataModel TreeModifier class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel tree modifier.
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
	this.transaction = transaction;
	this.operations = transaction.getOperations();
	this.deletions = [];
	this.insertions = [];
	this.remover = new ve.dm.TreeCursor( doc.getDocumentNode(), this.insertions );
	this.inserter = new ve.dm.TreeCursor( doc.getDocumentNode(), this.deletions );
};

/**
 * The top level method: modify the tree according to the transaction
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
		for ( op.remove, i = 0, iLen = op.remove.length; i < iLen; i++ ) {
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

ve.dm.TreeModifier.prototype.applyDeletions = function () {
	var i, node, parent, idx, pre, post,
		// Clone to avoid really obscure debugging issues if splice calls back into
		// TreeModifier somehow (at the time of writing that's impossible but hey)
		deletions = this.deletions.slice();
	// Delete in reverse order, to handle nested deletions acceptably
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
 * Step the inserter into a text node if one exists at this offset; else create one and step in
 */
ve.dm.TreeModifier.prototype.ensureTextNode = function () {
	var node = this.inserter.node;
	if ( node instanceof ve.dm.TextNode ) {
		return;
	}
	if ( !node.hasChildren() ) {
		throw new Error( 'Cannot ensureTextNode in childless node' );
	}
	if ( node.children[ this.inserter.offset ] instanceof ve.dm.TextNode ) {
		// do nothing
	} else if ( node.children[ this.inserter.offset - 1 ] instanceof ve.dm.TextNode ) {
		this.inserter.offset--;
	} else {
		this.insertNode( new ve.dm.TextNode() );
	}
	if ( this.cursorsMatch() ) {
		this.remover.stepIn();
	}
	this.inserter.stepIn();
};

ve.dm.TreeModifier.prototype.ensureNotTextNode = function () {
	var node = this.inserter.node,
		offset = this.inserter.offset;
	if ( !( node instanceof ve.dm.TextNode ) ) {
		return;
	}
	this.inserter.stepOut();
	if ( offset === 0 ) {
		// Position the cursor before the text node
		this.inserter.offset--;
		return;
	}
	if ( offset < node.length ) {
		// Split the node
		node.adjustLength( offset - this.inserter.node.length );
		this.insertNode( new ve.dm.TextNode() );
		this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
	}
};

/**
 * Remove the node at the remove cursor, without moving the cursor
 *
 * Joins text nodes automatically as appropriate
 *
 * @return {ve.dm.Node} The node being returned
 */
ve.dm.TreeModifier.prototype.removeNode = function () {
	var node = this.remover.node.splice( this.remover.offset, 1 )[ 0 ];
	this.inserter.adjustPath( this.inserter.path, this.inserter.offset, -1 );
	// TODO: text nodes?
	return node;
};

/**
 * Insert a node at the insert cursor, without moving the cursor
 *
 * Splits text nodes automatically as appropriate
 *
 * @param {ve.dm.Node} node The node to insert
 */
ve.dm.TreeModifier.prototype.insertNode = function ( node ) {
	this.ensureNotTextNode();
	// TODO deal with text splits
	this.inserter.node.splice( this.inserter.offset, 0, node );
	this.insertions.push( node );
	this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
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
		return removerStep.length;
	}
	// Else pointers are not in the same location (in fact they cannot lie in the
	// same node)
	removerStep = remover.stepAtMost( maxLength, true );
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
	}
	return removerStep.length;
};

/**
 * Process the removal of some items
 *
 * @param {Object|Array} data Either an open/close tag, or an array of text items
 */
ve.dm.TreeModifier.prototype.processRemove = function ( data ) {
	var step = this.remover.stepAtMost( data.length || 1 );
	// TODO: verify item matches the step
	if ( step.type === 'crosstext' ) {
		this.removeLastCrossText();
	} else if ( step.type === 'cross' ) {
		this.removeLast();
	} else if ( step.type === 'open' ) {
		this.deletions.push( step.item );
	}
	// Else step.type === 'close': do nothing
};

/**
 * Process the insertion of one item
 *
 * @param {Object|Array} data Either an open/close tag, or an array of text items
 */
ve.dm.TreeModifier.prototype.processInsert = function ( data ) {
	var inserter = this.inserter,
		type = data.type ?
			( data.type.startsWith( '/' ) ? 'close' : 'open' ) :
			'crosstext';
	if ( type === 'open' ) {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		this.create( data );
		inserter.stepIn();
	} else if ( type === 'crosstext' ) {
		// TODO: verify the content?
		this.insertText( data.length );
	} else if ( type === 'close' ) {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		inserter.stepOut();
	}
};

/**
 * Clone the node just opened by the remover, and insert it at the inserter
 */
ve.dm.TreeModifier.prototype.cloneLastOpen = function () {
	var node,
		step = this.remover.lastStep;
	if ( step.type !== 'open' ) {
		throw new Error( 'Expected step of type open, not ' + step.type );
	}
	node = ve.dm.nodeFactory.createFromElement( step.item.getClonedElement() );
	if ( this.inserter.node instanceof ve.dm.TextNode ) {
		this.inserter.stepOut();
	}
	// This will crash if not a BranchNode (showing the tx is invalid)
	this.insertNode( node );
};

/**
 * Remove the node just crossed or closed by the remover
 *
 * @return {ve.dm.Node} The removed node
 */
ve.dm.TreeModifier.prototype.removeLast = function () {
	var step = this.remover.lastStep;
	if ( step.type !== 'cross' && step.type !== 'close' ) {
		throw new Error( 'Expected step of type cross/close, not ' + step.type );
	}
	this.remover.offset--;
	return this.removeNode();
};

/**
 * Remove the text just crossed or closed by the remover
 */
ve.dm.TreeModifier.prototype.removeLastCrossText = function () {
	var pathsMatch,
		step = this.remover.lastStep,
		length = step.length,
		node = this.remover.node,
		offset = this.remover.offset;
	if ( step.type !== 'crosstext' ) {
		throw new Error( 'Expected step of type crosstext, not ' + step.type );
	}
	this.remover.offset -= length;

	this.inserter.normalize();
	pathsMatch = this.pathsMatch();
	if ( pathsMatch ) {
		if ( this.inserter.offset >= offset + length ) {
			this.inserter.offset -= length;
		} else if ( this.inserter.offset > offset ) {
			throw new Error( 'Inserter lies in the removed range' );
		}
	}
	node.adjustLength( -length );
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
};

/**
 * Move the text crossed at the remover's last step to the inserter
 */
ve.dm.TreeModifier.prototype.moveLastCrossText = function () {
	var step = this.remover.lastStep;
	if (
		this.remover.node === this.inserter.node &&
		this.remover.offset < this.inserter.offset
	) {
		throw new Error( 'Ambiguous text move within the same node' );
	}
	this.removeLastCrossText();
	this.insertText( step.offsetLength );
};

/**
 * Remove the text node containing the remover, if it is empty
 */
ve.dm.TreeModifier.prototype.removeTextNodeIfEmpty = function () {
	if ( !( this.remover.node instanceof ve.dm.TextNode ) ) {
		throw new Error( 'Expected text node' );
	}
	if ( this.remover.node.length > 0 ) {
		return;
	}
	// Remove empty text node, and step the cursor(s) out
	if ( this.pathsMatch() ) {
		this.inserter.stepOut();
		this.inserter.offset--;
	}
	this.remover.stepOut();
	this.remover.offset--;
	this.removeNode();
};

/**
 * Move the content crossed at the remover's last step to the inserter
 */
ve.dm.TreeModifier.prototype.moveLast = function () {
	this.insertNode( this.removeLast() );
	this.inserter.offset++;
};

ve.dm.TreeModifier.prototype.insertText = function ( length ) {
	var pathsMatch;
	this.ensureTextNode();
	pathsMatch = this.pathsMatch();
	if ( pathsMatch && this.inserter.offset > this.remover.offset ) {
		throw new Error( 'Cannot insert ahead of remover in same text node' );
	}
	this.inserter.node.adjustLength( length );
	if ( pathsMatch && this.remover.offset >= this.inserter.offset ) {
		// Advance the remover if it is at the inserter or past it
		this.remover.offset += length;
	}
	this.inserter.offset += length;
};

/**
 * Create an item and attach it at the inserter (without moving the cursor)
 *
 * @param {string|Array|Object} item Linear model item (but not a close tag)
 */
ve.dm.TreeModifier.prototype.create = function ( item ) {
	var node;
	if ( !item.type ) {
		// Item is text
		this.ensureTextNode();
		this.inserter.node.adjustLength( 1 );
		this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
	} else {
		node = ve.dm.nodeFactory.createFromElement( item );
		if ( this.inserter.node instanceof ve.dm.TextNode ) {
			if (
				this.cursorsMatch() &&
				this.remover.offset === this.remover.node.length
			) {
				this.remover.stepOut();
			}
			this.inserter.stepOut();
		}
		this.insertNode( node );
	}
};
