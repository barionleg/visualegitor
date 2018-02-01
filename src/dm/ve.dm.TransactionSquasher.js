/*!
 * VisualEditor DataModel TransactionSquasher class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Squasher to create one transaction from multiple transactions applicable in turn
 *
 * The squashed transaction has the same effect on a document as applying the original
 * transactions in turn, but it may cause rebase conflicts where the original sequence
 * of transactions would not have.
 *
 * Suppose we have linmod arrays A, B, C, D. Note that (x,A->B,m) then (x,C->D,n) becomes
 * (x,A.concat(C*)->D.concat(B*),min(m,n)) Where len = min(B.length, C.length) and
 * C*=C.slice(len) and B*=B.slice(len).  I.e. "A->B then C->D" becomes "remove A, remove C*,
 * insert D, insert B*". Examples:
 * 1234Aa5678 (4,Aa->Bb,4) 1234Bb5678 (4,B->D,5) 1234Db5678 --> (4,Aa->Db,4)
 * 1234Aa5678 (4,Aa->Bb,4) 1234Bb5678 (4,Bb5->Dd,3) 1234Dd678 --> (4,Aa5->Dd,3)
 *
 * The same sort of thing happens if the starts are not the same, e.g.
 * helloworld (2,ll>LL,1,wo>WO,3) heLLoWOrld (3,LoW>HI,4) heLHIrld --> (2,llowo>LHI,3)
 * hiwed (1,i>ello,1,e>orl,1) helloworld (2,llowor>a,2) heald --> (1,iwe>eal,1)
 *
 * However, removal followed by reinsertion cannot be stripped out entirely, because then
 * the squashed transaction, considered as a partial function between documents, would have
 * a larger preimage than the composition of the original transactions. This can probably
 * break things like associativity). Example:
 *
 * hello! (1,ello>iworld,1) hiworld! (1,i>ello,6) helloworld! --> (1,ello>elloworld,1)
 *
 * @class
 * @constructor
 * @param {ve.dm.Transaction} [transaction] Base transaction to clone then squash others onto
 */
ve.dm.TransactionSquasher = function VeDmTransactionSquasher( transaction ) {
	/**
	 * @property {ve.dm.Transaction} transaction Transaction being squashed together
	 */
	this.transaction = transaction.clone();

	/**
	 * @property {Object[]} operations Reference to .operations within the transaction
	 */
	this.operations = this.transaction.operations;

	/**
	 * @property {number} index Index of the current operation within operations
	 */
	this.index = 0;

	/**
	 * @property {number} offset Post-transaction linmod offset within the current operation
	 *
	 * "Post-transaction" means that for replacements, the offset is within the insert
	 * block. The reason we care about post-transaction offsets is that they match the
	 * pre-transaction offsets of the next transaction.
	 */
	this.offset = 0;

	/**
	 * @property {Object} op The current operation
	 */
	this.op = this.operations[ 0 ];

	/**
	 * @property {ve.dm.Annotation[]} setAnnotations Annotations to set when retaining
	 */
	this.setAnnotations = [];

	/**
	 * @property {number[]} setSpliceAt A spliceAt value for each item in setAnnotations
	 */
	this.setSpliceAt = [];

	/**
	 * @property {ve.dm.Annotation[]} clearAnnotations Annotations to clear when retaining
	 */
	this.clearAnnotations = [];

	/**
	 * @property {number[]} clearSpliceAt A spliceAt value for each item in clearAnnotations
	 */
	this.clearSpliceAt = [];
};

/* Inheritance */

OO.initClass( ve.dm.TransactionSquasher );

/* Static methods */

/**
 * Set and clear annotations on some linmod data
 *
 * @param {Array} array The linmod array on which to make changes
 * @param {number} offset The offset at which to start
 * @param {number} len The number of positions on which to make changes
 * @param {number[]} setAnnotations Annotation hashes to set
 * @param {number[]} setSpliceAt The annotation index at which to insert each hash
 * @param {number[]} clearAnnotations Annotation hashes to clear
 * @param {number[]} clearSpliceAt The annotation index at which to remove each hash
 */
