/*!
 * VisualEditor DataModel Transaction class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Transaction on ve.dm.ElementLinearData, preserving ve.dm.Document tree validity
 *
 * A transaction represents a mapping on ve.dm.ElementLinearData, from one state (the start
 * state) to another (the end state). The transaction is guaranteed not to break tree validity:
 * if the start state represents a syntactically valid ve.dm.Document tree (without unbalanced
 * tags, bare listItems, bare table cells etc), then the end state tree must be syntactically
 * valid too.
 *
 * A transaction is comprised of a list of operations, which must preserve tree validity as a
 * whole, though each individual operation may not. For example, a DivNode wrapping can be
 * removed by one operation removing the 'div' and another removing the '/div'.  The
 * ve.dm.TransactionBuilder.static.newFrom* methods help build transactions that preserve tree validity.
 *
 * @class
 * @constructor
 * @param {Object[]} [operations] Operations preserving tree validity as a whole; default []
 * @param {number|null} [authorId] Positive integer author ID; default null
 */
ve.dm.Transaction = function VeDmTransaction( operations, authorId ) {
	this.operations = operations || [];
	// TODO: remove this backwards-incompatibility check
	this.operations.forEach( function ( op ) {
		if ( op.type && op.type.match( /meta/i ) ) {
			throw new Error( 'Metadata ops are no longer supported' );
		}
	} );
	this.applied = false;
	this.authorId = authorId || null;
	this.isReversed = false;
};

/* Inheritance */

OO.initClass( ve.dm.Transaction );

/* Static Properties */

/**
 * Specification for how each type of operation should be reversed.
 *
 * This object maps operation types to objects, which map property names to reversal instructions.
 * A reversal instruction is either a string (which means the value of that property should be used)
 * or an object (which maps old values to new values). For instance, { from: 'to' }
 * means that the .from property of the reversed operation should be set to the .to property of the
 * original operation, and { method: { set: 'clear' } } means that if the .method property of
 * the original operation was 'set', the reversed operation's .method property should be 'clear'.
 *
 * If a property's treatment isn't specified, its value is simply copied without modification.
 * If an operation type's treatment isn't specified, all properties are copied without modification.
 *
 * @type {Object.<string,Object.<string,string|Object.<string, string>>>}
 */
ve.dm.Transaction.static.reversers = {
	attribute: { from: 'to', to: 'from' }, // Swap .from with .to
	replace: { // Swap .insert with .remove
		insert: 'remove',
		remove: 'insert'
	}
};

/* Static Methods */

/**
 * Deserialize a transaction from a JSONable object
 *
 * Values are either new or deep copied, so there is no reference into the serialized structure
 * @param {Object|Array} data Transaction serialized as a JSONable object
 * @return {ve.dm.Transaction} Deserialized transaction
 */
ve.dm.Transaction.static.deserialize = function ( data ) {
	function deminifyLinearData( data ) {
		if ( typeof data === 'string' ) {
			return data.split( '' );
		}
		// Else deep copy. For this plain, serializable array, stringify+parse profiles
		// faster than ve.copy
		return JSON.parse( JSON.stringify( data ) );
	}

	function deminify( op ) {
		if ( typeof op === 'number' ) {
			return { type: 'retain', length: op };
		}
		if ( Array.isArray( op ) ) {
			return {
				type: 'replace',
				remove: deminifyLinearData( op[ 0 ] ),
				insert: deminifyLinearData( op[ 1 ] )
			};
		}
		// Else deep copy. For this plain, serializable array, stringify+parse profiles
		// faster than ve.copy
		return JSON.parse( JSON.stringify( op ) );
	}

	if ( Array.isArray( data ) ) {
		return new ve.dm.Transaction(
			data.map( deminify )
		);
	} else {
		return new ve.dm.Transaction(
			// operations
			data.o.map( deminify ),
			// authorId
			data.a
		);
	}

};

/* Methods */

/**
 * Serialize the transaction into a JSONable object
 *
 * Values are not necessarily deep copied
 * @return {Object|Array} Serialized transaction
 */
