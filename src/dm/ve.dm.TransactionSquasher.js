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
 * For annotations in the follow-up transaction, two forms of processing are needed: annotating
 * previously-inserted content, and adding the annotations operation into the transaction for
 * retained ranges.
 *
 * @class
 * @constructor
 * @param {ve.dm.Transaction} transaction Base transaction to clone then squash others onto
 */
ve.dm.TransactionSquasher = function VeDmTransactionSquasher( transaction ) {
	/**
	 * @property {ve.dm.Transaction} transaction Transaction being squashed together
	 */
	this.transaction = transaction.clone();

	/**
	 * @property {Object[]} operations Reference to .operations within the tx
	 */
	this.operations = this.transaction.operations;

	/**
	 * @property {Object} op During squashIn, the current op within operations
	 */
	this.op = this.operations[ 0 ];

	/**
	 * @property {number} index During squashIn, index of current op within operations
	 */
	this.index = 0;

	/**
	 * "Post-transaction" means that for replacements, the offset is within the insert
	 * block. The reason we care about post-transaction offsets is that they match the
	 * pre-transaction offsets of the next transaction.
	 *
	 * @property {number} offset During squashIn, post-tx linmod offset within current op
	 */
	this.offset = 0;

	/**
	 *
	 * @property {Object[]} changes Annotations to set/clear on inserted/retained content.
	 * During squashIn, annotation changes from the follow-up transaction that should be
	 * applied to content being inserted or retained.
	 *
	 * @property {Object} changes.i The i'th annotation change, in the order in which
	 * annotation starts appear in the follow-up transaction operations list.
	 *
	 * @property {string} changes.i.method The method, 'set' or 'clear'
	 * @property {string} changes.i.hash The annotation hash. See `ve.dm.AnnotationSet#getHash`
	 * @property {number} changes.i.spliceAt Annotation offset array to splice at
	 * @property {boolean} changes.i.active Whether the annotation has been activated
	 */
	this.changes = [];
};

/* Inheritance */

OO.initClass( ve.dm.TransactionSquasher );

/* Static methods */

/**
 * Squash an array of consecutive transactions into a single transaction
 *
 * @param {ve.dm.Transaction[]} transactions Non-empty array of consecutive transactions
 * @return {ve.dm.Transaction} Single transaction with the same content as the transaction array
 */
ve.dm.TransactionSquasher.static.squash = function ( transactions ) {
	var squasher, i, iLen, tx;
	if ( transactions.length === 0 ) {
		throw new Error( 'Cannot squash empty transaction array' );
	}
	squasher = new ve.dm.TransactionSquasher( transactions[ 0 ] );
	for ( i = 1, iLen = transactions.length; i < iLen; i++ ) {
		squasher.squashIn( transactions[ i ] );
	}
	return squasher.getTransaction();
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
	var i, op, retainLength, consumed, items;

	// Walk over the document offsets in our transaction, modifying operations in-place
	// to incorporate the operations in tx
	this.index = 0;
	this.offset = 0;
	this.op = this.operations[ this.index ];
	// Do not cache length, as we may splice the list
	for ( i = 0; i < tx.operations.length; i++ ) {
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
		this.addAnnotationStarts();
		len = Math.min( maxLength, this.op.length - this.offset );
		this.offset += len;
		return len;
	}
	if ( this.op.type === 'replace' ) {
		this.addAnnotationStops();
		// Apply annotation changes to inserted content
		len = Math.min( maxLength, this.op.insert.length - this.offset );

		// There is never any need to adjust spliceAt, because the splices are always
		// applied in the same order in which they were generated

		this.annotateData( this.op.insert, this.offset, len );
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
		// Preserve annotation ends (do nothing)
		this.index++;
		this.op = this.operations[ this.index ];
		// By assumption, this.offset is already 0
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
		this.splitIfInterior();
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
				throw new Error( 'Remove does not match insert' );
			}
		}
		this.op.insert.splice( this.offset, len );
		if ( this.op.remove.length === 0 && this.op.insert.length === 0 ) {
			// Empty replacement: delete it
			this.operations.splice( this.index, 1 );
			this.op = this.operations[ this.index ];
			// By assumption, this.offset is already 0
			this.healRetain();
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
		this.index++;
		this.op = this.operations[ this.index ];
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
			this.splitIfInterior();
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
		ve.batchSplice( replaceOp.insert, replaceOp.insert.length, 0, items );
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
	var change, i, iLen;

	if ( bias === 'start' ) {
		change = {
			method: method,
			hash: hash,
			spliceAt: spliceAt,
			active: false
		};
		this.changes.push( change );
		this.addAnnotationChange( change, true );
	} else {
		i = this.changes.findIndex( function ( x ) {
			return x.hash === hash;
		} );
		if ( i === -1 ) {
			throw new Error( 'Cannot find change with hash ' + hash );
		}
		change = this.changes[ i ];
		this.addAnnotationChange( change, false );
		this.changes.splice( i, 1 );
		// Adjust any .spliceAt in changes subsequent to the one removed
		for ( iLen = this.changes.length; i < iLen; i++ ) {
			if ( this.changes[ i ].spliceAt > change.spliceAt ) {
				this.changes[ i ].spliceAt--;
			}
		}
	}
	// We actually *apply* annotation changes when processing retain
};