ve.dm.TransactionSquasher.static.annotateData = function ( array, offset, len, setAnnotations, setSpliceAt, clearAnnotations, clearSpliceAt ) {
	var i, item, annotations, j, jLen, hash;

	if ( setAnnotations.length === 0 && clearAnnotations.length === 0 ) {
		return;
	}
	for ( i = offset; i < len; i++ ) {
		item = array[ i ];
		if ( item.type && item.type.indexOf( '/' ) === 0 ) {
			// Close tag: inherently does not take annotations
			continue;
		}
		// Get a reference to the annotation list
		if ( item.annotations ) {
			annotations = item.annotations;
		} else if ( Array.isArray( item ) ) {
			annotations = item[ 1 ];
		} else if ( typeof item === 'string' ) {
			// No annotation list: insert one as we must be adding annotations
			annotations = [];
			item = [ item, annotations ];
			array[ i ] = item;
		} else {
			throw new Error( 'Unknown item type' );
		}
		for ( j = clearAnnotations.length - 1; j >= 0; j-- ) {
			hash = annotations[ clearSpliceAt[ j ] ];
			if ( hash !== clearAnnotations[ j ] ) {
				throw new Error( 'Expected to clear hash ' + clearAnnotations[ j ] + ' at ' + j + ', got ' + hash + ' instead' );
			}
			annotations.splice( clearSpliceAt[ j ], 1 );
		}
		for ( j = 0, jLen = setAnnotations.length; j < jLen; j++ ) {
			annotations.splice( setSpliceAt[ j ], 0, setAnnotations[ j ] );
		}
	}
};

/* Methods */

/**
 * Get the Transaction as-is
 *
 * @return {ve.dm.Transaction} The transaction
 */
ve.dm.TransactionSquasher.prototype.getTransaction = function () {
	return this.transaction;
};

/**
 * Modify our Transaction in-place to incorporate a follow-up transaction
 *
 * Applying the modified transaction has the same effect as applying the original
 * transaction then the follow-up, but it may cause rebase conflicts where the original
 * pair of transactions would not have.
 *
 * @param {ve.dm.Transaction} tx Follow-up transaction (that can apply immediately after this)
 */
ve.dm.TransactionSquasher.prototype.squashIn = function ( tx ) {
	var i, iLen, op, retainLength, consumed, items;

	// Walk over the document offsets in our transaction, modifying operations in-place
	// to incorporate the operations in tx
	this.index = 0;
	this.offset = 0;
	for ( i = 0, iLen = tx.operations.length; i < iLen; i++ ) {
		op = tx.operations[ i ];
		if ( op.type === 'retain' ) {
			retainLength = op.length;
			while ( retainLength > 0 ) {
				consumed = this.processRetain( retainLength );
				retainLength -= consumed;
			}
		} else if ( op.type === 'replace' ) {
			items = op.remove.slice();
			while ( items.length > 0 ) {
				consumed = this.processRemove( items );
				items.splice( 0, consumed );
			}
			items = op.insert.slice();
			while ( items.length > 0 ) {
				consumed = this.processInsert( items );
				items.splice( 0, consumed );
			}
		} else if ( op.type === 'attribute' ) {
			this.processAttribute( op.key, op.from, op.to );
		} else if ( op.type === 'annotate' ) {
			this.processAnnotation( op.method, op.bias, op.hash, op.spliceAt );
		} else {
			throw new Error( 'Unknown operation type ' + op.type );
		}
	}
};

/**
 * Process the retention of content, stopping part-way if convenient
 *
 * @param {number} maxLength The maximum amount of content to retain
 * @return {number} The amount of content retained
 */
