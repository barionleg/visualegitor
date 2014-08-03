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
	 *
	 * That is, a typical data stream and its `Position` tuples might be:
	 * ```
	 *   Metadata A, Data 1, Metadata B, Metadata C, Data 2
	 *   (0,0)      (0,DATA)   (1,0)      (1,1)     (1,DATA)
	 * ```
	 */
	function Position(dataPos, metadataPos) {
		this.data = dataPos;
		this.meta = (metadataPos === undefined) ? Position.DATA : metadataPos;
	}
	Position.DATA = {};

	/**
	 * Add a `Position` to this one.
	 * A data/metadata tuple of integers can be passed instead of a `Position`.
	 */
	Position.prototype.add = function( d, m ) {
		if ( d instanceof Position ) {
			return this.add( d.data, d.meta );
		}
		if ( m === undefined || m === Position.DATA ) {
			return new Position( this.data + d, 0 );
		}
		if ( this.meta === Position.DATA ) {
			if ( m === 0 ) {
				return new Position( this.data + d, this.meta );
			} else {
				throw new Error( "can't advance pointer to DATA" );
			}
		}
		return new Position( this.data + d, this.meta + m );
	};
	/**
	 * Subtract a `Position` from this one.
	 * A data/metadata tuple of integers can be passed instead of a `Position`.
	 */
	Position.prototype.subtract = function( d, m ) {
		if ( d instanceof Position ) {
			return this.subtract( d.data, d.meta );
		}
		if ( m === undefined || m === Position.DATA ) {
			return this.add( -d );
		}
		return this.add( -d, -m );
	};
	/**
	 * Test two `Position` objects for equality.
	 * A data/metadata tuple of integers can be passed instead of a `Position`.
	 */
	Position.prototype.eq = function( d, m ) {
		if ( d instanceof Position ) {
			return this.eq( d.data, d.meta );
		}
		if ( m === undefined ) {
			m = Position.DATA;
		}
		return this.data === d && this.meta === m;
	};
	/**
	 * Return `true` iff this `Position` comes before the given one.
	 * A data/metadata tuple of integers can be passed instead of a `Position`.
	 */
	Position.prototype.lt = function( d, m ) {
		if ( d instanceof Position ) {
			return this.lt( d.data, d.meta );
		}
		if ( this.data === d ) {
			if ( this.meta === Position.DATA ) {
				return false;
			} else if ( m === undefined || m === Position.DATA ) {
				return true;
			}
			return this.meta < m;
		}
		return this.data < d;
	};
	Position.prototype.gte = function( d, m ) {
		return !this.lt( d, m );
	};
	Position.prototype.toString = function() {
		return 'Position(' + this.data +
			( this.meta === Position.DATA ? '' :
			  ( ',' + this.meta ) ) + ')';
	};
	ve.dm.Transaction.Position = Position; // XXX

	/**
	 * A variant of `ve.dm.Transaction.prototype.translateOffset` which
	 * works on `Position`s rather than integer (data) offsets.
	 *
	 * This is useful when you want to anticipate what an offset will
	 * be after a transaction is processed.
	 *
	 * @method
	 * @param {number} offset Offset in the linear model before the transaction has been processed
	 * @param {boolean} [excludeInsertion] Map the offset immediately before an insertion to
	 *  right before the insertion rather than right after
	 * @returns {number} Translated offset, as it will be after processing transaction
	 */