/**
 * Add annotation start/stop operations as required
 *
 * The purpose of this is so that annotation changes can be incorporated to cover the
 * transaction's retain ranges, but not its replace ranges.
 *
 * @param {Object} change The annotation change to be switched
 * @param {boolean} change.active Whether the annotation is active: modified in-place
 * @param {boolean} wantActive True to start the annotation change; false to stop it
 */
ve.dm.TransactionSquasher.prototype.addAnnotationChange = function ( change, wantActive ) {
	if ( change.active === wantActive ) {
		return;
	}
	this.normalizePosition();
	this.splitIfInterior();
	this.operations.splice( this.index, 0, {
		type: 'annotate',
		method: change.method,
		bias: wantActive ? 'start' : 'stop',
		hash: change.hash,
		spliceAt: change.spliceAt
	} );
	this.index++;
	change.active = wantActive;
};

ve.dm.TransactionSquasher.prototype.addAnnotationStarts = function () {
	var i, iLen;
	for ( i = 0, iLen = this.changes.length; i < iLen; i++ ) {
		this.addAnnotationChange( this.changes[ i ], true );
	}
};

ve.dm.TransactionSquasher.prototype.addAnnotationStops = function () {
	var i, iLen;
	for ( i = 0, iLen = this.changes.length; i < iLen; i++ ) {
		this.addAnnotationChange( this.changes[ i ], false );
	}
};

/**
 * Set and clear annotations on some linmod data
 *
 * @param {Array} array The linmod array on which to make changes
 * @param {number} offset The offset at which to start
 * @param {number} len The number of positions on which to make changes
 */
ve.dm.TransactionSquasher.prototype.annotateData = function ( array, offset, len ) {
	var i, item, annotations, j, jLen, change;

	if ( this.changes.length === 0 ) {
		return;
	}
	for ( i = offset; i < len; i++ ) {
		item = array[ i ];
		if ( item.type && item.type.indexOf( '/' ) === 0 ) {
			// Close tag: inherently does not take annotations, but does not
			// interrupt any set/clear annotation run
			continue;
		}
		// Get a reference to this item's annotation list
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
		for ( j = 0, jLen = this.changes.length; j < jLen; j++ ) {
			change = this.changes[ j ];
			if ( change.method === 'set' ) {
				if ( annotations.indexOf( change.hash ) !== -1 ) {
					throw new Error( 'Hash to set already present: ' + change.hash );
				}
				annotations.splice( change.spliceAt, 0, change.hash );
			} else {
				if ( annotations[ change.spliceAt ] !== change.hash ) {
					throw new Error( 'Hash to clear not present: ' + change.hash + ', spliceAt=' + change.spliceAt );
				}
				annotations.splice( change.spliceAt, 1 );
			}
		}
		if ( Array.isArray( item ) && typeof item[ 0 ] === 'string' && annotations.length === 0 ) {
			array[ i ] = item[ 0 ];
		}
	}
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
 * If in the interior of a retain/replace operation, split it here without moving.
 *
 * For retain, the length is split at the current offset.
 * For replace, the entire removal goes to the earlier chunk (only the insertion gets split).
 * For all other operations, nothing happens.
 *
 * Afterwards, this.offset will be 0.
 */
ve.dm.TransactionSquasher.prototype.splitIfInterior = function () {
	var len, remainder, insertion, newOp,
		type = this.op && this.op.type;
	if ( this.offset === 0 ) {
		// No need to split
		return;
	}
	if ( type !== 'retain' && type !== 'replace' ) {
		throw new Error( 'Non-zero offset, but op type is ' + type );
	}
	len = ( type === 'retain' ? this.op.length : this.op.insert.length );
	remainder = len - this.offset;
	if ( remainder < 0 ) {
		throw new Error( 'Beyond the end of retain' );
	}
	if ( remainder === 0 ) {
		throw new Error( 'Cannot split at the end of retain' );
	}
	if ( type === 'retain' ) {
		newOp = { type: 'retain', length: remainder };
		this.op.length = this.offset;
	} else {
		insertion = this.op.insert.splice( this.offset );
		newOp = { type: 'replace', remove: [], insert: insertion };
	}
	this.index++;
	this.offset = 0;
	this.op = newOp;
	this.operations.splice( this.index, 0, this.op );
};

/**
 * If this operation and the previous one are retains, join them
 */
ve.dm.TransactionSquasher.prototype.healRetain = function () {
	var prevOp = this.operations[ this.index - 1 ];
	if ( prevOp && prevOp.type === 'retain' && this.op.type === 'retain' ) {
		this.op.length += prevOp.length;
		this.offset += prevOp.length;
		this.operations.splice( this.index - 1, 1 );
		this.index--;
	}
};
