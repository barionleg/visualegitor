/*!
 * VisualEditor DataModel TreeModifier class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
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
	this.isReversed = transaction.isReversed;
	this.operations = transaction.getOperations();
	this.deletions = [];
	this.insertions = [];
	this.remover = new ve.dm.TreeCursor( doc.getDocumentNode(), this.insertions );
	this.inserter = new ve.dm.TreeCursor( doc.getDocumentNode(), this.deletions );
	this.undoSplices = [];
	this.changedBranchNodes = [];
	this.treeDiff = [];
	this.insertedPositions = [];
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
	if ( this.deletions.length > 0 ) {
		throw new Error( 'Unprocessed node deletions' );
	}
};

/**
 * Modify the tree according to an operation
 *
 * #processImplicitFinalRetain should be called once all operations have been processed
 *
 * @param {Object} op The operation
 */
ve.dm.TreeModifier.prototype.processOperation = function ( op ) {
	var retainLength, i, iLen, item, data;
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
		this.inserter.normalize();
		this.remover.normalize();
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
 * Undo the linear splices applied
 */
ve.dm.TreeModifier.prototype.undoLinearSplices = function () {
	var i, splice,
		adjustment = this.isReversed ? -1 : 1;
	for ( i = this.undoSplices.length - 1; i >= 0; i-- ) {
		splice = this.undoSplices[ i ];
		ve.batchSplice( this.data, splice[ 0 ], splice[ 1 ], splice[ 2 ] );
	}
	for ( i = this.changedBranchNodes.length - 1; i >= 0; i-- ) {
		this.changedBranchNodes[ i ].internal.changesSinceLoad -= adjustment;
	}
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
	return this.insertedPositions.length === 0 &&
		this.pathsMatch() && this.remover.offset === this.inserter.offset;
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
		if ( !removerStep ) {
			throw new Error( 'Remover past end' );
		}
		if ( !inserterStep ) {
			throw new Error( 'Inserter past end' );
		}
		if ( removerStep.length !== inserterStep.length ) {
			throw new Error( 'Remover and inserter unexpectedly diverged' );
		}
		return removerStep.length;
	}
	// Else pointers are not in the same location (in fact they cannot lie in the
	// same node)
	removerStep = remover.stepAtMost( maxLength );
	if ( removerStep.type === 'crosstext' ) {
		this.treeDiff.push( {
			type: 'moveText',
			from: removerStep.path.concat( removerStep.offset ),
			to: this.getInserterPosition(),
			length: removerStep.length
		} );
	} else if ( removerStep.type === 'cross' ) {
		this.treeDiff.push( {
			type: 'moveNode',
			from: removerStep.path.concat( removerStep.offset ),
			to: this.getInserterPosition()
		} );
	} else if ( removerStep.type === 'open' ) {
		this.deletions.push( removerStep.item );
		// Clone last open and step in
		this.treeDiff.push( {
			type: 'insertNode',
			at: this.getInserterPosition(),
			element: removerStep.item.getClonedElement()
		} );
		this.insertedPositions.push( 0 );
	} else if ( removerStep.type === 'close' ) {
		if ( this.insertedPositions ) {
			this.insertedPositions.pop();
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
		this.removeLastIfInDeletions();
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
		step = this.remover.stepAtMost( itemOrData.length || 1 );

	if ( step.type === 'crosstext' ) {
		start = step.node.getRange().start + step.offset;
		this.treeDiff.push( {
			type: 'removeText',
			at: step.path.concat( step.offset ),
			data: this.data.slice( start, start + step.length )
		} );
	} else if ( step.type === 'cross' ) {
		this.removeLast();
	} else if ( step.type === 'open' ) {
		this.deletions.push( step.item );
	} else if ( step.type === 'close' ) {
		this.removeLastIfInDeletions();
	}
};

/**
 * Process the insertion an open tag, a close tag, or an array of text items
 *
 * @param {Object|Array} itemOrData An open tag, a close tag, or an array of text items
 */
ve.dm.TreeModifier.prototype.processInsert = function ( itemOrData ) {
	var type, item, data, step,
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
		this.treeDiff.push( {
			type: 'insertNode',
			at: this.getInserterPosition(),
			element: ve.copy( item )
		} );
		this.insertedPositions.push( 0 );
	} else if ( type === 'crosstext' ) {
		this.treeDiff.push( {
			type: 'insertText',
			at: this.getInserterPosition(),
			data: ve.copy( data )
		} );
	} else if ( type === 'close' ) {
		if ( this.insertedPositions ) {
			this.insertedPositions.pop();
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

ve.dm.TreeModifier.prototype.getInserterPosition = function () {
	return this.inserter.path.concat( this.inserter.offset, this.insertedPositions );
};

ve.dm.TreeModifier.prototype.removeLast = function () {
	var step = this.remover.lastStep;
	this.treeDiff.push( {
		type: 'removeNode',
		at: step.path.concat( step.offset ),
		element: step.item.getClonedElement()
	} );
};

ve.dm.TreeModifier.prototype.removeLastIfInDeletions = function () {
	var step = this.remover.lastStep,
		i = this.deletions.indexOf( step.item );
	if ( i !== -1 ) {
		this.removeLast();
		this.deletions.splice( i, 1 );
	}
};