ve.dm.Transaction.prototype.serialize = function () {
	var operations;

	function isSingleCodePoint( x ) {
		return typeof x === 'string' && x.length === 1;
	}
	function minifyLinearData( data ) {
		if ( data.every( isSingleCodePoint ) ) {
			return data.join( '' );
		}
		return data;
	}

	function minify( op ) {
		if ( op.type === 'retain' ) {
			return op.length;
		}
		if (
			op.type === 'replace' &&
			!op.insertedDataOffset &&
			(
				op.insertedDataLength === undefined ||
				op.insertedDataLength === op.insert.length
			)
		) {
			return [ minifyLinearData( op.remove ), minifyLinearData( op.insert ) ];
		}
		return op;
	}

	operations = this.operations.map( minify );

	if ( this.authorId !== null ) {
		return {
			o: operations,
			a: this.authorId
		};
	} else {
		return operations;
	}
};

/**
 * Push a retain operation
 *
 * @param {number} length Length > 0 of content data to retain
 */
ve.dm.Transaction.prototype.pushRetainOp = function ( length ) {
	this.operations.push( { type: 'retain', length: length } );
};

/**
 * Build a replace operation
 *
 * The `insertedDataOffset` and `insertedDataLength` parameters indicate the intended insertion
 * is wrapped with fixup data to preserve HTML validity. For instance, an intended table cell
 * insertion may have been fixed up by wrapping inside a table row, table section and table.
 *
 * @param {Array} remove Data to remove
 * @param {Array} insert Data to insert, possibly fixed up
 * @param {number} [insertedDataOffset] Offset of intended insertion within fixed up data
 * @param {number} [insertedDataLength] Length of intended insertion within fixed up data
 */
ve.dm.Transaction.prototype.pushReplaceOp = function ( remove, insert, insertedDataOffset, insertedDataLength ) {
	var op = { type: 'replace', remove: remove, insert: insert };
	if ( insertedDataOffset !== undefined && insertedDataLength !== undefined ) {
		op.insertedDataOffset = insertedDataOffset;
		op.insertedDataLength = insertedDataLength;
	}
	this.operations.push( op );
};

/**
 * Build an attribute operation
 *
 * @param {string} key Name of attribute to change
 * @param {Mixed} from Value to change attribute from, or undefined if not previously set
 * @param {Mixed} to Value to change attribute to, or undefined to remove
 */
ve.dm.Transaction.prototype.pushAttributeOp = function ( key, from, to ) {
	this.operations.push( { type: 'attribute', key: key, from: from, to: to } );
};

/**
 * Create a clone of this transaction.
 *
 * The returned transaction will be exactly the same as this one, except that its 'applied' flag
 * will be cleared. This means that if a transaction has already been committed, it will still
 * be possible to commit the clone. This is used for redoing transactions that were undone.
 *
 * @return {ve.dm.Transaction} Clone of this transaction
 */
ve.dm.Transaction.prototype.clone = function () {
	return new this.constructor(
		// For this plain, serializable array, stringify+parse profiles faster than ve.copy
		JSON.parse( JSON.stringify( this.operations ) ),
		this.authorId
	);
};

/**
 * Create a reversed version of this transaction.
 *
 * The returned transaction will be the same as this one but with all operations reversed. This
 * means that applying the original transaction and then applying the reversed transaction will
 * result in no net changes. This is used to undo transactions.
 *
 * @return {ve.dm.Transaction} Reverse of this transaction
 */
ve.dm.Transaction.prototype.reversed = function () {
	var i, len, op, newOp, reverse, prop,
		tx = new this.constructor();

	tx.isReversed = !this.isReversed;
	for ( i = 0, len = this.operations.length; i < len; i++ ) {
		op = this.operations[ i ];
		newOp = ve.copy( op );
		reverse = this.constructor.static.reversers[ op.type ] || {};
		for ( prop in reverse ) {
			if ( typeof reverse[ prop ] === 'string' ) {
				newOp[ prop ] = op[ reverse[ prop ] ];
			} else {
				newOp[ prop ] = reverse[ prop ][ op[ prop ] ];
			}
		}
		tx.operations.push( newOp );
	}
	tx.authorId = this.authorId;
	return tx;
};

/**
 * Check if the transaction would make any actual changes if processed.
 *
 * There may be more sophisticated checks that can be done, like looking for things being replaced
 * with identical content, but such transactions probably should not be created in the first place.
 *
 * @method
 * @return {boolean} Transaction is no-op
 */
ve.dm.Transaction.prototype.isNoOp = function () {
	if ( this.operations.length === 0 ) {
		return true;
	}
	if ( this.operations.length === 1 ) {
		return this.operations[ 0 ].type === 'retain';
	}
	return false;
};

