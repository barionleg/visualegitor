/*!
 * VisualEditor DataModel Transaction tests.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.Transaction' );

/* Helper methods */

/* Tests */
// TODO: Change the variable names to reflect the use of TransactionBuilder

QUnit.test( 'translateOffset', function ( assert ) {
	var mapping, offset, expected,
		doc = new ve.dm.Document( '-----defg---h--'.split( '' ) ),
		tx = new ve.dm.TransactionBuilder();

	tx.pushReplace( doc, 0, 0, [ 'a', 'b', 'c' ] );
	tx.pushRetain( 5 );
	tx.pushReplace( doc, 5, 4, [] );
	tx.pushRetain( 2 );
	tx.pushStartAnnotating( 'set', { type: 'textStyle/bold' } );
	tx.pushRetain( 1 );
	tx.pushReplace( doc, 12, 1, [ 'i', 'j', 'k', 'l', 'm' ] );
	tx.pushRetain( 2 );
	tx.pushReplace( doc, 15, 0, [ 'n', 'o', 'p' ] );

	mapping = {
		0: [ 0, 3 ],
		1: 4,
		2: 5,
		3: 6,
		4: 7,
		5: 8,
		6: 8,
		7: 8,
		8: 8,
		9: 8,
		10: 9,
		11: 10,
		12: 11,
		13: [ 12, 16 ],
		14: 17,
		15: [ 18, 21 ],
		16: 22
	};
	QUnit.expect( 2 * Object.keys( mapping ).length );
	for ( offset in mapping ) {
		expected = Array.isArray( mapping[ offset ] ) ? mapping[ offset ] : [ mapping[ offset ], mapping[ offset ] ];
		assert.strictEqual( tx.getTransaction().translateOffset( Number( offset ) ), expected[ 1 ], offset );
		assert.strictEqual( tx.getTransaction().translateOffset( Number( offset ), true ), expected[ 0 ], offset + ' (excludeInsertion)' );
	}
} );

QUnit.test( 'translateRange', function ( assert ) {
	var i, cases,
		doc = ve.dm.example.createExampleDocument(),
		tx = new ve.dm.TransactionBuilder();
	tx.pushRetain( 55 );
	tx.pushReplace( doc, 55, 0, [ { type: 'list', attributes: { style: 'number' } } ] );
	tx.pushReplace( doc, 55, 0, [ { type: 'listItem' } ] );
	tx.pushRetain( 3 );
	tx.pushReplace( doc, 58, 0, [ { type: '/listItem' } ] );
	tx.pushReplace( doc, 58, 0, [ { type: 'listItem' } ] );
	tx.pushRetain( 3 );
	tx.pushReplace( doc, 61, 0, [ { type: '/listItem' } ] );
	tx.pushReplace( doc, 61, 0, [ { type: '/list' } ] );

	cases = [
		{
			before: new ve.Range( 55, 61 ),
			after: new ve.Range( 55, 67 ),
			msg: 'Wrapped range is translated to outer range'
		},
		{
			before: new ve.Range( 54, 62 ),
			after: new ve.Range( 54, 68 ),
			msg: 'Wrapped range plus one each side is translated to outer range plus one each side'
		},
		{
			before: new ve.Range( 54, 61 ),
			after: new ve.Range( 54, 67 ),
			msg: 'Wrapped range plus one on the left'
		},
		{
			before: new ve.Range( 55, 62 ),
			after: new ve.Range( 55, 68 ),
			msg: 'wrapped range plus one on the right'
		}
	];
	QUnit.expect( cases.length * 2 );

	for ( i = 0; i < cases.length; i++ ) {
		assert.equalRange( tx.getTransaction().translateRange( cases[ i ].before ), cases[ i ].after, cases[ i ].msg );
		assert.equalRange( tx.getTransaction().translateRange( cases[ i ].before.flip() ), cases[ i ].after.flip(), cases[ i ].msg + ' (reversed)' );
	}
} );

