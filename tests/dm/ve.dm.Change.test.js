/*!
 * VisualEditor DataModel Change tests.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.Change' );

QUnit.test( 'change operations', 5, function ( assert ) {
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
	doc = surface.documentModel;
	insert1.concatRebased( insert2.concat( replace2 ) ).concatRebased( underline3 ).applyTo( surface );
	assert.deepEqual(
		doc.data.data.slice( 1, -1 ),
		[
			[ 'o', bIndex ],
			[ 'n', bIndex ],
			[ 'e', bIndex ],
			' ',
			'T',
			'W',
			'O',
			[ 't', uIndex ],
			[ 'h', uIndex ],
			[ 'r', uIndex ],
			[ 'e', uIndex ],
			[ 'e', uIndex ]
		],
		'Apply insert1 then insert2*replace2 then underline3'
	);
	assert.strictEqual( replace2.rebasedOnto( remove2 ), null, 'Rebase replace2 onto remove2' );
} );
