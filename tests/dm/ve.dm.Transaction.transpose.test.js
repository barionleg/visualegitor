/*!
 * VisualEditor DataModel Transaction transposition tests.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

QUnit.module( 've.dm.Transaction.transpose' );

/* Helper methods */

/* Tests */

QUnit.test( 'translate', function ( assert ) {

	function tr( pos ) {
		return pos.meta === ve.dm.Transaction.Position.DATA ?
			[ pos.data ] : [ pos.data, pos.meta ];
	}

	function str( pos ) {
		return '[' + tr( pos ) + ']';
	}

	function runTest( _, test ) {
		var doc, tx, i, j, pos, npos;
		doc = ve.dm.example.createExampleDocument( test.doc );
		tx = ve.dm.Transaction.newFromIntention( doc, test.tx );
		pos = [];
		for ( i = 0; ; i++ ) {
			var m = doc.metadata.getData( i );
			for ( j = 0; m && j < m.length ; j++ ) {
				pos.push( new ve.dm.Transaction.Position( i, j ) );
			}
			// "end of the existing metadata" is a common insertion point
			pos.push( new ve.dm.Transaction.Position( i, j ) );
			if ( i >= doc.data.getLength() ) {
				break;
			}
			pos.push( new ve.dm.Transaction.Position( i ) ); // points to data
		}
		npos = pos.reduce(function( o, p ) {
			o[ str(p) ] = tr(
				tx.translatePosition( p, test.excludeInsertion )
			);
			return o;
		}, {});
		assert.deepEqual( pos.map(str), Object.keys(test.out), test.desc + ': before' );
		assert.deepEqual( npos, test.out, test.desc + ': after' );
	};

	var cases = [
		{
			desc: 'Removal, deleting metadata',
			doc: 'withMeta',
			tx: [ 'newFromRemoval', new ve.Range( 1, 9 ), true ],
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0], // (start of deletion)
				'[1]':   [1],
				'[2,0]': [1,0],
				'[2]':   [1],
				'[3,0]': [1,0],
				'[3]':   [1],
				'[4,0]': [1,0], // actual metadata here
				'[4,1]': [1,0], // after existing metadata
				'[4]':   [1],
				'[5,0]': [1,0],
				'[5]':   [1],
				'[6,0]': [1,0],
				'[6]':   [1],
				'[7,0]': [1,0], // actual metadata here
				'[7,1]': [1,0], // after existing metadata
				'[7]':   [1],
				'[8,0]': [1,0],
				'[8]':   [1],
				'[9,0]': [1,0], // (end of deletion), actual metadata here
				'[9,1]': [1,1], // after existing metadata
				'[9]':   [1],
				'[10,0]':[2,0],
				'[10]':  [2],
				'[11,0]':[3,0],
				'[11,1]':[3,1],
				'[11,2]':[3,2],
				'[11,3]':[3,3],
				'[11,4]':[3,4], // after existing metadata
				'[11]':  [3],
				'[12,0]':[4,0],
				'[12]':  [4],
				'[13,0]':[5,0] // after the last data
			}
		},
		{
			desc: 'Removal, merging metadata',
			doc: 'withMeta',
			tx: [ 'newFromRemoval', new ve.Range( 1, 9 ) ],
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0], // (start of deletion)
				'[1]':   [1],
				'[2,0]': [1,0],
				'[2]':   [1],
				'[3,0]': [1,0],
				'[3]':   [1],
				'[4,0]': [1,0], // actual metadata here
				'[4,1]': [1,1], // after existing metadata
				'[4]':   [1],
				'[5,0]': [1,1],
				'[5]':   [1],
				'[6,0]': [1,1],
				'[6]':   [1],
				'[7,0]': [1,1], // actual metadata here
				'[7,1]': [1,2], // after existing metadata
				'[7]':   [1],
				'[8,0]': [1,2],
				'[8]':   [1],
				'[9,0]': [1,2], // (end of deletion), actual metadata here
				'[9,1]': [1,3], // after existing metadata
				'[9]':   [1],
				'[10,0]':[2,0],
				'[10]':  [2],
				'[11,0]':[3,0],
				'[11,1]':[3,1],
				'[11,2]':[3,2],
				'[11,3]':[3,3],
				'[11,4]':[3,4], // after existing metadata
				'[11]':  [3],
				'[12,0]':[4,0],
				'[12]':  [4],
				'[13,0]':[5,0] // after the last data
			}
		},
		{
			desc: 'Data Insertion, !excludeInsertion',
			doc: 'withMeta',
			tx: [ 'newFromInsertion', new ve.Range( 4, 4 ), [ 'X', 'Y' ] ],
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0],
				'[1]':   [1],
				'[2,0]': [2,0],
				'[2]':   [2],
				'[3,0]': [3,0],
				'[3]':   [3],
				// insertion goes here
				'[4,0]': [6,0], // actual metadata here
				'[4,1]': [6,1], // after existing metadata
				'[4]':   [6],
				'[5,0]': [7,0],
				'[5]':   [7],
				'[6,0]': [8,0],
				'[6]':   [8],
				'[7,0]': [9,0], // actual metadata here
				'[7,1]': [9,1], // after existing metadata
				'[7]':   [9],
				'[8,0]': [10,0],
				'[8]':   [10],
				'[9,0]': [11,0], // actual metadata here
				'[9,1]': [11,1], // after existing metadata
				'[9]':   [11],
				'[10,0]':[12,0],
				'[10]':  [12],
				'[11,0]':[13,0],
				'[11,1]':[13,1],
				'[11,2]':[13,2],
				'[11,3]':[13,3],
				'[11,4]':[13,4], // after existing metadata
				'[11]':  [13],
				'[12,0]':[14,0],
				'[12]':  [14],
				'[13,0]':[15,0] // after the last data
			}
		},
		{
			desc: 'Data Insertion, excludeInsertion',
			doc: 'withMeta',
			tx: [ 'newFromInsertion', new ve.Range( 4, 4 ), [ 'X', 'Y' ] ],
			excludeInsertion: true,
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0],
				'[1]':   [1],
				'[2,0]': [2,0],
				'[2]':   [2],
				'[3,0]': [3,0],
				'[3]':   [3],
				// insertion goes here
				'[4,0]': [6,0], // actual metadata here
				'[4,1]': [6,1], // after existing metadata
				'[4]':   [4], // weird, right?
				'[5,0]': [7,0],
				'[5]':   [7],
				'[6,0]': [8,0],
				'[6]':   [8],
				'[7,0]': [9,0], // actual metadata here
				'[7,1]': [9,1], // after existing metadata
				'[7]':   [9],
				'[8,0]': [10,0],
				'[8]':   [10],
				'[9,0]': [11,0], // actual metadata here
				'[9,1]': [11,1], // after existing metadata
				'[9]':   [11],
				'[10,0]':[12,0],
				'[10]':  [12],
				'[11,0]':[13,0],
				'[11,1]':[13,1],
				'[11,2]':[13,2],
				'[11,3]':[13,3],
				'[11,4]':[13,4], // after existing metadata
				'[11]':  [13],
				'[12,0]':[14,0],
				'[12]':  [14],
				'[13,0]':[15,0] // after the last data
			}
		},
		{
			desc: 'Metadata Insertion, !excludeInsertion',
			doc: 'withMeta',
			tx: [ 'newFromMetadataInsertion', new ve.Range( 4, 4 ), new ve.Range( 0, 0 ), [ { type: 'alienMeta', attributes: { style: 'comment', text: 'X' } } ] ],
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0],
				'[1]':   [1],
				'[2,0]': [2,0],
				'[2]':   [2],
				'[3,0]': [3,0],
				'[3]':   [3],
				'[4,0]': [4,1], // actual metadata here (insertion here)
				'[4,1]': [4,2], // after existing metadata
				'[4]':   [4],
				'[5,0]': [5,0],
				'[5]':   [5],
				'[6,0]': [6,0],
				'[6]':   [6],
				'[7,0]': [7,0], // actual metadata here
				'[7,1]': [7,1], // after existing metadata
				'[7]':   [7],
				'[8,0]': [8,0],
				'[8]':   [8],
				'[9,0]': [9,0], // actual metadata here
				'[9,1]': [9,1], // after existing metadata
				'[9]':   [9],
				'[10,0]':[10,0],
				'[10]':  [10],
				'[11,0]':[11,0],
				'[11,1]':[11,1],
				'[11,2]':[11,2],
				'[11,3]':[11,3],
				'[11,4]':[11,4], // after existing metadata
				'[11]':  [11],
				'[12,0]':[12,0],
				'[12]':  [12],
				'[13,0]':[13,0] // after the last data
			}
		},
		{
			desc: 'Metadata Insertion, excludeInsertion',
			doc: 'withMeta',
			tx: [ 'newFromMetadataInsertion', new ve.Range( 4, 4 ), new ve.Range( 0, 0 ), [ { type: 'alienMeta', attributes: { style: 'comment', text: 'X' } } ] ],
			excludeInsertion: true,
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0],
				'[1]':   [1],
				'[2,0]': [2,0],
				'[2]':   [2],
				'[3,0]': [3,0],
				'[3]':   [3],
				'[4,0]': [4,0], // actual metadata here (insertion here)
				'[4,1]': [4,2], // after existing metadata
				'[4]':   [4],
				'[5,0]': [5,0],
				'[5]':   [5],
				'[6,0]': [6,0],
				'[6]':   [6],
				'[7,0]': [7,0], // actual metadata here
				'[7,1]': [7,1], // after existing metadata
				'[7]':   [7],
				'[8,0]': [8,0],
				'[8]':   [8],
				'[9,0]': [9,0], // actual metadata here
				'[9,1]': [9,1], // after existing metadata
				'[9]':   [9],
				'[10,0]':[10,0],
				'[10]':  [10],
				'[11,0]':[11,0],
				'[11,1]':[11,1],
				'[11,2]':[11,2],
				'[11,3]':[11,3],
				'[11,4]':[11,4], // after existing metadata
				'[11]':  [11],
				'[12,0]':[12,0],
				'[12]':  [12],
				'[13,0]':[13,0] // after the last data
			}
		},
		{
			desc: 'Replacement, !excludeInsertion',
			doc: 'withMeta',
			tx: [ 'newFromReplacement', new ve.Range( 1, 9 ), [ 'X', 'Y' ] ],
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0], // (start of deletion/replacement)
				'[1]':   [3],
				'[2,0]': [1,0],
				'[2]':   [3],
				'[3,0]': [1,0],
				'[3]':   [3],
				'[4,0]': [1,0], // actual metadata here
				'[4,1]': [1,1], // after existing metadata
				'[4]':   [3],
				'[5,0]': [1,1],
				'[5]':   [3],
				'[6,0]': [1,1],
				'[6]':   [3],
				'[7,0]': [1,1], // actual metadata here
				'[7,1]': [1,2], // after existing metadata
				'[7]':   [3],
				'[8,0]': [1,2],
				'[8]':   [3],
				'[9,0]': [3,0], // (end of deletion), actual metadata here
				'[9,1]': [3,1], // after existing metadata
				'[9]':   [3],
				'[10,0]':[4,0],
				'[10]':  [4],
				'[11,0]':[5,0],
				'[11,1]':[5,1],
				'[11,2]':[5,2],
				'[11,3]':[5,3],
				'[11,4]':[5,4], // after existing metadata
				'[11]':  [5],
				'[12,0]':[6,0],
				'[12]':  [6],
				'[13,0]':[7,0] // after the last data
			}
		},
		{
			desc: 'Replacement, excludeInsertion',
			doc: 'withMeta',
			tx: [ 'newFromReplacement', new ve.Range( 1, 9 ), [ 'X', 'Y' ] ],
			excludeInsertion: true,
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0], // (start of deletion/replacement)
				'[1]':   [1],
				'[2,0]': [1,0],
				'[2]':   [1],
				'[3,0]': [1,0],
				'[3]':   [1],
				'[4,0]': [1,0], // actual metadata here
				'[4,1]': [1,1], // after existing metadata
				'[4]':   [1],
				'[5,0]': [1,1],
				'[5]':   [1],
				'[6,0]': [1,1],
				'[6]':   [1],
				'[7,0]': [1,1], // actual metadata here
				'[7,1]': [1,2], // after existing metadata
				'[7]':   [1],
				'[8,0]': [1,2],
				'[8]':   [1],
				'[9,0]': [3,0], // (end of deletion), actual metadata here
				'[9,1]': [3,1], // after existing metadata
				'[9]':   [3],
				'[10,0]':[4,0],
				'[10]':  [4],
				'[11,0]':[5,0],
				'[11,1]':[5,1],
				'[11,2]':[5,2],
				'[11,3]':[5,3],
				'[11,4]':[5,4], // after existing metadata
				'[11]':  [5],
				'[12,0]':[6,0],
				'[12]':  [6],
				'[13,0]':[7,0] // after the last data
			}
		},
		{
			desc: 'Replacement, excludeInsertion, removing metadata',
			doc: 'withMeta',
			tx: [ 'newFromReplacement', new ve.Range( 1, 9 ), [ 'X', 'Y' ], true ],
			excludeInsertion: true,
			out: {
				'[0,0]': [0,0],
				'[0,1]': [0,1],
				'[0,2]': [0,2], // after existing metadata
				'[0]':   [0],
				'[1,0]': [1,0], // (start of deletion/replacement)
				'[1]':   [1],
				'[2,0]': [1,0],
				'[2]':   [1],
				'[3,0]': [1,0],
				'[3]':   [1],
				'[4,0]': [1,0], // actual metadata here
				'[4,1]': [1,0], // after existing metadata
				'[4]':   [1],
				'[5,0]': [1,0],
				'[5]':   [1],
				'[6,0]': [1,0],
				'[6]':   [1],
				'[7,0]': [1,0], // actual metadata here
				'[7,1]': [1,0], // after existing metadata
				'[7]':   [1],
				'[8,0]': [1,0],
				'[8]':   [1],
				'[9,0]': [3,0], // (end of deletion), actual metadata here
				'[9,1]': [3,1], // after existing metadata
				'[9]':   [3],
				'[10,0]':[4,0],
				'[10]':  [4],
				'[11,0]':[5,0],
				'[11,1]':[5,1],
				'[11,2]':[5,2],
				'[11,3]':[5,3],
				'[11,4]':[5,4], // after existing metadata
				'[11]':  [5],
				'[12,0]':[6,0],
				'[12]':  [6],
				'[13,0]':[7,0] // after the last data
			}
		}
	];
	QUnit.expect( cases.length * 2 );
	$.each( cases, runTest );
});