QUnit.test( 'getModifiedRange', function ( assert ) {
	var i, j, len, tx, doc = ve.dm.example.createExampleDocument(),
		cases = [
			{
				calls: [
					[ 'pushRetain', 5 ]
				],
				range: null,
				msg: 'no-op transaction returns null'
			},
			{
				calls: [
					[ 'pushRetain', 5 ],
					[ 'pushReplace', doc, 5, 0, [ 'a', 'b', 'c' ] ],
					[ 'pushRetain', 42 ]
				],
				range: new ve.Range( 5, 8 ),
				msg: 'simple insertion returns range covering new content'
			},
			{
				calls: [
					[ 'pushRetain', 5 ],
					[ 'pushReplace', doc, 5, 13, [] ],
					[ 'pushRetain', 42 ]
				],
				range: new ve.Range( 5 ),
				msg: 'simple removal returns zero-length range at removal'
			},
			{
				calls: [
					[ 'pushRetain', 5 ],
					[ 'pushReplace', doc, 5, 3, [ 'a', 'b', 'c', 'd' ] ],
					[ 'pushRetain', 42 ]
				],
				range: new ve.Range( 5, 9 ),
				msg: 'simple replacement returns range covering new content (1)'
			},
			{
				calls: [
					[ 'pushRetain', 5 ],
					[ 'pushReplace', doc, 5, 13, [ 'a', 'b', 'c', 'd' ] ],
					[ 'pushRetain', 42 ]
				],
				range: new ve.Range( 5, 9 ),
				msg: 'simple replacement returns range covering new content (2)'
			},
			{
				calls: [
					[ 'pushRetain', 5 ],
					[ 'pushReplace', doc, 5, 3, [] ],
					[ 'pushRetain', 42 ],
					[ 'pushReplace', doc, 50, 0, [ 'h', 'e', 'l', 'l', 'o' ] ],
					[ 'pushRetain', 108 ]
				],
				range: new ve.Range( 5, 52 ),
				msg: 'range covers two operations with retain in between'
			},
			{
				calls: [
					[ 'pushRetain', 5 ],
					[ 'pushReplace', doc, 5, 3, [ 'a', 'b', 'c', 'd' ] ],
					[ 'pushRetain', 54 ],
					[ 'pushReplace', doc, 62, 0, [ 'h', 'e', 'l', 'l', 'o' ] ],
					[ 'pushRetain', 1 ]
				],
				range: new ve.Range( 5, 9 ),
				msg: 'range ignores internalList changes'
			},
			{
				calls: [
					[ 'pushReplace', doc, 0, 3, [] ]
				],
				range: new ve.Range( 0 ),
				msg: 'removal without retains'
			},
			{
				calls: [
					[ 'pushReplace', doc, 0, 0, [ 'a', 'b', 'c' ] ]
				],
				range: new ve.Range( 0, 3 ),
				msg: 'insertion without retains'
			},
			{
				calls: [
					[ 'pushRetain', 5 ],
					[ 'pushReplaceElementAttribute', 'style', 'bullet', 'number' ]
				],
				range: new ve.Range( 5, 6 ),
				msg: 'single attribute change'
			},
			{
				calls: [
					[ 'pushReplaceElementAttribute', 'style', 'bullet', 'number' ],
					[ 'pushRetain', 42 ],
					[ 'pushReplaceElementAttribute', 'style', 'bullet', 'number' ]
				],
				range: new ve.Range( 0, 43 ),
				msg: 'two attribute changes'
			}
		];

	QUnit.expect( cases.length );
	for ( i = 0, len = cases.length; i < len; i++ ) {
		tx = new ve.dm.TransactionBuilder();
		for ( j = 0; j < cases[ i ].calls.length; j++ ) {
			tx[ cases[ i ].calls[ j ][ 0 ] ].apply( tx, cases[ i ].calls[ j ].slice( 1 ) );
		}
		assert.equalRange( tx.getTransaction().getModifiedRange( doc ), cases[ i ].range, cases[ i ].msg );
	}
} );