/*
 [0,0] [1,0]
 |     |
 md d0 md d1 md d2 md d3 md
 [---] retain puts up in front of metadata for next offset
       [----------] replace removes offsets, and merges (or deletes!) all metadata.
       [---] insert
       ^
*/
function tr(pos) { return pos.meta === Position.DATA ? [pos.data] : [pos.data, pos.meta]; }//XXX DEBUGGING
function str(pos) { return '[' + tr(pos) + ']'; }//XXX DEBUGGING

	ve.dm.Transaction.prototype.translatePosition = function ( position, excludeInsertion ) {
		var i, j, k, op, insertLength, removeLength, meta, metadataRemoved,
			posIsData = (position.meta === Position.DATA),
			cursor = new Position( 0, 0 ),
			adjustment = new Position( 0, 0 );
		for ( i = 0; i < this.operations.length; i++ ) {
			op = this.operations[i];
			if ( op.type === 'retain' ) {
				if ( position.gte( cursor ) &&
					 position.lt( cursor.add( op.length ) ) ) {
					return position.add( adjustment );
				}
				cursor = cursor.add( op.length );
			} else if ( op.type === 'replace' ) {
				insertLength = op.insert.length;
				removeLength = op.remove.length;
				// hopefully the intention is accurate!
				metadataRemoved = (
					this.intention[0] === 'newFromReplacement' &&
					this.intention[3]
				) || (
					this.intention[0] === 'newFromRemoval' &&
					this.intention[2]
				);
				if (
					position.gte( cursor ) &&
					// extend to metadata just past replace, so that we
					// can handle metadata merges properly
					position.lt(
						cursor.data + removeLength,
						insertLength === 0 && !metadataRemoved ?
							Position.DATA : 0
					)
				) {
					// warp to start of removed section (and meta offset of 0)
					adjustment = adjustment.add( cursor ).subtract( position );
					// removed metadata gets squashed to the front, so
					// always excludeInsertion for that.
					if ( !excludeInsertion && ( metadataRemoved || posIsData ) ) {
						adjustment = adjustment.add( insertLength, 0 );
					}
					if ( !( metadataRemoved || posIsData ) ) {
						// compute position in merged metadata
						compute_merged:
						for ( j = 0; j < removeLength; j++ ) {
							meta = op.removeMetadata[j];
							for ( k = 0; meta && k < meta.length; k++ ) {
								if ( position.gte( cursor ) &&
									 position.lt( cursor.add( 0, 1 ) ) ) {
									break compute_merged;
								}
								cursor = cursor.add( 0, 1 );
								adjustment = adjustment.add( 0, 1 );
							}
							if ( position.gte( cursor ) &&
								 position.lt( cursor.add( 1 ) ) ) {
								break compute_merged;
							}
							cursor = cursor.add( 1 );
						}
						// after remove but still in merged metadata
						if ( cursor.lt( position ) ) {
							adjustment = adjustment.add( 0, position.meta );
						}
					}
					return position.add( adjustment );
				} else if ( excludeInsertion && posIsData && position.data === cursor.data ) {
					return position.add( adjustment );
				} else {
					adjustment = adjustment.add( insertLength - removeLength );
				}
				cursor = cursor.add( removeLength );
			} else if ( op.type === 'retainMetadata' ||
						op.type === 'replaceMetadata' ) {
				if ( position.data === cursor.data ) {
					break;
				}
			}
			// ignore other op types
		}
		// step forward to look at metadata position
		for ( ; i < this.operations.length && !posIsData; i++ ) {
			op = this.operations[i];
			if ( op.type === 'retainMetadata' ) {
				if ( position.gte( cursor ) &&
					 position.lt( cursor.add( 0, op.length ) ) ) {
					// done!
					break;
				}
				cursor = cursor.add( 0, op.length );
			} else if ( op.type === 'replaceMetadata' ) {
				insertLength = op.insert.length;
				removeLength = op.remove.length;
				if ( position.gte( cursor ) &&
					 position.lt( cursor.add( 0, removeLength ) ) ) {
					// warp to start of removed section.
					adjustment = adjustment.add( cursor ).subtract( position );
					if ( !excludeInsertion ) {
						adjustment = adjustment.add( 0, insertLength );
					}
					break;
				} else if ( excludeInsertion && position.eq( cursor ) ) {
					break;
				} else {
					adjustment = adjustment.add( 0, insertLength - removeLength );
				}
				cursor = cursor.add( 0, removeLength );
			} else if ( op.type === 'retain' || op.type === 'replace' ) {
				break;
			}
			// ignore other types of ops
		}
		return position.add( adjustment );
	}

	/*
	 * Helper function for `transposeOne()`.
	 *
	 * We preprocess transactions' operation lists to annotate them with
	 * old position information and mutable insert/remove lists.  We
	 * call the result a 'map'.
	 */
/*
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
*/

	/*
	 * @param {boolean} preferB  If true, give position new before given old `offset`; otherwise give new position after old `offset-1`.
	 */
		// apply b operations to a to determine how offsets change