ve.dm.TransactionSquasher.prototype.processRetain = function ( maxLength ) {
	var len;

	this.normalizePosition();
	if ( !this.op ) {
		throw new Error( 'Past end of transaction' );
	}
	if ( this.op.type === 'retain' ) {
		len = Math.min( maxLength, this.op.length - this.offset );
		this.offset += len;
		return len;
	}
	if ( this.op.type === 'replace' ) {
		// Apply annotation changes to inserted content
		len = Math.min( maxLength, this.op.insert.length - this.offset );
		this.constructor.static.annotateData( this.op.insert, this.offset, len,
			this.setAnnotations, this.setSpliceAt, this.clearAnnotations,
			this.clearSpliceAt );
		this.offset += len;
		return len;
	}
	if ( this.op.type === 'attribute' ) {
		// Do nothing
		this.index++;
		this.op = this.operations[ this.index ];
		// By assumption, this.offset is already 0
		return 0;
	}
	if ( this.op.type === 'annotate' ) {
		// Preserve annotation ends
		return 0;
	}
	return maxLength;
};

/**
 * Process the removal of some items, stopping part-way if convenient
 *
 * If some of the removal is undoing an insertion in this.transaction, then the "cancelled"
 * content is stripped out entirely from the squashed transaction.
 *
 * @param {Object[]} items Items to remove some of
 * @return {number} The length of the initial slice of items that was removed
 */
ve.dm.TransactionSquasher.prototype.processRemove = function ( items ) {
	var len, i, replaceOp;

	function equalItems( item1, item2 ) {
		return JSON.stringify( item1 ) === JSON.stringify( item2 );
	}

	this.normalizePosition();
	if ( !this.op ) {
		throw new Error( 'Past end of transaction' );
	}
	if ( this.op.type === 'retain' ) {
		this.splitRetain();
		// Now we must be at the start of a retain
		len = Math.min( items.length, this.op.length );
		this.op.length -= len;
		if ( this.op.length === 0 ) {
			// Remove empty retain
			this.operations.splice( this.index, 1 );
			// this.op may become undefined; ok
			this.op = this.operations[ this.index ];
		}
		// Get the immediately preceding replace op, or insert an empty one
		replaceOp = this.operations[ this.index - 1 ];
		if ( !replaceOp || replaceOp.type !== 'replace' ) {
			replaceOp = { type: 'replace', remove: [], insert: [] };
			this.operations.splice( this.index, 0, replaceOp );
			this.index++;
		}
		ve.batchSplice(
			replaceOp.remove,
			replaceOp.remove.length,
			0,
			items.slice( 0, len )
		);
		return len;
	}
	if ( this.op.type === 'replace' ) {
		// Check removal against insertion, then cancel them out
		len = Math.min( items.length, this.op.insert.length - this.offset );
		// len must be greater than zero, since we're not at the end of this op
		for ( i = 0; i < len; i++ ) {
			if ( !equalItems( items[ i ], this.op.insert[ this.offset + i ] ) ) {
				debugger;
				throw new Error( 'Remove does not match insert' );
			}
		}
		this.op.insert.splice( this.offset, len );
		if ( this.op.remove.length === 0 && this.op.insert.length === 0 ) {
			this.operations.splice( this.index, 1 );
			this.op = this.operations[ this.index ];
			// By assumption, this.offset is already 0
		}
		return len;
	}
	if ( this.op.type === 'attribute' ) {
		// We'll be removing the element to which this attribute change applies,
		// so kill it
		this.operations.splice( this.index, 1 );
		this.op = this.operations[ this.index ];
		// By assumption, this.offset is already 0
		return 0;
	}
	if ( this.op.type === 'annotate' ) {
		// Preserve annotation ends for now (remove empty annotation ranges in takeRetain)
		return 0;
	}
	throw new Error( 'Unknown operation type ' + this.op.type );
};

/**
 * Process the insertion of some items, stopping part-way if convenient
 *
 * If some of the insertion is undoing a removal in this.transaction, then the "cancelled"
 * content effectively becomes part of an identity replacement: replace 'foo' with 'foo'.
 * (The content cannot be stripped out entirely from the squashed transaction, because then
 * the squashed transaction, considered as a partial function between documents, would have
 * a larger preimage than the composition of the original transactions. This can probably
 * break things like associativity).
 *
 * @param {Object[]} items Items to insert some of
 * @return {number} The length of the initial slice of items that was inserted
 */