/**
 * Get all operations.
 *
 * @method
 * @return {Object[]} List of operations
 */
ve.dm.Transaction.prototype.getOperations = function () {
	return this.operations;
};

/**
 * Check if the transaction has any operations with a certain type.
 *
 * @method
 * @param {string} type Operation type
 * @return {boolean} Has operations of a given type
 */
ve.dm.Transaction.prototype.hasOperationWithType = function ( type ) {
	var i, len;
	for ( i = 0, len = this.operations.length; i < len; i++ ) {
		if ( this.operations[ i ].type === type ) {
			return true;
		}
	}
	return false;
};

/**
 * Check if the transaction has any content data operations, such as insertion or deletion.
 *
 * @method
 * @return {boolean} Has content data operations
 */
ve.dm.Transaction.prototype.hasContentDataOperations = function () {
	return this.hasOperationWithType( 'replace' );
};

/**
 * Check if the transaction has any element attribute operations.
 *
 * @method
 * @return {boolean} Has element attribute operations
 */
ve.dm.Transaction.prototype.hasElementAttributeOperations = function () {
	return this.hasOperationWithType( 'attribute' );
};

/**
 * Check whether the transaction has already been applied.
 *
 * @method
 * @return {boolean}
 */
ve.dm.Transaction.prototype.hasBeenApplied = function () {
	return this.applied;
};

/**
 * Mark the transaction as having been applied.
 *
 * Should only be called after committing the transaction.
 *
 * @see ve.dm.Transaction#hasBeenApplied
 */
ve.dm.Transaction.prototype.markAsApplied = function () {
	this.applied = true;
};

/**
 * Translate an offset based on a transaction.
 *
 * This is useful when you want to anticipate what an offset will be after a transaction is
 * processed.
 *
 * @method
 * @param {number} offset Offset in the linear model before the transaction has been processed
 * @param {boolean} [excludeInsertion] Map the offset immediately before an insertion to
 *  right before the insertion rather than right after
 * @return {number} Translated offset, as it will be after processing transaction
 */
ve.dm.Transaction.prototype.translateOffset = function ( offset, excludeInsertion ) {
	var i, op, insertLength, removeLength, prevAdjustment,
		cursor = 0,
		adjustment = 0;

	for ( i = 0; i < this.operations.length; i++ ) {
		op = this.operations[ i ];
		if ( op.type === 'replace' ) {
			insertLength = op.insert.length;
			removeLength = op.remove.length;
			prevAdjustment = adjustment;
			adjustment += insertLength - removeLength;
			if ( offset === cursor + removeLength ) {
				// Offset points to right after the removal or right before the insertion
				if ( excludeInsertion && insertLength > removeLength ) {
					// Translate it to before the insertion
					return offset + adjustment - insertLength + removeLength;
				} else {
					// Translate it to after the removal/insertion
					return offset + adjustment;
				}
			} else if ( offset === cursor ) {
				// The offset points to right before the removal or replacement
				if ( insertLength === 0 ) {
					// Translate it to after the removal
					return cursor + removeLength + adjustment;
				} else {
					// Translate it to before the replacement
					// To translate this correctly, we have to use adjustment as it was before
					// we adjusted it for this replacement
					return cursor + prevAdjustment;
				}
			} else if ( offset > cursor && offset < cursor + removeLength ) {
				// The offset points inside of the removal
				// Translate it to after the removal
				return cursor + removeLength + adjustment;
			}
			cursor += removeLength;
		} else if ( op.type === 'retain' ) {
			if ( offset >= cursor && offset < cursor + op.length ) {
				return offset + adjustment;
			}
			cursor += op.length;
		}
	}
	return offset + adjustment;
};

/**
 * Translate a range based on the transaction, with grow/shrink preference at changes
 *
 * This is useful when you want to anticipate what a selection will be after a transaction is
 * processed.
 *
 * @method
 * @see #translateOffset
 * @param {ve.Range} range Range in the linear model before the transaction has been processed
 * @param {boolean} [excludeInsertion] Do not grow the range to cover insertions
 *  on the boundaries of the range.
 * @return {ve.Range} Translated range, as it will be after processing transaction
 */
