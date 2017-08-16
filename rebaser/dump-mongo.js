/* eslint-disable no-console */

var ve = require( '../dist/ve-rebaser.js' ),
	MongoClient = require( 'mongodb' ).MongoClient;

ve.spawn( function* () {
	var result,
		db = yield MongoClient.connect( 'mongodb://localhost:27017/test' );
	result = yield Promise.resolve( db.collection( 'foo' ).find().toArray() );
	console.log( result );
	db.close();
}() ).catch( function ( err ) {
	console.error( err );
} );