QUnit.test( 'transpose (simple string changes)', function ( assert ) {
	// Simple transaction transpose tests
	var initialContent = [ { type: 'paragraph' } ];
	var finalContent = [ { type: '/paragraph' } ];
	function metaMap ( data, withClose ) {
		var meta = [];
		$.each( data, function( _, e ) {
			var el = $( '<meta property=test /> ').attr( 'content', e );
			meta.push( {
				'type': 'alienMeta',
				'attributes': {
					'domElements': el.toArray()
				}
			} );
			if ( withClose ) {
				meta.push( {
					'type': '/alienMeta'
				} );
			}
		} );
		return meta;
	}
	function makeDoc( oldValue, useMeta ) {
		var elements = initialContent;
		oldValue = oldValue.split( '' );
		if ( useMeta ) {
			elements = elements.concat( metaMap( oldValue, true ) );
		} else {
			elements = elements.concat( oldValue );
		}
		elements.push.apply( elements, finalContent );
		return ve.dm.example.createExampleDocumentFromObject( 'data', null, {
			'data': elements
		} );
	}
	function fromChange( doc, oldValue, newValue, useMeta ) {
		var commonStart, commonEnd, removed, inserted, tx;
		if ( typeof oldValue !== 'string' || typeof newValue !== 'string' ) {
			throw new Error( 'fromChange not being called correctly' );
		}
		commonStart = 0;
		while ( commonStart < newValue.length &&
			newValue.charAt( commonStart ) === oldValue.charAt( commonStart ) ) {
			commonStart++;
		}
		commonEnd = 0;
		while ( commonEnd < ( newValue.length - commonStart ) &&
			commonEnd < ( oldValue.length - commonStart ) &&
			newValue.charAt( newValue.length - commonEnd - 1 ) ===
			oldValue.charAt( oldValue.length - commonEnd - 1 )) {
			commonEnd++;
		}
		removed = oldValue.substr( commonStart, oldValue.length - commonStart - commonEnd ).split('');
		inserted = newValue.substr( commonStart, newValue.length - commonStart - commonEnd ).split('');
		// make a transaction object
		if ( useMeta ) {
			if ( removed.length === 0 ) {
				return ve.dm.Transaction.newFromMetadataInsertion(
					doc, initialContent.length, commonStart,
					metaMap( inserted )
				);
			} else if ( inserted.length === 0 ) {
				return ve.dm.Transaction.newFromMetadataRemoval(
					doc, initialContent.length,
					new ve.Range( commonStart, commonStart + removed.length )
				);
			} else if ( removed.length === 1 && inserted.length === 1 ) {
				return ve.dm.Transaction.newFromMetadataElementReplacement(
					doc, initialContent.length, commonStart,
					metaMap( inserted )[0]
				);
			} else {
				// Intention model doesn't support simultaenous insert/remove
				return ve.dm.Transaction.newNoOp( doc );
			}
		} else {
			if ( removed.length === 0 ) {
				return ve.dm.Transaction.newFromInsertion(
					doc, initialContent.length + commonStart, inserted
				);
			} else if ( inserted.length === 0 ) {
				return ve.dm.Transaction.newFromRemoval(
					doc,
					new ve.Range(
						initialContent.length + commonStart,
						initialContent.length + commonStart + removed.length
					)
				);
			} else {
				return ve.dm.Transaction.newFromReplacement(
					doc,
					new ve.Range(
						initialContent.length + commonStart,
						initialContent.length + commonStart + removed.length
					),
					inserted
				);
			}
		}
		return tx;
	}
	function apply( text, transaction, useMeta ) {
		var result = '', p = 0, retain = 'retain', replace = 'replace',
			operations = transaction.operations;
		if ( transaction.isNoOp() ) {
			return text;
		}
		if ( useMeta ) {
			retain += 'Metadata';
			replace += 'Metadata';
		} else {
			for ( result = ''; result.length < initialContent.length; )
				result += '@';
			text = result + text;
			for ( result = ''; result.length < finalContent.length; )
				result += '@';
			text += result;
			result = '';
		}
		operations = useMeta ? stripNonMeta( operations ) : operations;
		$.each( operations, function(_, t) {
			if ( t.type === retain ) {
				result += text.substr( p, t.length );
				p += t.length;
			} else if ( t.type === replace ) {
				if ( useMeta ) {
					result += t.insert.map(function(m) {
						return $(m.attributes.domElements[0]).attr( 'content' );
					}).join( '' );
				} else {
					result += t.insert.join( '' );
				}
				p += t.remove.length;
			} else {
				throw new Error( 'Unexpected transaction operation: ' + t.type );
			}
		} );
		if ( !useMeta ) {
			result = result.substring(
				initialContent.length, result.length - finalContent.length
			);
		}
		return result;
	}
	function stripNonMeta( operations ) {
		// remove initial content from operations
		var last = operations.length - 1;
		if (operations[0].type !== 'retain' ||
			operations[last].type !== 'retain') {
			throw new Error( "unexpected operations" );
		}
		operations = operations.slice(
			(--operations[0].length === 0) ? 1 : 0,
			(--operations[last].length === 0) ? last : last + 1
		);
		operations.forEach(function(op) {
			if (op.type === 'replace' ) {
				delete op.insertedDataLength;
				delete op.insertedDataOffset;
			}
		});
		return operations;
	}
	function stripMeta( operations, totalLength ) {
		var r = new ve.dm.Transaction( [ 'bogus' ] );
		var unMeta = function(m) {
			return $(m.attributes.domElements[0]).attr( 'content' );
		};
		$.each( operations, function( _, op ) {
			switch ( op.type ) {
			case 'retainMetadata':
				r.pushRetain( op.length );
				break;
			case 'replaceMetadata':
				r.pushReplaceInternal( op.remove.map(unMeta), op.insert.map(unMeta) );
				break;
			default:
				break;
			}
		} );
		// retaining all metadata turns into an empty ops array because the
		// tranaction uses `retain` rather than `retainMetadata`.  Handle
		// that case.
		if ( r.operations.length === 0 ) {
			r.pushRetain( totalLength );
		}
		return r.operations;
	}
	function runTest( _, test ) {
		var doc, txa, txb, result, to1, to2, aops, bops,
			desc = test.desc, useMeta = test.useMeta;
		doc = makeDoc( test.from, useMeta );
		txa = fromChange( doc, test.from, test.a, useMeta );
		txb = fromChange( doc, test.from, test.b, useMeta );
		if ( txa.isNoOp() || txb.isNoOp() ) {
			// skip this test, not applicable
			assert.ok( true ); assert.ok( true );
			assert.ok( true ); assert.ok( true );
			return;
		}
		result = txa.transpose( doc, txb );
		to1 = apply( apply( test.from, txa, useMeta ), result[1], useMeta );
		to2 = apply( apply( test.from, txb, useMeta ), result[0], useMeta );
		assert.strictEqual( to1, test.to, desc + ': result after A, B\'' );
		assert.strictEqual( to2, test.to, desc + ': result after B, A\'' );
		aOps = result[0].getOperations();
		bOps = result[1].getOperations();
		if ( useMeta ) {
			aOps = stripMeta( aOps, test.to.length );
			bOps = stripMeta( bOps, test.to.length );
		} else {
			aOps = stripNonMeta( aOps );
			bOps = stripNonMeta( bOps );
		}
		assert.deepEqual( aOps, test.aprime, desc + ': operations in A\'' );
		assert.deepEqual( bOps, test.bprime, desc + ': operations in B\'' );
	}
	var cases = [
		{
			desc: 'Two insertions',
			from: 'abcdef',
			a: 'Xabcdef', // [insert "X" @0]
			b: 'aYbcdef', // [insert "Y" @1]
			aprime: [ // -> becomes [insert "X" @0]
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 7 }
			],
			bprime: [ // -> becomes [insert "Y" @2]
				{ type: 'retain', length: 2 },
				{ type: 'replace', insert: [ 'Y' ], remove: [] },
				{ type: 'retain', length: 5 }
			],
			to: 'XaYbcdef',
			symmetric: true
		},
		{
			desc: 'Insert at same spot (1)',
			from: 'abc',
			a: 'abcX', // [insert "X" @3]
			b: 'abcY', // [insert "Y" @3]
			aprime: [ // -> becomes [insert "X" @4]
				{ type: 'retain', length: 4 },
				{ type: 'replace', insert: [ 'X' ], remove: [] }
			],
			bprime: [ // -> becomes [insert "Y" @3]
				{ type: 'retain', length: 3 },
				{ type: 'replace', insert: [ 'Y' ], remove: [] },
				{ type: 'retain', length: 1 }
			],
			to: 'abcYX' // precedence matters
		},
		{
			desc: 'Insert at same spot (2)',
			from: 'abcdef',
			a: 'Xabcdef', // [insert "X" @0]
			b: 'Yabcdef', // [insert "Y" @0]
			aprime: [ // -> becomes [insert "X" @1]
				{ type: 'retain', length: 1 },
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 6 }
			],
			bprime: [ // -> becomes [insert "Y" @0]
				{ type: 'replace', insert: [ 'Y' ], remove: [] },
				{ type: 'retain', length: 7 }
			],
			to: 'YXabcdef' // precedence matters
		},
		{
			desc: 'Two deletions (1)',
			from: 'abcdef',
			a: 'bcdef', // [delete 1 chars @0]
			b: 'acdef', // [delete 1 chars @1]
			aprime: [ // -> becomes [delete 1 chars @0]
				{ type: 'replace', insert: [], remove: [ 'a' ] },
				{ type: 'retain', length: 4 }
			],
			bprime: [ // -> becomes [delete 1 chars @0]
				{ type: 'replace', insert: [], remove: [ 'b' ] },
				{ type: 'retain', length: 4 }
			],
			to: 'cdef',
			symmetric: true
		},
		{
			desc: 'Two deletions (2)',
			from: 'abcdef',
			a: 'cdef', // [delete 2 chars @0]
			b: 'acdef', // [delete 1 chars @1]
			aprime: [ // -> becomes [delete 1 chars @0]
				{ type: 'replace', insert: [], remove: [ 'a' ] },
				{ type: 'retain', length: 4 }
			],
			bprime: [ // -> becomes [no-op]
				{ type: 'retain', length: 4 }
			],
			to: 'cdef',
			symmetric: true
		}/*,
		{
			desc: 'Two deletions (3)',
			from: 'abcdef',
			a: 'bcdef', // [delete 1 chars @0]
			b: 'acdef', // [delete 1 chars @1]
			aprime: [ // -> becomes [delete 1 chars @0]
				{ type: 'replace', insert: [], remove: [ 'a' ] },
				{ type: 'retain', length: 4 }
			],
			bprime: [ // -> becomes [delete 1 chars @0]
				{ type: 'replace', insert: [], remove: [ 'b' ] },
				{ type: 'retain', length: 4 }
			],
			to: 'cdef',
			symmetric: true
		},
		{
			desc: 'Two deletions (4)',
			from: 'abcdef',
			a: 'ef', // [delete 4 chars @0]
			b: 'acdef', // [delete 1 chars @1]
			aprime: [ // -> becomes [delete 3 chars @0]
				{ type: 'replace', insert: [], remove: [ 'a', 'c', 'd' ] },
				{ type: 'retain', length: 2 }
			],
			bprime: [ // -> becomes [no-op]
				{ type: 'retain', length: 2 }
			],
			to: 'ef',
			symmetric: true
		},
		{
			desc: 'Two deletions (5)',
			from: 'abcdef',
			a: 'def', // [delete 3 chars @0]
			b: 'ab', // [delete 4 chars @2]
			aprime: [ // -> becomes [delete 2 chars @0]
				{ type: 'replace', insert: [], remove: [ 'a', 'b' ] }
			],
			bprime: [ // -> becomes [delete 3 chars @0]
				{ type: 'replace', insert: [], remove: [ 'd', 'e', 'f' ] }
			],
			to: '',
			symmetric: true
		},
		{
			desc: 'Insertion and replacement (1)',
			from: 'abcdef',
			a: 'Xabcdef', // [insert "X" @0]
			b: 'abYef', // [replace 2 chars with "Y" @2]
			aprime: [ // -> becomes [insert "X" @0]
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 5 }
			],
			bprime: [ // -> becomes [replace 2 chars with "Y" @3]
				{ type: 'retain', length: 3 },
				{ type: 'replace', insert: [ 'Y' ], remove: [ 'c', 'd' ] },
				{ type: 'retain', length: 2 }
			],
			to: 'XabYef',
			symmetric: true
		},
		{
			desc: 'Insertion and replacement (2)',
			from: 'abcdef',
			a: 'abYef', // [replace 2 chars with "Y" @2]
			b: 'abXcdef', // [insert "X" @2]
			aprime: [ // -> becomes [replace 2 chars with "Y" @3]
				{ type: 'retain', length: 3 },
				{ type: 'replace', insert: [ 'Y' ], remove: [ 'c', 'd' ] },
				{ type: 'retain', length: 2 }
			],
			bprime: [ // -> becomes [insert "X" @2]
				{ type: 'retain', length: 2 },
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 3 }
			],
			to: 'abXYef',
			symmetric: true
		},
		{
			desc: 'Insertion and replacement (3)',
			from: 'abcdef',
			a: 'aXbcdef', // [insert "X" @1]
			b: 'Ydef', // [replace 3 chars with "Y" @0]
			aprime: [ // -> becomes [insert "X" @0]
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 4 }
			],
			bprime: [ // -> becomes [replace 4 chars with "XY" @0]
				{ type: 'replace', insert: [ 'X', 'Y' ], remove: [ 'a', 'X', 'b', 'c' ] },
				{ type: 'retain', length: 3 }
			],
			to: 'XYdef'
		},
		{
			desc: 'Insertion and replacement (3) [flipped]',
			from: 'abcdef',
			a: 'Ydef', // [replace 3 chars with "Y" @0]
			b: 'aXbcdef', // [insert "X" @1]
			aprime: [ // -> becomes [replace 4 chars with "YX" @0]
				{ type: 'replace', insert: [ 'Y', 'X' ], remove: [ 'a', 'X', 'b', 'c' ] },
				{ type: 'retain', length: 3 }
			],
			bprime: [ // -> becomes [insert "X" @1]
				{ type: 'retain', length: 1 },
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 3 }
			],
			to: 'YXdef'
		},
		{
			desc: 'Insertion and replacement (4)',
			from: 'abcdef',
			a: 'Ydef', // [replace 3 chars with "Y" @0]
			b: 'aXbcdef', // [insert "X" @1]
			aprime: [ // -> becomes [replace 4 chars with "YX" @0]
				{ type: 'replace', insert: [ 'Y','X' ], remove: [ 'a', 'X', 'b', 'c' ] },
				{ type: 'retain', length: 3 }
			],
			bprime: [ // -> becomes [insert "X" @1]
				{ type: 'retain', length: 1 },
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 3 }
			],
			to: 'YXdef'
		},
		{
			desc: 'Insertion and replacement (4) [flipped]',
			from: 'abcdef',
			a: 'aXbcdef', // [insert "X" @1]
			b: 'Ydef', // [replace 3 chars with "Y" @0]
			aprime: [ // -> becomes [insert "X" @0]
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 4 }
			],
			bprime: [ // -> becomes [replace 4 chars with "XY" @0]
				{ type: 'replace', insert: [ 'X','Y' ], remove: [ 'a', 'X', 'b', 'c' ] },
				{ type: 'retain', length: 3 }
			],
			to: 'XYdef'
		},
		{
			desc: 'Insertion and replacement (5)',
			from: 'abcdef',
			a: 'abcdXef', // [insert "X" @ 4]
			b: 'abYef', // [replace 2 chars with "Y" @2]
			aprime: [ // -> becomes [insert "X" @3]
				{ type: 'retain', length: 3 },
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 2 }
			],
			bprime: [ // -> becomes [replace 2 chars with "Y" @2]
				{ type: 'retain', length: 2 },
				{ type: 'replace', insert: [ 'Y' ], remove: [ 'c', 'd' ] },
				{ type: 'retain', length: 3 }
			],
			to: 'abYXef'
		},
		{
			desc: 'Insertion and replacement (5) [flipped]',
			from: 'abcdef',
			a: 'abYef', // [replace 2 chars with "Y" @2]
			b: 'abcdXef', // [insert "X" @ 4]
			aprime: [ // -> becomes [replace 3 chars with "XY" @2]
				{ type: 'retain', length: 2 },
				{ type: 'replace', insert: [ 'Y' ], remove: [ 'c', 'd' ] },
				{ type: 'retain', length: 3 }
			],
			bprime: [ // -> becomes [insert "X" @2]
				{ type: 'retain', length: 3 },
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 2 }
			],
			to: 'abYXef'
		},
		{
			desc: 'Insertion and replacement (6)',
			from: 'abcdef',
			a: 'Xabcdef', // [insert "X" @0]
			b: 'abYef', // [replace 2 chars with "Y" @2]
			aprime: [ // -> becomes [insert "X" @0]
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 5 }
			],
			bprime: [ // -> becomes [replace 2 chars with "Y" @3]
				{ type: 'retain', length: 3 },
				{ type: 'replace', insert: [ 'Y' ], remove: [ 'c', 'd' ] },
				{ type: 'retain', length: 2 }
			],
			to: 'XabYef',
			symmetric: true
		},
		{
			desc: 'Simultaneous identical changes',
			from: 'abcdef',
			a: 'aXcYef', // [replace 3 char with "XcY" @1]
			b: 'aXcYef', // [replace 3 char with "XcY" @1]
			aprime: [ // -> becomes no-op
			],
			bprime: [ // -> becomes no-op
			],
			to: 'aXcYef'
		},
		{
			desc: 'Remove while insert',
			from: 'abcd',
			a: 'abXcd',
			b: 'ad',
			aprime: [
				{ type: 'retain', length: 1 },
				{ type: 'replace', insert: [ 'X' ], remove: [] },
				{ type: 'retain', length: 1 }
			],
			bprime: [
				{ type: 'retain', length: 1 },
				{ type: 'replace', insert: [ 'X' ], remove: [ 'b', 'X', 'c' ] },
				{ type: 'retain', length: 1 }
			],
			to: 'aXd',
			symmetric: true
		}*/
	];
	$.each( cases, function( _, test ) {
		if ( test.symmetric ) {
			cases.push( {
				desc: test.desc + ' [flipped]',
				from: test.from,
				a: test.b,
				b: test.a,
				aprime: test.bprime,
				bprime: test.aprime,
				to: test.to
			} );
		}
	});
	$.each( cases, function( _, test ) {
		var newTest = ve.copy ( test );
		newTest.desc += ' [meta]';
		newTest.useMeta = true;
		cases.push( newTest );
	} );

	QUnit.expect( cases.length * 4 );
	$.each( cases, runTest );
});

