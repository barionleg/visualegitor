/*!
 * VisualEditor tests for ve.init.ConflictableStorage.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-disable camelcase */

QUnit.module( 've.init.ConflictableStorage' );

QUnit.test( 'Basic methods', function ( assert ) {
	var store = {},
		storage = ve.init.platform.createSessionStorage( store );

	// Basic methods still work
	storage.set( 'foo', 'bar' );
	assert.strictEqual( store.foo, 'bar', 'String stored' );
	assert.strictEqual( storage.get( 'foo' ), 'bar', 'String fetched' );
	storage.remove( 'foo' );
	assert.false( 'foo' in store, 'String removed' );

	storage.setObject( 'foo', { x: 1 } );
	assert.strictEqual( store.foo, '{"x":1}', 'Object stored' );
	assert.deepEqual( storage.getObject( 'foo' ), { x: 1 }, 'Object fetched' );
	storage.remove( 'foo' );
	assert.false( 'foo' in store, 'Object removed' );
} );

QUnit.test( 'Conflict handling', function ( assert ) {
	var store = {},
		conflictableKeys = {
			foo: true,
			bar: true,
			baz: true
		},
		storageA = ve.init.platform.createSessionStorage( store, true ),
		storageB = ve.init.platform.createSessionStorage( store, true );

	function getData( s ) {
		var copy = ve.copy( s );
		// eslint-disable-next-line no-underscore-dangle
		delete copy.__conflictId;
		return copy;
	}

	storageA.addConflictableKeys( conflictableKeys );
	storageB.addConflictableKeys( conflictableKeys );

	storageA.set( 'foo', 'hello' );
	assert.deepEqual( getData( store ), { foo: 'hello' }, 'String stored in A' );

	storageB.set( 'bar', 'world' );
	assert.deepEqual( getData( store ), { bar: 'world' }, 'String stored in B overwrites store in A' );

	storageA.set( 'baz', 'world!' );
	assert.deepEqual(
		getData( store ),
		{ foo: 'hello', baz: 'world!' },
		'Storage A overwrites storage B, and keeps first key set'
	);

	storageB.set( 'unmanagedKey', 'data' );
	// Trigger conflict check with get
	storageA.get( '_' );
	assert.deepEqual(
		getData( store ),
		{ foo: 'hello', baz: 'world!', unmanagedKey: 'data' },
		'Storage A overwrites storage B, but keeps unmanagedKey'
	);

	storageA.remove( 'foo' );
	storageA.remove( 'bar' );
	storageA.remove( 'baz' );
	storageB.get( '_' );
	assert.deepEqual(
		getData( store ),
		{ bar: 'world', unmanagedKey: 'data' },
		'"bar" in B not removed by A'
	);
	storageA.get( '_' );
	assert.deepEqual(
		getData( store ),
		{ unmanagedKey: 'data' },
		'keys in A removed when A is restored'
	);
	// Cleanup
	storageB.remove( 'bar' );
} );
