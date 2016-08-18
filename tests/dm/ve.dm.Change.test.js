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
