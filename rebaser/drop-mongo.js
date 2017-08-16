/* eslint-disable no-console */

var ve = require( '../dist/ve-rebaser.js' ),
	MongoClient = require( 'mongodb' ).MongoClient;

ve.spawn( function* () {
	var db = yield MongoClient.connect( 'mongodb://localhost:27017/test' );
	yield db.dropDatabase();
	db.close();
	console.log( 'Dropped' );
}() ).catch( function ( err ) {
	console.error( err );
} );