/*
QUnit.test( 'transpose (with ve.dm.Document)', function ( assert ) {
	// Transaction transpose tests with a full ve.dm.Document.
	var cases,
		metadataElement = {
			'type': 'alienMeta',
			'attributes': {
				'style': 'comment',
				'text': ' inline '
			}
		};
	function runTest2( _, test ) {
		var doc1, doc2, txa, txb, result, expected;
		doc1 = ve.dm.example.createExampleDocument( test.doc );
		doc2 = ve.dm.example.createExampleDocument( test.doc );
		txa = ve.dm.Transaction[ test.a[0] ].apply(null, [ doc1 ].concat( test.a.slice(1) ) );
		txb = ve.dm.Transaction[ test.b[0] ].apply(null, [ doc2 ].concat( test.b.slice(1) ) );
		if ( test.disabled ) {
			// make the number of assertions work out correctly before we bail.
			assert.ok(true); assert.ok(true); assert.ok(true); assert.ok(true);
			return;
		}
		result = txa.transpose( doc1, txb );
		assert.deepEqualWithDomElements( result[0].getOperations(), test.aprime,
			test.desc + ': operations in A\'' );
		assert.deepEqualWithDomElements( result[1].getOperations(), test.bprime,
			test.desc + ': operations in B\'' );
		// apply a, then b' to doc1
		doc1.commit( txa ); doc1.commit( result[1] );
		// apply b, then a' to doc2
		doc2.commit( txb ); doc2.commit( result[0] );
		// both documents should be identical.
		assert.equalNodeTree( doc1.getDocumentNode(), doc2.getDocumentNode(),
			test.desc + ': results after A,B\' and B,A\' match' );
		// verify resulting document.
		expected = ve.dm.example.createExampleDocument( test.doc ).getFullData();
		test.expected( expected ); // adjust expectations
		assert.deepEqualWithDomElements( doc1.getFullData(), expected, test.desc + ': result as expected' );
	}
	cases = [
		{
			desc: 'Simple insertion',
			doc: 'data',
			a: [ 'newFromInsertion', 0, [
				{ 'type': 'paragraph' }, 'X', { 'type': '/paragraph' }
			] ],
			b: [ 'newFromInsertion', 0, [
				{ 'type': 'paragraph' }, 'Y', { 'type': '/paragraph' }
			] ],
			aprime: [
				{ type: 'retain', length: 3 },
				{ type: 'replace', remove: [], insert: [
					{ 'type': 'paragraph' }, 'X', { 'type': '/paragraph' }
				] },
				{ type: 'retain', length: 63 }
			],
			bprime: [
				{ type: 'replace', remove: [], insert: [
					{ 'type': 'paragraph' }, 'Y', { 'type': '/paragraph' }
				] },
				{ type: 'retain', length: 66 }
			],
			expected: function( data ) {
				ve.batchSplice(data, 0, 0, [
					{ 'type': 'paragraph' }, 'Y', { 'type': '/paragraph' },
					{ 'type': 'paragraph' }, 'X', { 'type': '/paragraph' }
				]);
			}
		},
		{
			desc: 'Insert and wrap',
			doc: 'data',
			a: [ 'newFromWrap', new ve.Range( 1, 4 ),
				 [ { 'type': 'heading', 'attributes': { 'level': 1 } } ],
				 [ { 'type': 'paragraph' } ], [], []
			],
			b: [ 'newFromInsertion', 0, [
				{ 'type': 'paragraph' }, 'X', { 'type': '/paragraph' }
			] ],
			aprime: [
				{ type: 'retain', length: 3 },
				{ type: 'replace', remove: [
					{ 'type': 'heading', 'attributes': { 'level': 1 } }
				], insert: [
					{ 'type': 'paragraph' }
				] },
				{ type: 'retain', length: 3 },
				{ type: 'replace', remove: [
					{ 'type': '/heading' }
				], insert: [
					{ 'type': '/paragraph' }
				] },
				{ type: 'retain', length: 58 }
			],
			bprime: [
				{ type: 'replace', remove: [], insert: [
					{ 'type': 'paragraph' }, 'X', { 'type': '/paragraph' }
				] },
				{ type: 'retain', length: 63 }
			],
			expected: function( data ) {
				ve.batchSplice( data, 0, 1, [
					{ 'type': 'paragraph' }, 'X', { 'type': '/paragraph' },
					{ 'type': 'paragraph' }
				]);
				ve.batchSplice( data, 7, 1, [
					{ 'type': '/paragraph' }
				]);
			},
			symmetric: true
		},
		{
			desc: 'Insertion with metadata present',
			disabled: disableMetadataTests,
			doc: 'withMeta',
			a: [ 'newFromRemoval', new ve.Range( 1, 4 ) ],
			b: [ 'newFromRemoval', new ve.Range( 7, 10 ) ],
			aprime: [
				{ type: 'retain', length: 1 },
				{ type: 'replace', remove: [ 'F', 'o', 'o' ], insert: [] },
				{ type: 'retain', length: 6 }
			],
			bprime: [
				{ type: 'retain', length: 4 },
				{
					type: 'replace',
					insert: [],
					insertMetadata: [],
					remove: [ 'B', 'a', 'z' ],
					removeMetadata: [
						[ {
							type: 'alienMeta',
							attributes: {
								'domElements': $( '<meta property="foo" content="bar" />' ).toArray()
							}
						} ],
						undefined,
						[ {
							type: 'alienMeta',
							attributes: {
								'domElements': $( '<!-- inline -->' ).toArray()
							}
						} ]
					]
				},
				{
					type: 'replaceMetadata',
					remove: [],
					insert: [
						{
							type: 'alienMeta',
							attributes: {
								'domElements': $( '<meta property="foo" content="bar" />' ).toArray()
							}
						},
						{
							type: 'alienMeta',
							attributes: {
								'domElements': $( '<!-- inline -->' ).toArray()
							}
						}
					]
				},
				{ type: 'retain', length: 3 }
			],
			expected: function( data ) {
				ve.batchSplice( data, 19, 1, [] );
				ve.batchSplice( data, 15, 2, [] );
				ve.batchSplice( data, 5, 3, [] );
			},
			symmetric: true
		},
		{
			desc: 'Metadata insertion/removal',
			disabled: disableMetadataTests,
			doc: 'withMeta',
			a: [ 'newFromMetadataInsertion', 11, 2, [ metadataElement ] ],
			b: [ 'newFromMetadataRemoval', 11, new ve.Range( 1, 3 ) ],
			aprime: [
				{ 'type': 'retain', 'length': 11 },
				{ 'type': 'retainMetadata', 'length': 1 },
				{
					'type': 'replaceMetadata',
					'remove': [],
					'insert': [ metadataElement ]
				},
				{ 'type': 'retainMetadata', 'length': 1 },
				{ 'type': 'retain', 'length': 2 }
			],
			bprime: [
				{ 'type': 'retain', 'length': 11 },
				{ 'type': 'retainMetadata', 'length': 1 },
				{
					'type': 'replaceMetadata',
					'remove': [
						ve.dm.example.createExampleDocument( 'withMeta' ).metadata.getData( 11 )[ 1 ],
						metadataElement,
						ve.dm.example.createExampleDocument( 'withMeta' ).metadata.getData( 11 )[ 2 ]
					],
					'insert': [ metadataElement ]
				},
				{ 'type': 'retainMetadata', 'length': 1 },
				{ 'type': 'retain', 'length': 2 }
			],
			expected: function( data ) {
				ve.batchSplice( data, 23, 4, [
					metadataElement,
					{ 'type': '/alienMeta' }
				] );
			},
			symmetric: true
		},
		{
			desc: 'Replace over metadata insertion',
			disabled: disableMetadataTests || true, // we don't support this yet
			doc: 'data',
			a: [ 'newFromMetadataInsertion', 2, 0, [ metadataElement ] ],
			b: [ 'newFromRemoval', new ve.Range( 1, 4 ) ],
			aprime: [
				{ 'type': 'retain', 'length': 1 },
				{
					'type': 'replaceMetadata',
					'remove': [],
					'insert': [ metadataElement ]
				},
				{ 'type': 'retain', 'length': 59 }
			],
			bprime: [
				{ 'type': 'retain', 'length': 1 },
				{
					'type': 'replace',
					'remove': [
						'a',
						['b', [ ve.dm.example.bold ]],
						['c', [ ve.dm.example.italic ]]
					],
					'removeMetadata': [
						undefined,
						[ metadataElement ],
						undefined
					],
					'insert': [],
					'insertMetadata': []
				},
				{
					'type': 'replaceMetadata',
					'remove': [],
					'insert': [ metadataElement ]
				},
				{ 'type': 'retain', 'length': 59 }
			],
			expected: function( data ) {
				ve.batchSplice( data, 1, 3, [
					metadataElement,
					{ 'type': '/alienData' }
				] );
			},
			symmetric: true
		}
	];
	$.each( cases, function( _, test ) {
		if ( test.symmetric && !test.disabled ) {
			cases.push( {
				desc: test.desc + ' [flipped]',
				doc: test.doc,
				a: test.b,
				b: test.a,
				aprime: test.bprime,
				bprime: test.aprime,
				expected: test.expected
			} );
		}
	});
	QUnit.expect( cases.length * 4);
	$.each( cases, runTest2 );
});

QUnit.test( 'transpose (n-way)', function ( assert ) {
	// Do N^2 transposition of N different transactions, taken two
	// at a time.  Verify that the results are consistent.
	var cases, n = 0;
	function runTest3( desc, doc, a, b ) {
		var doc1, doc2, txa, txb, result;
		doc1 = ve.dm.example.createExampleDocument( doc );
		doc2 = ve.dm.example.createExampleDocument( doc );
		txa = ve.dm.Transaction[ a[0] ].apply(null, [ doc1 ].concat( a.slice(1) ) );
		txb = ve.dm.Transaction[ b[0] ].apply(null, [ doc2 ].concat( b.slice(1) ) );
		result = txa.transpose( doc1, txb );
		// apply a, then b' to doc1
		doc1.commit( txa ); doc1.commit( result[1] );
		// apply b, then a' to doc2
		doc2.commit( txb ); doc2.commit( result[0] );
		// both documents should be identical.
		assert.equalNodeTree(
			doc1.getDocumentNode(), doc2.getDocumentNode(),
			desc + ': results after A,B\' and B,A\' match'
		);
	}

	cases = [
		{
			doc: 'data',
			transactions: {
				// insertions at same point
				'insert X@0': [
					'newFromInsertion', 0,
					[ { 'type': 'paragraph' }, 'X', { 'type': '/paragraph' } ]
				],
				'insert Y@0': [
					'newFromInsertion', 0,
					[ { 'type': 'paragraph' }, 'Y', { 'type': '/paragraph' } ]
				],
				// overlapping removals
				'remove ab': [
					'newFromRemoval', new ve.Range( 1, 3 )
				],
				'remove bc': [
					'newFromRemoval', new ve.Range( 2, 4 )
				],
				// wrap
				'convert heading': [
					'newFromWrap', new ve.Range( 1, 4 ),
					[ { 'type': 'heading', 'attributes': { 'level': 1 } } ],
					[ { 'type': 'paragraph' } ], [], []
				],
				// overlapping attribute change
				'change heading attrib': [
					'DISABLED', // attrib not yet supported by transpose
					'newFromAttributeChanges', 0, { 'level': 2 }
				],
				// overlapping annotation change
				'bold a': [
					'DISABLED', // annotation not yet supported by transpose
					'newFromAnnotation', new ve.Range( 1, 2 ), 'set',
					ve.dm.example.createAnnotation( ve.dm.example.bold )
				]
			}
		}
	];
	$.each( cases, function( _, c ) {
		var len = Object.keys( c.transactions ).length;
		n += len * len;
	} );
	QUnit.expect( n );
	$.each( cases, function( _, c ) {
		$.each( c.transactions, function( aDesc, a ) {
			$.each( c.transactions, function( bDesc, b ) {
				if ( a[0] === 'DISABLED' || b[0] === 'DISABLED' ) {
					assert.ok( true ); // skip this transaction
				} else {
					runTest3( aDesc + ' <-> ' + bDesc, c.doc, a, b );
				}
			} );
		} );
	} );
});
*/
