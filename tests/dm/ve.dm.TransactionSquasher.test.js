/*!
 * VisualEditor DataModel TransactionSquasher tests.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.TransactionSquasher' );

ve.test.utils.makeTestTransaction = function ( array ) {
	var i, len, item,
		operations = [];
	for ( i = 0, len = array.length; i < len; i++ ) {
		item = array[ i ];
		if ( typeof item === 'number' ) {
			operations.push( { type: 'retain', length: item } );
		} else if ( typeof item === 'string' && item.indexOf( '>' ) !== -1 ) {
			operations.push( {
				type: 'replace',
				remove: Array.from( item.slice( 0, item.indexOf( '>' ) ) ),
				insert: Array.from( item.slice( 1 + item.indexOf( '>' ) ) )
			} );
		} else {
			operations.push( item );
		}
	}
	return new ve.dm.Transaction( operations );
};

QUnit.test( 'squashIn', function ( assert ) {
	var tests, i, iLen, test, tx, squasher, j, jLen,
		makeTx = ve.test.utils.makeTestTransaction;
	tests = [
		{
			message: 'Replace part of replacement',
			transactions: [
				[ 4, 'Aa>Bb', 4 ],
				[ 4, 'B>D', 5 ]
			],
			squashed: [ 4, 'Aa>Bd', 4 ]
		},
		{
			message: 'Replace interior retain',
			transactions: [
				[ 4, 'Aa>Bb', 4 ],
				[ 1, 'Xx>Yy', 7 ]
			],
			squashed: [ 1, 'Xx>Yy', 1, 'Aa>Bb', 4 ]
		}
	];

	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		tx = makeTx( test.transactions[ 0 ] );
		squasher = new ve.dm.TransactionSquasher( tx );
		for ( j = 1, jLen = test.transactions.length; j < jLen; j++ ) {
			tx = makeTx( test.transactions[ j ] );
			squasher.squashIn( tx );
		}
		tx = makeTx( test.squashed );
		assert.deepEqual(
			squasher.getTransaction().operations,
			tx.operations,
			test.message
		);
	}
} );
