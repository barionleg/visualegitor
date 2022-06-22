/*!
 * VisualEditor tests for ve.init.ListStorage.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-disable camelcase */

QUnit.module( 've.init.ListStorage' );

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

QUnit.test( 'List methods', function ( assert ) {
	var store = {},
		storage = ve.init.platform.createSessionStorage( store );

	storage.appendToList( 'list', 'hello' );
	assert.strictEqual( storage.getListLength( 'list' ), 1, 'List has length 1' );
	assert.deepEqual(
		store,
		{
			list__0: 'hello',
			list__length: '1'
		},
		'First item appended'
	);
	assert.deepEqual( storage.getList( 'list' ), [ 'hello' ], 'List fetched with one item' );

	storage.appendToList( 'list', 'world' );
	assert.strictEqual( storage.getListLength( 'list' ), 2, 'List has length 2' );
	assert.deepEqual(
		store,
		{
			list__0: 'hello',
			list__1: 'world',
			list__length: '2'
		},
		'Second item appended'
	);
	assert.deepEqual( storage.getList( 'list' ), [ 'hello', 'world' ], 'List fetched with two items' );

	storage.removeList( 'list' );
	assert.deepEqual( store, {}, 'List removed' );
	assert.deepEqual( storage.getList( 'list' ), [], 'Removed list returns empty array' );

} );

QUnit.test( 'Conflict handling', function ( assert ) {
	var store = {},
		conflictableKeys = {
			foo: true,
			bar: true,
			baz: true,
			list: 'list'
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

	storageA.appendToList( 'list', 'one' );
	assert.deepEqual(
		getData( store ),
		{
			list__0: 'one',
			list__length: '1',
			unmanagedKey: 'data'
		},
		'Item appended to list in A'
	);
	storageB.appendToList( 'list', 'un' );
	assert.deepEqual(
		getData( store ),
		{
			list__0: 'un',
			list__length: '1',
			unmanagedKey: 'data'
		},
		'Item appended to list in B'
	);
	storageA.appendToList( 'list', 'two' );
	storageA.appendToList( 'list', 'three' );
	assert.deepEqual(
		getData( store ),
		{
			list__0: 'one',
			list__1: 'two',
			list__2: 'three',
			list__length: '3',
			unmanagedKey: 'data'
		},
		'Items appended to list in A, clearing B list'
	);
	storageB.appendToList( 'list', 'deux' );
	assert.deepEqual(
		getData( store ),
		{
			list__0: 'un',
			list__1: 'deux',
			list__length: '2',
			unmanagedKey: 'data'
		},
		'Items appended to B, restoring list'
	);
	storageA.removeList( 'list' );
	assert.deepEqual( getData( store ), { unmanagedKey: 'data' }, 'List in A removed' );
	storageB.get( '_' );
	assert.deepEqual(
		getData( store ),
		{
			list__0: 'un',
			list__1: 'deux',
			list__length: '2',
			unmanagedKey: 'data'
		},
		'List in B restored by get'
	);
} );