ve.dm.Transaction.prototype.translateRange = function ( range, excludeInsertion ) {
	var start = this.translateOffset( range.start, !excludeInsertion ),
		end = this.translateOffset( range.end, excludeInsertion );
	return range.isBackwards() ? new ve.Range( end, start ) : new ve.Range( start, end );
};

/**
 * Translate a range based on the transaction, with bias depending on author ID comparison
 *
 * Biases backward if !authorId || !this.authorId || authorId <= this.authorId
 *
 * @see #translateOffset
 * @param {ve.Range} range Range in the linear model before the transaction has been processed
 * @param {number} [authorId] Author ID of the range
 * @return {ve.Range} Translated range, as it will be after processing transaction
 */
ve.dm.Transaction.prototype.translateRangeWithAuthor = function ( range, authorId ) {
	var backward = !this.authorId || !authorId || authorId < this.authorId,
		start = this.translateOffset( range.start, backward ),
		end = this.translateOffset( range.end, backward );
	return range.isBackwards() ? new ve.Range( end, start ) : new ve.Range( start, end );
};

/**
 * Get the range that covers modifications made by this transaction.
 *
 * In the case of insertions, the range covers content the user intended to insert.
 * It ignores wrappers added by ve.dm.Document#fixUpInsertion.
 *
 * The returned range is relative to the new state, after the transaction is applied. So for a
 * simple insertion transaction, the range will cover the newly inserted data, and for a simple
 * removal transaction it will be a zero-length range.
 *
 * @param {ve.dm.Document} doc The document in the state to which the transaction applies
 * @param {boolean} includeInternalList Include changes within the internal list
 * @return {ve.Range|null} Range covering modifications, or null for a no-op transaction
 */
ve.dm.Transaction.prototype.getModifiedRange = function ( doc, includeInternalList ) {
	var i, len, op, start, end, internalListNode,
		docEndOffset = doc.data.getLength(),
		oldOffset = 0,
		offset = 0;

	if ( !includeInternalList ) {
		internalListNode = doc.getInternalList().getListNode();
		if ( internalListNode ) {
			docEndOffset = internalListNode.getOuterRange().start;
		}
	}

	opLoop:
	for ( i = 0, len = this.operations.length; i < len; i++ ) {
		op = this.operations[ i ];
		switch ( op.type ) {
			case 'retain':
				if ( oldOffset + op.length > docEndOffset ) {
					break opLoop;
				}
				offset += op.length;
				oldOffset += op.length;
				break;

			case 'attribute':
				if ( start === undefined ) {
					start = offset;
				}
				// Attribute changes modify the element to their right but don't move the cursor
				end = offset + 1;
				break;

			default:
				if ( start === undefined ) {
					// This is the first non-retain operation, set start to right before it
					start = offset + ( op.insertedDataOffset || 0 );
				}
				if ( op.type === 'replace' ) {
					offset += op.insert.length;
					oldOffset += op.remove.length;
				}

				// Set end, so it'll end up being right after the last non-retain operation
				if ( op.insertedDataLength ) {
					end = start + op.insertedDataLength;
				} else {
					end = offset;
				}
				break;
		}
	}
	if ( start === undefined || end === undefined ) {
		// No-op transaction
		return null;
	}
	return new ve.Range( start, end );
};

/**
 * Calculate active range and length change
 *
 * @return {Object} Active range and length change
 * @return {number|undefined} return.start Start offset of the active range
 * @return {number|undefined} return.end End offset of the active range
 * @return {number|undefined} return.startOpIndex Start operation index of the active range
 * @return {number|undefined} return.endOpIndex End operation index of the active range
 * @return {number} return.diff Length change the transaction causes
 */
ve.dm.Transaction.prototype.getActiveRangeAndLengthDiff = function () {
	var i, len, op, start, end, startOpIndex, endOpIndex, active,
		offset = 0,
		diff = 0;

	for ( i = 0, len = this.operations.length; i < len; i++ ) {
		op = this.operations[ i ];
		active = op.type !== 'retain';
		// Place start marker
		if ( active && start === undefined ) {
			start = offset;
			startOpIndex = i;
		}
		// Adjust offset and diff
		if ( op.type === 'retain' ) {
			offset += op.length;
		} else if ( op.type === 'replace' ) {
			offset += op.remove.length;
			diff += op.insert.length - op.remove.length;
		}
		// Place/move end marker
		if ( op.type === 'attribute' || op.type === 'replaceMetadata' ) {
			// Op with length 0 but that effectively modifies 1 position
			end = offset + 1;
			endOpIndex = i + 1;
		} else if ( active ) {
			end = offset;
			endOpIndex = i + 1;
		}
	}
	return {
		start: start,
		end: end,
		startOpIndex: startOpIndex,
		endOpIndex: endOpIndex,
		diff: diff
	};
};

