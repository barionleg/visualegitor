/*!
 * VisualEditor DataModel Transaction transposition.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */
( function ( ve ) {

	/* Private helper functions */

	/*
	 * Position data type.
	 *
	 * Maintain position within data/metadata.  Conceptually, metadata
	 * positions precede data positions, so that the data at offset
	 * `n` occurs at position `(n, MAX_INT)`.
	 */
	function Position(dataPos, metadataPos) {
		this.data = dataPos || 0;
		this.meta = metadataPos || 0;
	}
	Position.prototype.add = function( d, m ) {
		if ( d instanceof Position ) {
			return this.add( d.data, d.meta );
		}
		if ( d === 0 ) {
			return new Position( this.data, this.meta + ( m || 0 ) );
		}
		return new Position( this.data + d, ( m || 0 ) );
	};
	Position.prototype.subtract = function( d, m ) {
		if ( d instanceof Position ) {
			return this.subtract( d.data, d.meta );
		}
		return this.add( -d, -m );
	};
	Position.prototype.eq = function( d, m ) {
		if ( d instanceof Position ) {
			return this.eq( d.data, d.meta );
		}
		return this.data === d && this.meta === m;
	};
	Position.prototype.lt = function( d, m ) {
		if ( d instanceof Position ) {
			return this.lt( d.data, d.meta );
		}
		if ( this.data === d ) {
			return this.meta < ( m || 0 );
		}
		return this.data < d;
	};
	Position.prototype.toString = function() {
		return 'Position('+this.data+','+this.meta+')';
	};

	/*
	 * Helper function for `transposeOne()`.
	 *
	 * We preprocess transactions' operation lists to annotate them with
	 * old position information and mutable insert/remove lists.  We
	 * call the result a 'map'.
	 */
	function mkMap( tx ) {
		var r = [], oldPos = new Position( 0, 0 ), j, meta, inMeta = false;
		// start with sentinel
		r.push( {
			op: { type: 'retain', length: 1 },
			correction: new Position( -1 ),
			start: new Position( -1 )
		} );
		$.each( tx.operations, function( i, op ) {
			var m = {
				op: op,
				start: oldPos
			};
			switch ( op.type ) {

			case 'retain':
				m.correction = new Position( 0 );
				if ( inMeta ) {
					inMeta = false;
					// add sentinel covering "data after metadata" realignment
					m.start = oldPos.add( 1 );
					m.correction = new Position( -1 );
					r.push( {
						op: { type: 'retainData' },
						start: oldPos,
						correction: new Position( 0 )
					} );
					if ( op.length === 1 ) {
						oldPos = m.start;
						return;
					}
				}
				oldPos = oldPos.add( op.length );
				break;

			case 'replace':
				if ( inMeta ) {
					throw new Error( 'replace at unaligned position' );
				}
				// combine data and metadata
				m.remove = [];
				meta = ( op.removeMetadata === undefined ) ? [] : op.removeMetadata;
				for ( j = 0; j < op.remove.length; j++ ) {
					m.remove.push( [ meta[ j ], op.remove[ j ] ] );
				}
				m.insert = [];
				meta = ( op.insertMetadata === undefined ) ? [] : op.insertMetadata;
				for ( j = 0; j < op.insert.length; j++ ) {
					m.insert.push( [ meta[ j ], op.insert[ j ] ] );
				}
				oldPos = oldPos.add( op.remove.length );
				break;

			case 'replaceMetadata':
				if ( !inMeta ) {
					inMeta = true;
					// add sentinel
					r.push( {
						op: { type: 'retainMetadata', length: 1 },
						correction: new Position( 0, -1 ),
						start: oldPos.subtract( 0, 1 )
					} );
				}
				m.remove = op.remove.slice( 0 );
				m.insert = op.insert.slice( 0 );
				oldPos = oldPos.add( 0, op.remove.length );
				break;

			case 'retainMetadata':
				if ( !inMeta ) {
					inMeta = true;
					// add sentinel
					r.push( {
						op: { type: 'retainMetadata', length: 1 },
						correction: new Position( 0, -1 ),
						start: oldPos.subtract( 0, 1 )
					} );
				}
				m.correction = new Position( 0 );
				oldPos = oldPos.add( 0, op.length );
				break;

			default:
				throw new Error( 'unhandled type: ' + op.type );
			}
			r.push( m );
		} );
		// add sentinel at end
		r.push( {
			op: { type: 'retain', length: 1 },
			correction: new Position( -1 ),
			start: oldPos,
			end: oldPos.add( 1 )
		} );
		// link up 'start' and 'end' fields
		$.each( r, function( i, op ) {
			if ( i < r.length - 1 ) {
				op.end = r[ i + 1 ].start;
			}
		} );
		return r;
	}

	/*
	 * @param {boolean} preferB  If true, give position new before given old `offset`; otherwise give new position after old `offset-1`.
	 */
		// apply b operations to a to determine how offsets change
	function translate( pos, bMap ) {
		var inMeta = false;
		var i, op, extraData, extraMeta;
		var oldStart = new Position( 0 ), oldEnd;
		var newStart = new Position( 0 ), newEnd;
		var extraData, extraMeta;

		// run through elements completely before pos.
		extraData = extraMeta = 0;
		for ( i = 0; i < bMap.length; i++ ) {
			if ( !bMap[i].end.lt( pos ) ) {
				break;
			}
			op = bMap[i].op;
			switch ( op.type ) {
			case 'retainData':
				extraMeta = 0;
				break;
			case 'replace':
				extraData += op.insert.length - op.remove.length;
				break;
			case 'replaceMetadata':
				extraMeta += op.insert.length - op.remove.length;
				break;
			default:
				break;
			}
		}
		// ok, now we're looking at an element which contains pos.
		// treat replace carefully here.
		if ( i < bMap.length ) {
			op = bMap[i].op;
			// XXX?
			if ( op.type === 'replace' ) {
				extraData += op.insert.length - op.remove.length;
			} else if ( op.type === 'replaceMetadata' ) {
				extraMeta += op.insert.length - op.remove.length;
			}
		}
		return pos.add( extraData, extraMeta );
	}

	function tweak( xxx ) {
		// XXX write me
		// what sorts of fixups need to be made?
	}

	/*
	 * Helper function for `transpose()`.
	 *
	 * Transposing `a` by `b` is almost the same as transposing `b` by `a`; we just
	 * break some ties in opposite ways to ensure the results are consistent.
	 * So we define `transposeOne` here, and then call it twice to create the
	 * full `transpose` result.
	 *
	 * @param {boolean} preferB  If true, perform insertions before a given `offset` (translated appropriately); otherwise perform insertions after `offset-1` (translated appropriately).
	 * @returns {ve.dm.Transaction} The new version of `a`
	 */
	function transposeOne( doc, a, b, preferB ) {
		var bMap, oldStart, oldEnd, newStart, newEnd, newDoc, newIntention;
		var isMeta = false;

		// start by doing common translations.
		oldStart = oldEnd = new Position( 0 );
		if ( a.intention[1] instanceof ve.Range ) {
			oldStart = new Position( a.intention[1].start );
			oldEnd = new Position( a.intention[1].end );
			if ( a.intention[2] instanceof ve.Range ) {
				// refine by metadata pos.  (a.intention[1] is collapsed)
				oldStart = oldStart.add( 0, a.intention[2].start );
				oldEnd = oldEnd.add( 0, a.intention[2].end );
				isMeta = true;
			}
		}
		if ( oldStart.eq( oldEnd ) && !preferB ) {
			oldStart = oldEnd =
				isMeta ? oldStart.add( 0, -1 ) : oldStart.add( -1 );
		}
		// translate
		bMap = mkMap( b );
		newStart = translate( oldStart, bMap );
		newEnd = translate( oldEnd, bMap );
		if ( oldStart.eq( oldEnd ) && !preferB ) {
			newStart = newEnd =
				isMeta ? oldStart.add( 0, 1 ) : oldStart.add( 1 );
		}
		// make new arguments.
		newIntention = a.intention.slice( 0 );
		if ( a.intention[1] instanceof ve.Range ) {
			newIntention[1] = a.intention[1].isBackwards() ?
				new ve.Range( newEnd.data, newStart.data ) :
				new ve.Range( newStart.data, newEnd.data );
			if ( a.intention[2] instanceof ve.Range ) {
				newIntention[2] = a.intention[2].isBackwards() ?
					new ve.Range( newEnd.meta, newStart.meta ) :
					new ve.Range( newStart.meta, newEnd.meta );
			}
		}
		// create "after b" document.
		// FIXME: this is expensive.  Can we make a lighter-weight clone?
		// XXX: do we need to fix up internalList, like ve.dm.example does?
		newDoc = new ve.dm.Document( doc.getData( undefined, true ) );
		// oddball adjustments go here.
		tweak( newIntention );
		// create transaction result from new intention
		return ve.dm.Transaction.newFromIntention( newDoc, newIntention );
	}

	/* Public methods */

	/**
	 * @class ve.dm.Transaction
	 */

	/**
	 * Transform this transaction as though the `other` transaction had come
	 * before it.
	 * Returns a pair, `[new_version_of_this, transformed_other]`, such the the
	 * document resulting from:
	 * ```
	 * doc.commit( other );
	 * doc.commit( new_version_of_this );
	 * ```
	 * is identical to the document which would result from:
	 * ```
	 * doc.commit( this );
	 * doc.commit( transformed_other );
	 * ```
	 * Does not modify this transaction.
	 *
	 * @method
	 * @param {ve.dm.Document} doc The document that both `this` and `other` were created against.
	 * @param {ve.dm.Transaction} other The transaction to transpose against.
	 * @returns {ve.dm.Transaction[]} The pair of transposed transactions.
	 */
	ve.dm.Transaction.prototype.transpose = function ( doc, other ) {
		// Special case when this is identical to other.
		if ( ve.compare( this.intention, other.intention ) ) {
			return [ ve.dm.Transaction.newNoOp( doc ),
					 ve.dm.Transaction.newNoOp( doc ) ];
		}
		// Special case when one or the other is a no-op.
		if ( this.isNoOp() || other.isNoOp() ) {
			return [ this.copy( doc ), other.copy( doc ) ];
		}
		// Create final result by calling `transposeOne` twice.
		return [
			transposeOne( doc, this, other, false ),
			transposeOne( doc, other, this, true )
		];
	};


} )( ve );
