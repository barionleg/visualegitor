/*!
 * VisualEditor DataModel mongo state store class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-env node, es6 */
/* eslint-disable no-console */

var ve = require( '../dist/ve-rebaser.js' ),
	MongoClient = require( 'mongodb' ).MongoClient;

/**
 * DataModel mongo state store
 *
 * @class
 *
 * @constructor
 * @param {Object} db MongoClient db connection
 * @param {Function} [logCallback] Callback for logging events
 */
function MongoStateStore( db, logCallback ) {
	MongoStateStore.super.call( this, logCallback );
	this.db = db;
	this.collection = db.collection( 'foo' );
}

/* Initialization */

OO.inheritClass( MongoStateStore, ve.dm.RebaseServer );

/* Static methods */

MongoStateStore.static.connect = ve.async( function* connect( url, logCallback ) {
	var db = yield MongoClient.connect( url );
	// yield db.dropDatabase();
	return new MongoStateStore( db, logCallback );
} );

/* Methods */

// TODO: accept start parameter, and load history only from start onwards
MongoStateStore.prototype.getDocState = ve.async( function* getDocState( doc ) {
	var result = ( yield Promise.resolve( this.collection.find( { name: doc } ).toArray() ) )[ 0 ];
	console.log( 'MongoStateStore#getDocState', result );
	if ( !result ) {
		result = {
			start: 0,
			transactions: [],
			stores: [],
			selections: {},
			authors: {}
		};
		yield this.collection.insert( result );
	}
	return ve.dm.RebaseDocState.static.deserialize( {
		history: {
			start: result.start,
			transactions: result.transactions,
			stores: result.stores,
			selections: result.selections
		},
		authors: result.authors
	} );
} );

/**
 * @inheritdoc
 */
MongoStateStore.prototype.updateDocState = ve.async( function* updateDocState( doc, author, newHistory, authorDataChanges ) {
	var update = { $set: {}, $unset: {} },
		rejections = authorDataChanges.rejections,
		continueBase = authorDataChanges.continueBase;
	if ( newHistory ) {
		newHistory = newHistory.serialize();
		update.$push = {
			transactions: { $each: newHistory.transactions },
			stores: { $each: newHistory.stores }
		};
		update.$set.selections = newHistory.selections;
	}
	update.$set[ 'rejections.' + author ] = rejections;
	console.log( continueBase );
	if ( continueBase ) {
		update.$set[ 'continueBases.' + author ] = continueBase.serialize();
	} else {
		update.$unset[ 'continueBases.' + author ] = '';
	}
	console.log( 'MongoStateStore#updateDocStore', update );
	yield this.collection.update( { name: doc }, update );
} );

module.exports = { MongoStateStore: MongoStateStore };
