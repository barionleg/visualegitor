/*!
 * VisualEditor DataModel TransactionSquasher tests.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.TransactionSquasher' );

QUnit.test( 'squashIn', function ( assert ) {
	var tests, i, iLen, test, tx, squasher, j, jLen;

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
				[ 3, {
					type: 'annotate',
					method: 'set',
					bias: 'start',
					hash: 'hfbe3cfe099b83e1e',
					spliceAt: 0
				}, 5, {
					type: 'annotate',
					method: 'set',
					bias: 'stop',
					hash: 'hfbe3cfe099b83e1e',
					spliceAt: 0
				}, 2 ],
				[ 4, [
					[ [ 'B', [ 'hfbe3cfe099b83e1e' ] ] ],
					[ 'D' ]
				], 5 ]
			],
			squashed: [ 3, {
				type: 'annotate',
				method: 'set',
				bias: 'start',
				hash: 'hfbe3cfe099b83e1e',
				spliceAt: 0
			}, 1, {
				type: 'annotate',
				method: 'set',
				bias: 'stop',
				hash: 'hfbe3cfe099b83e1e',
				spliceAt: 0
			}, [ 'Aa', [
				'D',
				[ 'b', [ 'hfbe3cfe099b83e1e' ] ]
			] ], {
				type: 'annotate',
				method: 'set',
				bias: 'start',
				hash: 'hfbe3cfe099b83e1e',
				spliceAt: 0
			}, 2, {
				type: 'annotate',
				method: 'set',
				bias: 'stop',
				hash: 'hfbe3cfe099b83e1e',
				spliceAt: 0
			}, 2 ]
		}
	];

	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		tx = ve.dm.Transaction.static.deserialize( test.transactions[ 0 ] );
		squasher = new ve.dm.TransactionSquasher( tx );
		for ( j = 1, jLen = test.transactions.length; j < jLen; j++ ) {
			tx = ve.dm.Transaction.static.deserialize( test.transactions[ j ] );
			squasher.squashIn( tx );
		}
		tx = ve.dm.Transaction.static.deserialize( test.squashed );
		assert.deepEqual(
			squasher.getTransaction().operations,
			tx.operations,
			test.message
		);
	}
} );