// TODO: Use adjustRetain to replace ve.dm.TransactionBuilder#pushRetain

/**
 * Adjust (in place) the retain length at the start/end of an operations list
 *
 * @param {string} place Where to adjust, start|end
 * @param {number} diff Adjustment; must not cause negative retain length
 */
ve.dm.Transaction.prototype.adjustRetain = function ( place, diff ) {
	var start = place === 'start',
		ops = this.operations,
		i = start ? 0 : ops.length - 1;

	if ( diff === 0 ) {
		return;
	}
	if ( !start && ops[ i ] && ops[ i ].type === 'retainMetadata' ) {
		i = ops.length - 2;
	}
	if ( ops[ i ] && ops[ i ].type === 'retain' ) {
		ops[ i ].length += diff;
		if ( ops[ i ].length < 0 ) {
			throw new Error( 'Negative retain length' );
		} else if ( ops[ i ].length === 0 ) {
			ops.splice( i, 1 );
		}
		return;
	}
	if ( diff < 0 ) {
		throw new Error( 'Negative retain length' );
	}
	ops.splice( start ? 0 : ops.length, 0, { type: 'retain', length: diff } );
};

/**
 * Split (in place) the retain at the given offset, if any
 *
 * Offset cannot be in the interior of a replace operation (i.e. the interior of its removed content).
 *
 * @param {number} offset The offset at which to split
 * @return {number} Index in operations starting at offset
 * @throws {Error} Offset is in the interior of a replace operation
 */
ve.dm.Transaction.prototype.trySplit = function ( offset ) {
	var i, iLen, op, opLen,
		n = 0;
	for ( i = 0, iLen = this.operations.length; i < iLen; i++ ) {
		op = this.operations[ i ];
		opLen = ( op.type === 'retain' ? op.length : op.type === 'replace' ? op.remove.length : 0 );
		if ( n + opLen <= offset ) {
			n += opLen;
			continue;
		}
		if ( n === offset ) {
			// At start edge; no need to split
			return i;
		}
		// Else n < offset < n + opLen
		if ( op.type !== 'retain' ) {
			throw new Error( 'Cannot split operation of type ' + op.type );
		}
		// Split the retain operation
		op.length -= n + opLen - offset;
		this.operations.splice( i + 1, 0, { type: 'retain', length: n + opLen - offset } );
		return i + 1;
	}
	if ( n === offset ) {
		return iLen + 1;
	}
	throw new Error( 'Offset beyond end of transaction' );
};

/**
 * Unsplit (in place) the two operations around the given index, if possible
 *
 * @param {number} index The index at which to unsplit
 */
ve.dm.Transaction.prototype.tryUnsplit = function ( index ) {
	var op1 = this.operations[ index - 1 ],
		op2 = this.operations[ index ];
	if ( !op1 || !op2 || op1.type !== op2.type ) {
		return;
	}
	if ( op1.type === 'retain' ) {
		op1.length += op2.length;
		this.operations.splice( index, 1 );
	} else if ( op1.type === 'replace' ) {
		ve.batchSplice( op1.remove, op1.remove.length, 0, op2.remove );
		ve.batchSplice( op1.insert, op1.insert.length, 0, op2.insert );
		this.operations.splice( index, 1 );
	}
};

/**
 * Insert (in place) operations at the given offset
 *
 * Merges into existing operations where possible. Offset cannot be in the interior of a replace
 * operation (i.e. the interior of its removed content).
 *
 * @param {number} offset The offset at which to insert
 * @param {Object[]} operations The operations to insert
 * @throws {Error} Offset is in the interior of a replace operation
 */
ve.dm.Transaction.prototype.insertOperations = function ( offset, operations ) {
	var opIndex;
	if ( operations.length === 0 ) {
		return;
	}
	opIndex = this.trySplit( offset );
	ve.batchSplice( this.operations, opIndex, 0, ve.copy( operations ) );
	this.tryUnsplit( opIndex + operations.length );
	this.tryUnsplit( opIndex );
};
