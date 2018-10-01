/*!
 * VisualEditor DataModel Document store tests.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.DocumentStore' );

QUnit.test( 'Create', function ( assert ) {
	var done = assert.async(),
		fakeMongo = new ve.dm.FakeMongo(),
		documentStore = new ve.dm.DocumentStore( fakeMongo, 'test', fakeMongo );

	documentStore.connect().then( function () {
		return documentStore.dropDatabase();
	} ).then( function () {
		return documentStore.load( 'Foo' );
	} ).then( function ( change ) {
		assert.deepEqual(
			change.serialize(),
			{ start: 0, transactions: [] },
			'Load new empty document'
		);
		return documentStore.onNewChange( 'Foo', ve.dm.Change.static.deserialize( {
			start: 0,
			transactions: [ [ [ '', 'W' ] ], 'o', 'rld' ]
		}, undefined, true ) );
	} ).then( function () {
		return documentStore.onNewChange( 'Foo', ve.dm.Change.static.deserialize( {
			start: 3,
			transactions: [ [ [ '', 'H' ], 5 ], 'e', 'l', 'l', 'o', ' ' ]
		}, undefined, true ) );
	} ).then( function () {
		return documentStore.load( 'Bar' );
	} ).then( function ( change ) {
		assert.deepEqual(
			change.serialize(),
			{ start: 0, transactions: [] },
			'Different document is empty'
		);
		return documentStore.onNewChange( 'Bar', ve.dm.Change.static.deserialize( {
			start: 44,
			transactions: [ [ [ '', 'X' ] ] ]
		}, undefined, true ) ).then( function () {
			assert.notOk( true, 'Throw on unmached start' );
		} ).catch( function () {
			assert.ok( true, 'Throw on unmatched start' );
		} );
	} ).then( function () {
		return documentStore.load( 'Foo' );
	} ).then( function ( change ) {
		assert.deepEqual(
			change.serialize(),
			{ start: 0, transactions: [ [ [ '', 'W' ] ], 'o', 'rld', [ [ '', 'H' ], 5 ], 'e', 'l', 'l', 'o', ' ' ] },
			'Transactions were saved'
		);
		return documentStore.dropDatabase();
	} ).then( function () {
		return documentStore.load( 'Foo' );
	} ).then( function ( change ) {
		assert.deepEqual(
			change.serialize(),
			{ start: 0, transactions: [] },
			'Reload new empty document after dropDatabase'
		);
	} ).then( function () {
		return documentStore.onClose();
	} ).catch( function ( error ) {
		assert.notOk( 'Test failure: ', error );
	} ).then( function () {
		done();
	} );
} );
