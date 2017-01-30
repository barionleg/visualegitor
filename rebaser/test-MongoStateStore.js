/* eslint-env node, es6 */
/* eslint-disable no-console */

var store,
	ve = require( '../dist/ve-rebaser.js' ),
	MongoStateStore = require( './MongoStateStore.js' ).MongoStateStore;

ve.spawn( function* main() {
	var state;
	store = yield MongoStateStore.static.connect( 'mongodb://localhost:27017/test' );
	yield store.db.dropDatabase();
	console.log( 'connected' );
	state = yield store.getDocState( 'foo' );
	console.log( state );
	yield store.updateDocState(
		'foo',
		'fred',
		new ve.dm.Change( 0, [], [], {} ),
		new ve.dm.Change( 0, [], [], {} ),
		1 + ( state.rejections.get( 'fred' ) || 0 )
	);
}() ).catch( function ( err ) {
	console.error( err.stack );
} ).then( function () {
	if ( store ) {
		store.db.close();
	}
} );