/*
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
*/

	function tweak( xxx ) {
		// XXX write me
		// what sorts of fixups need to be made?
		// handle transposition of attribute changes, wrap, etc.
	}

	// intentions:
	// newNoOp -- easy to transpose! (also isNoOp)
	// newFromReplacement
	// newFromInsertion   -- special case of newFromReplacement?
	// newFromRemoval     -- special case of newFromReplacement?
	// newFromDocumentInsertion -- special insert?
	// newFromAttributeChanges
	// newFromAnnotation
	// newFromMetadataInsertion -- special case of newFromMetadataReplacement
	// newFromMetadataRemoval   -- special case of newFromMetadataReplacement
	// newFromMetadataReplacement
	// newFromContentBranchConversion -- ???
	// newFromWrap -- ???
	// start with newFromReplacement vs newFromReplacement?
	// 7x7 - 7x6/2+7 = 28 cases

	// translate newFromInsertion/newFromRemoval into newFromReplacement.
	// and newFromMetadataInsertion/newFromMetadataReplacement into
	// newFromMetadataReplacement
	function collapsei( intention ) {
		var op = intention[0];
		if ( op === 'newFromInsertion' ) {
			return [
				'newFromReplacement', intention[1], intention[2], false
			];
		}
		if ( op === 'newFromRemoval' ) {
			return [
				'newFromReplacement', intention[1], [], intention[2]
			];
		}
		if ( op === 'newFromMetadataInsertion' ) {
			return [
				'newFromMetadataReplacement', intention[1],
				new ve.Range( intention[2] ), intention[3]
			];
		}
		if ( op === 'newFromMetadataRemoval' ) {
			return [
				'newFromMetadataReplacement', intention[1],
				intention[2], []
			];
		}
		if ( op === 'newFromMetadataElementReplacement' ) {
			return [
				'newFromMetadataReplacement', intention[1],
				new ve.Range( intention[2].from, intention[2].from + 1 ),
				[ intention[3] ]
			];
		}
		return intention;
	}
	function expandi( intention ) {
		var op, offset, range, data, removeMetadata;
		op = intention[0];
		if ( op === 'newFromMetadataReplacement' ) {
			offset = intention[1];
			range = intention[2];
			data = intention[3];
			if ( range.isCollapsed() ) {
				if ( data.length === 0 ) {
					return [ 'newNoOp' ];
				}
				return [ 'newFromMetadataInsertion', offset, range.from, data ];
			} else if ( data.length === 0 ) {
				return [ 'newFromMetadataRemoval', offset, range ];
			} else if ( range.getLength() === 1 && data.length === 1 ) {
				return [
					'newFromMetadataElementReplacement',
					offset, range.start, data[0]
				];
			}
			throw new Error( 'impossible to represent this transaction' );
		} else if ( op === 'newFromReplacement' ) {
			range = intention[1];
			data = intention[2];
			removeMetadata = intention[3];
			if ( range.isCollapsed() && !removeMetadata ) {
				return [ 'newFromInsertion', range, data ];
			}
			if ( data.length === 0 ) {
				return [ 'newFromRemoval', range, removeMetadata ];
			}
			return intention;
		}
		return intention;
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
	function transposeOneNew( doc, a, b, preferB ) {
		var ia = collapsei( a.intention ), ib = collapsei( b.intention );
		// FIXME: this is expensive.  Can we make a lighter-weight clone?
		// XXX: do we need to fix up internalList, like ve.dm.example does?
		//var afterB = doc.cloneFromRange( new ve.Range( 0, doc.data.getLength() ) );
		//var afterB = new ve.dm.Document( doc.getData( undefined, true ) );
		var afterB = new ve.dm.Document( doc.getFullData() );
		afterB.commit( b );
		// double-dispatch
		var args = [ doc, afterB, b, ib, preferB ].concat( ia.slice(1) );
		console.log('transposeOneNew', a, b, preferB);
		var result = transposeOneNew[ia[0]][ib[0]].apply(null, args);
		console.log('  ', result);
		return ve.dm.Transaction.newFromIntention( expandi( result ) );
	}
	transposeOneNew.newFromReplacement = {
		// transpose a to come after b
		newFromReplacement: function( doc, afterB, b, ib, preferB,
									  aRange, aData, aRemoveMetadata ) {
			var newRange = b.translateRange( aRange, preferB );
			return [ 'newFromReplacement', newRange, aData, aRemoveMetadata ];
		}
	};
	transposeOneNew.newFromMetadataReplacement = {
		newFromMetadataReplacement: function( doc, afterB, b, ib, preferB,
											  aOffset, aRange, aData ) {
			var newOffset = b.translateOffset( aOffset.from, preferB );
			var bOffset = ib[1], bRange = ib[2], aFrom = aRange.from, aTo = aRange.to;
			if ( newOffset !== bOffset.from ) {
				return [ 'newFromMetadataReplacement', newOffset, aRange, aData ];
			}
			if ( aFrom > bRange.from ) { // xxx
				if ( aFrom < bRange.to ) {
					aFrom = bRange.from;
				} else {
					aFrom -= bRange.getLength();
				}
			}
			if ( aTo > bRange.from ) { // xxx
				if ( aTo < bRange.to ) {
					aTo = bRange.from;
				} else {
					aTo -= bRange.getLength();
				}
			}
			return [ 'newFromMetadataReplacement', newOffset, new ve.Range( aFrom, aTo ), aData ];
		}
	};

	function transposeOneOld( doc, a, b, preferB ) {
		var bMap, oldStart, oldEnd, newStart, newEnd, newDoc, newIntention;
		var isMeta = false;

		// start by doing common translations.
		oldStart = oldEnd = new Position( 0 );
		if ( a.intention[1] instanceof ve.Range ) {
			if ( a.intention[2] instanceof ve.Range ) {
				// refine by metadata pos.  (a.intention[1] is collapsed)
				oldStart = new Position( a.intention[1].start, a.intention[2].start );
				oldEnd = new Position( a.intention[1].end, a.intention[2].end );
			} else {
				oldStart = new Position( a.intention[1].start );
				oldEnd = new Position( a.intention[1].end );
			}
		}
		newStart = b.translatePosition( oldStart, preferB );
		newEnd = b.translatePosition( oldEnd, preferB );

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
		//newDoc = new ve.dm.Document( doc.getData( undefined, true ) );
		var afterB = new ve.dm.Document( doc.getFullData() );
		afterB.commit( b );
		// oddball adjustments go here.
		tweak( newIntention );
		// create transaction result from new intention
		return ve.dm.Transaction.newFromIntention( afterB, newIntention );
	}

	var transposeOne = transposeOneOld;

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
