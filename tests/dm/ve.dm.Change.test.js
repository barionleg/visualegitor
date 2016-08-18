/*!
 * VisualEditor DataModel Change tests.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.Change' );

QUnit.test( 'Change operations', 8, function ( assert ) {
	var change, replace2, remove2,
		origData = [ { type: 'paragraph' }, 't', 'h', 'r', 'e', 'e', { type: '/paragraph' } ],
		newSurface = function () {
			return new ve.dm.Surface(
				ve.dm.example.createExampleDocumentFromData( origData )
			);
		},
		surface = newSurface(),
		doc = surface.documentModel,
		b = ve.dm.example.bold,
		i = ve.dm.example.italic,
		u = ve.dm.example.underline,
		bIndex = [ ve.dm.example.boldIndex ],
		iIndex = [ ve.dm.example.italicIndex ],
		uIndex = [ ve.dm.example.underlineIndex ],
		TxInsert = ve.dm.Transaction.newFromInsertion,
		TxReplace = ve.dm.Transaction.newFromReplacement,
		TxRemove = ve.dm.Transaction.newFromRemoval,
		TxAnnotate = ve.dm.Transaction.newFromAnnotation,
		insert1 = new ve.dm.Change( 0, [
			TxInsert( doc, 1, [ [ 'o', bIndex ] ] ),
			TxInsert( doc, 2, [ [ 'n', bIndex ] ] ),
			TxInsert( doc, 3, [ [ 'e', bIndex ] ] ),
			TxInsert( doc, 4, [ ' ' ] )
		], 0, new ve.dm.IndexValueStore( [ b ] ) ),
		insert2 = new ve.dm.Change( 0, [
			TxInsert( doc, 1, [ [ 't', iIndex ] ] ),
			TxInsert( doc, 2, [ [ 'w', iIndex ] ] ),
			TxInsert( doc, 3, [ [ 'o', iIndex ] ] ),
			TxInsert( doc, 4, [ ' ' ] )
		], 0, new ve.dm.IndexValueStore( [ i ] ) ),
		underline3 = new ve.dm.Change( 0, [
			TxAnnotate( doc, new ve.Range( 1, 6 ), 'set', u )
		], 0, new ve.dm.IndexValueStore( [ u ] ) );

	insert2.applyTo( surface );
	assert.deepEqual(
		doc.data.data.slice( 1, -1 ),
		[ [ 't', iIndex ], [ 'w', iIndex ], [ 'o', iIndex ], ' ', 't', 'h', 'r', 'e', 'e' ],
		'Apply insert2'
	);

	replace2 = new ve.dm.Change( 4, [
		TxReplace( doc, new ve.Range( 1, 4 ), [ 'T', 'W', 'O' ] )
	], 0, new ve.dm.IndexValueStore() );

	remove2 = new ve.dm.Change( 4, [
		TxRemove( doc, new ve.Range( 1, 4 ) )
	], 0, new ve.dm.IndexValueStore() );

	change = insert2.reversed();
	assert.deepEqual( change.transactionStart, 4, 'transactionStart for insert2.reversed()' );
	change.applyTo( surface );
	assert.deepEqual( doc.data.data, origData, 'Apply insert2.reversed()' );

	surface = newSurface();
	change = insert1.concatRebased( insert2 );
	change.applyTo( surface );
	assert.deepEqual(
		surface.documentModel.data.data.slice( 1, -1 ),
		[
			[ 'o', bIndex ],
			[ 'n', bIndex ],
			[ 'e', bIndex ],
			' ',
			[ 't', iIndex ],
			[ 'w', iIndex ],
			[ 'o', iIndex ],
			' ',
			't',
			'h',
			'r',
			'e',
			'e'
		],
		'Apply insert1 then insert2'
	);
	change.reversed().applyTo( surface );
	assert.deepEqual(
		surface.documentModel.data.data,
		origData,
		'Apply (insert1 then insert2) reversed'
	);

	surface = newSurface();
	change = insert1.concatRebased( insert2.concat( replace2 ) ).concatRebased( underline3 );
	change.applyTo( surface );
	assert.deepEqual(
		surface.documentModel.data.data.slice( 1, -1 ),
		[
			[ 'o', bIndex ],
			[ 'n', bIndex ],
			[ 'e', bIndex ],
			' ',
			'T',
			'W',
			'O',
			' ',
			[ 't', uIndex ],
			[ 'h', uIndex ],
			[ 'r', uIndex ],
			[ 'e', uIndex ],
			[ 'e', uIndex ]
		],
		'Apply insert1 then insert2*replace2 then underline3'
	);
	change.reversed().applyTo( surface );
	assert.deepEqual(
		doc.data.data,
		origData,
		'Apply (insert1 then insert2*replace2 then underline3) reversed'
	);

	assert.strictEqual( replace2.rebasedOnto( remove2 ), null, 'Rebase replace2 onto remove2' );
} );

QUnit.test( 'Serialize/deserialize', 4, function ( assert ) {
	var origData = [ { type: 'paragraph' }, 'b', 'a', 'r', { type: '/paragraph' } ],
		newSurface = function () {
			return new ve.dm.Surface(
				ve.dm.example.createExampleDocumentFromData( origData )
			);
		},
		surface = newSurface(),
		doc = surface.documentModel,
		b = ve.dm.example.bold,
		bIndex = [ ve.dm.example.boldIndex ],
		TxInsert = ve.dm.Transaction.newFromInsertion,
		change = new ve.dm.Change( 0, [
			TxInsert( doc, 1, [ [ 'f', bIndex ] ] ),
			// Second insert is too short, as first insert wasn't applied to the doc
			TxInsert( doc, 2, [ [ 'u', bIndex ] ] )
		], 0, new ve.dm.IndexValueStore( [ b ] ) ),
		serialized = {
			transactionStart: 0,
			transactions: [
				[
					{ type: 'retain', length: 1 },
					{
						type: 'replace',
						remove: [],
						insert: [ [ 'f', bIndex ] ],
						insertedDataOffset: 0,
						insertedDataLength: 1
					},
					{ type: 'retain', length: 4 }
				],
				[
					{ type: 'retain', length: 2 },
					{
						type: 'replace',
						remove: [],
						insert: [ [ 'u', bIndex ] ],
						insertedDataOffset: 0,
						insertedDataLength: 1
					},
					{ type: 'retain', length: 4 }
				]
			],
			storeStart: 0,
			store: {
				hashStore: {
					h49981eab0f8056ff: {
						type: 'plain',
						value: {
							type: 'textStyle/bold',
							attributes: { nodeName: 'b' }
						}
					}
				},
				hashes: bIndex
			}
		};

	// Fixup second insert
	change.transactions[ 1 ].operations[ 2 ].length += 1;

	serialized = change.serialize();
	assert.deepEqual( change.serialize(), serialized, 'Serialize' );

	assert.deepEqual(
		ve.dm.Change.static.deserialize( serialized ).serialize(),
		serialized,
		'Deserialize and reserialize'
	);

	assert.deepEqual(
		ve.dm.Change.static.deserialize( serialized, true ).store.hashStore,
		serialized.store.hashStore,
		'Deserialize, preserving store values'
	);

	assert.deepEqual(
		ve.dm.Change.static.deserialize( serialized, true ).serialize( true ),
		serialized,
		'Deserialize and reserialize, preserving store values'
	);
} );

QUnit.test( 'Same-offset typing', 1, function ( assert ) {
	var a, b, c, d, tests, i, len, test, operations, expected,
		surface = new ve.dm.Surface( ve.dm.example.createExampleDocumentFromData( [
			{ type: 'paragraph' },
			{ type: '/paragraph' }
		] ) ),
		doc = surface.documentModel,
		clear = function () {
			surface.change( doc.completeHistory.map( function ( tx ) {
				return tx.reversed();
			} ).reverse() );
			doc.completeHistory.length = 0;
		},
		store = doc.store,
		TxInsert = ve.dm.Transaction.newFromInsertion;

	// 'ab' and 'cd' typed at the same offset
	a = new ve.dm.Change( 0, [ TxInsert( doc, 1, [ 'a' ] ) ], 0, store );
	a.transactions[ 0 ].author = 2;
	a.applyTo( surface );
	b = new ve.dm.Change( 1, [ TxInsert( doc, 2, [ 'b' ] ) ], 0, store );
	b.transactions[ 0 ].author = 2;
	clear();
	c = new ve.dm.Change( 0, [ TxInsert( doc, 1, [ 'c' ] ) ], 0, store );
	c.transactions[ 0 ].author = 1;
	c.applyTo( surface );
	d = new ve.dm.Change( 1, [ TxInsert( doc, 2, [ 'd' ] ) ], 0, store );
	d.transactions[ 0 ].author = 1;
	c.reversed().applyTo( surface );

	tests = [
		{
			message: 'a on c',
			change: a.rebasedOnto( c ),
			expected: { before: 1, insert: 'a', after: 2 }
		},
		{
			message: 'c on a',
			change: c.rebasedOnto( a ),
			expected: { before: 2, insert: 'c', after: 1 }
		},
		{
			message: 'b on ( c on a )',
			change: b.rebasedOnto( c.rebasedOnto( a ) ),
			expected: { before: 2, insert: 'b', after: 2 }
		},
		{
			message: 'd on ( a on c )',
			change: d.rebasedOnto( a.rebasedOnto( c ) ),
			expected: { before: 3, insert: 'd', after: 1 }
		},
		{
			message: 'b on ( c+d on a )',
			change: b.rebasedOnto( c.concat( d ).rebasedOnto( a ) ),
			expected: { before: 2, insert: 'b', after: 3 }
		},
		{
			message: 'd on ( a+b on c )',
			change: d.rebasedOnto( a.concat( b ).rebasedOnto( c ) ),
			expected: { before: 4, insert: 'd', after: 1 }
		}
	];

	len = tests.length;
	QUnit.expect( len + 6 );

	for ( i = 0; i < len; i++ ) {
		test = tests[ i ];
		operations = test.change.transactions[ 0 ].operations;
		assert.deepEqual( {
			before: operations[ 0 ].length,
			insert: operations[ 1 ].insert[ 0 ],
			after: operations[ 2 ].length
		}, test.expected, test.message );
	}

	// Check that the order of application doesn't matter
	expected = [ { type: 'paragraph' }, 'a', 'b', 'c', 'd', { type: '/paragraph' } ];

	clear();
	surface.setSelection( new ve.dm.LinearSelection( doc, new ve.Range( 1 ) ) );
	a.applyTo( surface );
	b.applyTo( surface );
	c.rebasedOnto( a.concat( b ) ).applyTo( surface );
	d.rebasedOnto( a.concat( b ).rebasedOnto( c ) ).applyTo( surface );
	assert.deepEqual( doc.data.data, expected, 'a,b,c,d' );
	assert.deepEqual(
		[ surface.getSelection().getRange().from, surface.getSelection().getRange().to ],
		[ 1, 1 ],
		'a,b,c,d range'
	);

	clear();
	a.applyTo( surface );
	c.rebasedOnto( a ).applyTo( surface );
	b.rebasedOnto( c.rebasedOnto( a ) ).applyTo( surface );
	d.rebasedOnto( a.concat( b ).rebasedOnto( c ) ).applyTo( surface );
	assert.deepEqual( doc.data.data, expected, 'a,c,b,d' );

	clear();
	a.applyTo( surface );
	c.rebasedOnto( a ).applyTo( surface );
	d.rebasedOnto( a.rebasedOnto( c ) ).applyTo( surface );
	b.rebasedOnto( c.concat( d ).rebasedOnto( a ) ).applyTo( surface );
	assert.deepEqual( doc.data.data, expected, 'a,c,d,b' );

	clear();
	c.applyTo( surface );
	a.rebasedOnto( c ).applyTo( surface );
	d.rebasedOnto( a.rebasedOnto( c ) ).applyTo( surface );
	b.rebasedOnto( c.concat( d ).rebasedOnto( a ) ).applyTo( surface );
	assert.deepEqual( doc.data.data, expected, 'c,a,d,b' );

	clear();
	c.applyTo( surface );
	d.applyTo( surface );
	a.rebasedOnto( c.concat( d ) ).applyTo( surface );
	b.rebasedOnto( c.concat( d ).rebasedOnto( a ) ).applyTo( surface );
	assert.deepEqual( doc.data.data, expected, 'c,d,a,b' );

} );
