/* eslint-disable no-console */

var ve = require( '../dist/ve-rebaser.js' ),
	MongoClient = require( 'mongodb' ).MongoClient;

MongoClient.connect( 'mongodb://localhost:27017/test' ).then( function ( db ) {
	return db.collection( 'vedocstore' ).find().toArray().then( function ( result ) {
		console.log( JSON.stringify( result ) );
		db.close();
	} );
} ).catch( function ( err ) {
	console.error( err );
} );