ve.dm.TransactionSquasher.prototype.processInsert = function ( items ) {
	var replaceOp;

	this.normalizePosition();
	if ( !this.op || this.op.type === 'retain' ) {
		if ( this.op.type === 'retain' ) {
			this.splitRetain();
		}
		// We must be at the start of this.op (or at the end if !this.op)
		// Get the immediately preceding replace op, or insert an empty one
		replaceOp = this.operations[ this.index - 1 ];
		if ( !replaceOp || replaceOp.type !== 'replace' ) {
			replaceOp = { type: 'replace', remove: [], insert: [] };
			this.operations.splice( this.index, 0, replaceOp );
			this.index++;
			// By hypothesis, this.offset is already zero
		}
		ve.batchSplice( replaceOp.insert, 0, 0, items );
		return items.length;
	}
	if ( this.op.type === 'attribute' || this.op.type === 'annotate' ) {
		this.index++;
		this.op = this.operations[ this.index ];
		// By assumption, this.offset is already 0
		return 0;
	}
	if ( this.op.type === 'replace' ) {
		// Do *not* try to cancel insertions against a matching prior removal,
		// because it would cause the squashed transaction to "forget" prior
		// linmod content that the original transaction pair requires. This
		// breaks useful properties like associativity.
		ve.batchSplice( this.op.insert, this.offset, 0, items );
		this.offset += items.length;
		return items.length;
	}
	throw new Error( 'Unknown operation type ' + this.op.type );
};

/**
 * Process the setting of an attribute
 *
 * @param {string} key The attribute key
 * @param {Mixed} from The old value
 * @param {Mixed} to The new value
 */
ve.dm.TransactionSquasher.prototype.processAttribute = function ( key, from, to ) {
	// Overwrite another attribute change at the same location with the same op.key; or
	// overwrite an open element at the same location by updating the value for the key
	key.slice( from, to );
	return;
};

/**
 * Process an annotation operation
 *
 * @param {string} method Annotation method, either 'set' to add or 'clear' to remove
 * @param {string} bias End point of marker, either 'start' to begin or 'stop' to end
 * @param {string} hash Hash value of the annotation
 * @param {number} spliceAt Annotation array index at which to splice
 */
ve.dm.TransactionSquasher.prototype.processAnnotation = function ( method, bias, hash, spliceAt ) {
	var annotations, i;
	if ( method === 'set' ) {
		annotations = this.setAnnotations;
		spliceAt = this.setSpliceAt;
	} else {
		annotations = this.clearAnnotations;
		spliceAt = this.clearSplice;
	}

	if ( bias === 'start' ) {
		annotations.push( hash );
		spliceAt.push( spliceAt );
	} else {
		i = annotations.lastIndexOf( hash );
		if ( i === -1 ) {
			throw new Error( 'Bad annotation order' );
		}
		annotations.splice( i, 1 );
		spliceAt.splice( i, 1 );
	}
	// We actually *apply* annotation changes when processing retain
};

/**
 * Normalize .index, .offset and .op so we're not at the end of a replace/retain
 */
ve.dm.TransactionSquasher.prototype.normalizePosition = function () {
	if (
		( this.op.type === 'retain' && this.offset === this.op.length ) ||
		( this.op.type === 'replace' && this.offset === this.op.insert.length )
	) {
		this.index++;
		this.offset = 0;
		// op may become undefined; ok
		this.op = this.operations[ this.index ];
	}
};

/**
 * If in the interior of a retain operation, to split it in two
 *
 * Afterwards, this.offset will be 0 and this.op will be a retain operation
 */
ve.dm.TransactionSquasher.prototype.splitRetain = function () {
	var len;
	if ( !this.op || this.op.type !== 'retain' ) {
		throw new Error( 'Expected retain op, not ' + ( this.op && this.op.type ) );
	}
	if ( this.offset === 0 ) {
		return;
	}
	if ( this.offset >= this.op.length ) {
		throw new Error( 'Cannot split at the end of retain' );
	}
	len = this.op.length - this.offset;
	this.op.length = this.offset;
	this.index++;
	this.offset = 0;
	this.op = { type: 'retain', length: len };
	this.operations.splice( this.index, 0, this.op );
};
