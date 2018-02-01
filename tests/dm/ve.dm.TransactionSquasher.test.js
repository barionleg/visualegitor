/*!
 * VisualEditor DataModel TransactionSquasher tests.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.TransactionSquasher' );

QUnit.test( 'squashIn', function ( assert ) {
	var tests, i, iLen, test, transactions, squashed, j, jLen,
		squashedBefore, squashedAfter,
		boldHash = 'hfbe3cfe099b83e1e',
		italicHash = 'he4e7c54e2204d10ba';

	function insertionTxList( before, itemSequence, after ) {
		var i, iLen,
			transactions = [];
		for ( i = 0, iLen = itemSequence.length; i < iLen; i++ ) {
			transactions.push( [ before + i, [ '', itemSequence[ i ] ], after ] );
		}
		return transactions;
	}

	function annotationOp( method, bias, hash, spliceAt ) {
		return { type: 'annotate', method: method, bias: bias, hash: hash, spliceAt:
spliceAt };
	}

	function annotationTx( start, stop, length, method, hash, spliceAt ) {
		return [
			start,
			annotationOp( method, 'start', hash, spliceAt ),
			stop - start,
			annotationOp( method, 'stop', hash, spliceAt ),
			length - stop
		];
	}

	function sequence( data ) {
		var hashList = Array.prototype.slice.call( arguments, 1 );
		return Array.prototype.map.call( data, function ( item ) {
			return hashList.length === 0 ? item : [ item, hashList ];
		} );
	}

	tests = [
		{
			message: 'Replace part of replacement',
			transactions: [
				[ 4, [ 'Aa', 'Bb' ], 4 ],
				[ 4, [ 'B', 'D' ], 5 ]
			],
			squashed: [ 4, [ 'Aa', 'Db' ], 4 ]
		},
		{
			message: 'Replace interior retain',
			transactions: [
				[ 4, [ 'Aa', 'Bb' ], 4 ],
				[ 1, [ 'Xx', 'Yy' ], 7 ]
			],
			squashed: [ 1, [ 'Xx', 'Yy' ], 1, [ 'Aa', 'Bb' ], 4 ]
		},
		{
			message: 'Remove insertion',
			transactions: [
				[ 4, [ '', 'abc' ], 4 ],
				[ 4, [ 'abc', '' ], 4 ]
			],
			squashed: [ 8 ]
		},
		{
			message: 'Re-insert removal',
			transactions: [
				[ 4, [ 'abc', '' ], 4 ],
				[ 4, [ '', 'abc' ], 4 ]
			],
			squashed: [ 4, [ 'abc', 'abc' ], 4 ]
		},
		{
			message: 'Replace part of bolded replacement',
			transactions: [
				[ 4, [ 'Aa', 'Bb' ], 4 ],
				annotationTx( 3, 8, 10, 'set', boldHash, 0 ),
				[ 4, [
					[ [ 'B', [ boldHash ] ] ],
					[ 'D' ]
				], 5 ]
			],
			squashed: [
				3,
				annotationOp( 'set', 'start', boldHash, 0 ),
				1,
				annotationOp( 'set', 'stop', boldHash, 0 ),
				[ 'Aa', [
					'D',
					[ 'b', [ boldHash ] ]
				] ],
				annotationOp( 'set', 'start', boldHash, 0 ),
				2,
				annotationOp( 'set', 'stop', boldHash, 0 ),
				2
			]
		},
		{
			message: 'set bold, set italic, clear bold',
			transactions: [
				annotationTx( 100, 105, 305, 'set', boldHash, 0 ),
				annotationTx( 101, 104, 305, 'set', italicHash, 1 ),
				annotationTx( 102, 103, 305, 'clear', boldHash, 0 )
			],
			squashed: [
				100,
				annotationOp( 'set', 'start', boldHash, 0 ),
				1,
				annotationOp( 'set', 'start', italicHash, 1 ),
				1,
				annotationOp( 'clear', 'start', boldHash, 0 ),
				1,
				annotationOp( 'clear', 'stop', boldHash, 0 ),
				1,
				annotationOp( 'set', 'stop', italicHash, 1 ),
				1,
				annotationOp( 'set', 'stop', boldHash, 0 ),
				200
			]
		},
		{
			message: 'insert, insert, remove',
			transactions: [
				[ 1, [ '', 'x' ], 3 ],
				[ 2, [ '', 'y' ], 3 ],
				[ 2, [ 'y', '' ], 3 ]
			],
			squashed: [ 1, [ '', 'x' ], 3 ]
		},
		{
			message: 'type, annotate, clear',
			transactions: [].concat(
				insertionTxList( 1, 'Foo bar baz qux quux', 3 ),
				[ annotationTx( 1, 21, 24, 'set', boldHash, 0 ) ],
				[ annotationTx( 1, 4, 24, 'set', italicHash, 1 ) ],
				[ annotationTx( 9, 12, 24, 'set', italicHash, 1 ) ],
				[ annotationTx( 1, 17, 24, 'clear', boldHash, 0 ) ]
			),
			squashed: [ 1, [ '', [].concat(
				sequence( 'Foo', italicHash ),
				sequence( ' bar ' ),
				sequence( 'baz', italicHash ),
				sequence( ' qux ' ),
				sequence( 'quux', boldHash )
			) ], 3 ]
		},
		{
			message: 'insert, change attribute, change attribute again',
			transactions: [
				[ [ '', [
					{ type: 'heading', attributes: { level: 1 } },
					{ type: '/heading' }
				] ] ],
				[ { type: 'attribute', key: 'level', from: 1, to: 2 }, 2 ],
				[ { type: 'attribute', key: 'level', from: 2, to: 3 }, 2 ]
			],
			squashed: [ [ '', [
				{ type: 'heading', attributes: { level: 3 } },
				{ type: '/heading' }
			] ] ]
		},
		{
			message: 'h1->h2->p->remove contents',
			transactions: [
				[ { type: 'attribute', key: 'level', from: 1, to: 2 }, 9 ],
				[ [
					[ { type: 'heading', attributes: { level: 2 } } ],
					[ { type: 'paragraph' } ]
				], 7, [
					[ { type: '/heading' } ],
					[ { type: '/paragraph' } ]
				] ],
				[ 1, [ 'abcdefg', '' ], 1 ]
			],
			squashed: [ [ [].concat(
				{ type: 'heading', attributes: { level: 1 } },
				sequence( 'abcdefg' ),
				{ type: '/heading' }
			), [
				{ type: 'paragraph' },
				{ type: '/paragraph' }
			] ] ]
		},
		{
			message: 'Overlapping replacements',
			transactions: [
				[ [ 'AB', 'ab' ], 1 ],
				[ 1, [ 'bC', 'Bc' ] ]
			],
			squashed: [ [ 'ABC', 'aBc' ] ]
		}
	];

	assert.expect( tests.reduce( function ( sum, test ) {
		return sum + test.transactions.length - 1;
	}, 0 ) );

	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		transactions = test.transactions.map( function ( txData ) {
			return ve.dm.Transaction.static.deserialize( txData );
		} );
		squashed = ve.dm.Transaction.static.deserialize( test.squashed );

		assert.deepEqual(
			ve.dm.TransactionSquasher.static.squash( transactions ).operations,
			squashed.operations,
			test.message + ': squash all'
		);

		for ( j = 1, jLen = transactions.length - 1; j < jLen; j++ ) {
			squashedBefore = ve.dm.TransactionSquasher.static.squash( transactions.slice( 0, j ) );
			squashedAfter = ve.dm.TransactionSquasher.static.squash( transactions.slice( j ) );
			assert.deepEqual(
				ve.dm.TransactionSquasher.static.squash( [
					squashedBefore,
					squashedAfter
				] ).operations,
				squashed.operations,
				test.message + ': squash squashed halves split at ' + j
			);
		}
	}
} );
