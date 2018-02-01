/*!
 * VisualEditor DataModel TransactionSquasher tests.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.TransactionSquasher' );

QUnit.test( 'squashIn', function ( assert ) {
	var tests, i, iLen, test, tx, squasher, j, jLen,
		boldHash = 'hfbe3cfe099b83e1e',
		italicHash = 'he4e7c54e2204d10ba';

	function insertionTxList( before, itemSequence, after ) {
		var i, iLen,
			transactions = [];
		for( i = 0, iLen = itemSequence.length; i < iLen; i++ ) {
			transactions.push( [ before + i, [ '', itemSequence[ i ] ], after ] );
		}
		return transactions;
	}
	function annotationTx( start, stop, length, method, hash, spliceAt ) {
		return [
			start,
			{ type: 'annotate', method: method, bias: 'start', hash: hash, spliceAt: spliceAt },
			stop - start,
			{ type: 'annotate', method: method, bias: 'stop', hash: hash, spliceAt: spliceAt },
			length - stop
		];
	}
	function sequence( data ) {
		var hashList = Array.prototype.slice.call( arguments, 1 );
		if ( hashList.length === 0 ) {
			return data;
		}
		return Array.prototype.map.call( data, function ( item ) {
			return [ item, hashList ];
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
				[ 3, {
					type: 'annotate',
					method: 'set',
					bias: 'start',
					hash: boldHash,
					spliceAt: 0
				}, 5, {
					type: 'annotate',
					method: 'set',
					bias: 'stop',
					hash: boldHash,
					spliceAt: 0
				}, 2 ],
				[ 4, [
					[ [ 'B', [ boldHash ] ] ],
					[ 'D' ]
				], 5 ]
			],
			squashed: [ 3, {
				type: 'annotate',
				method: 'set',
				bias: 'start',
				hash: boldHash,
				spliceAt: 0
			}, 1, {
				type: 'annotate',
				method: 'set',
				bias: 'stop',
				hash: boldHash,
				spliceAt: 0
			}, [ 'Aa', [
				'D',
				[ 'b', [ boldHash ] ]
			] ], {
				type: 'annotate',
				method: 'set',
				bias: 'start',
				hash: boldHash,
				spliceAt: 0
			}, 2, {
				type: 'annotate',
				method: 'set',
				bias: 'stop',
				hash: boldHash,
				spliceAt: 0
			}, 2 ]
		},
		{
			message: 'set bold, set italic, clear bold',
			transactions: [
				[ 100, {
					type: 'annotate',
					method: 'set',
					bias: 'start',
					hash: boldHash,
					spliceAt: 0
				}, 5, {
					type: 'annotate',
					method: 'set',
					bias: 'stop',
					hash: boldHash,
					spliceAt: 0
				}, 200 ],
				[ 101, {
					type: 'annotate',
					method: 'set',
					bias: 'start',
					hash: italicHash,
					spliceAt: 1
				}, 3, {
					type: 'annotate',
					method: 'set',
					bias: 'stop',
					hash: italicHash,
					spliceAt: 1
				}, 201 ],
				[ 102, {
					type: 'annotate',
					method: 'clear',
					bias: 'start',
					hash: boldHash,
					spliceAt: 0
				}, 1, {
					type: 'annotate',
					method: 'clear',
					bias: 'stop',
					hash: boldHash,
					spliceAt: 0
				}, 202 ]
			],
			squashed: [ 100, {
				type: 'annotate',
				method: 'set',
				bias: 'start',
				hash: boldHash,
				spliceAt: 0
			}, 1, {
				type: 'annotate',
				method: 'set',
				bias: 'start',
				hash: italicHash,
				spliceAt: 1
			}, 1, {
				// TODO: This implicitly changes the offset of the previous
				// set bold annotation
				type: 'annotate',
				method: 'clear',
				bias: 'start',
				hash: boldHash,
				spliceAt: 0
			}, 1, {
				type: 'annotate',
				method: 'clear',
				bias: 'stop',
				hash: boldHash,
				spliceAt: 0
			}, 1, {
				type: 'annotate',
				method: 'set',
				bias: 'stop',
				hash: italicHash,
				spliceAt: 1
			}, 1, {
				type: 'annotate',
				method: 'set',
				bias: 'stop',
				hash: boldHash,
				spliceAt: 0
			}, 200 ]
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
				[ ' ', 'b', 'a', 'r', ' ' ],
				sequence( 'baz', italicHash ),
				[ ' ', 'q', 'u', 'x', ' ' ],
				sequence( 'quux', boldHash )
			) ], 3 ]
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
