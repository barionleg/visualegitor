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
 */
function MongoStateStore( db ) {
	this.db = db;
	this.collection = db.collection( 'foo' );
}

/* Initialization */

OO.inheritClass( MongoStateStore, ve.dm.RebaseServer );

/* Static methods */

MongoStateStore.static.connect = ve.async( function* connect( url ) {
	var db = yield MongoClient.connect( url );
	// yield db.dropDatabase();
	return new MongoStateStore( db );
} );

/* Methods */

// TODO: accept start parameter, and load history only from start onwards
MongoStateStore.prototype.getDocState = ve.async( function* getDocState( doc ) {
	var result = ( yield Promise.resolve( this.collection.find( { name: doc } ).toArray() ) )[ 0 ];
	console.log( 'MongoStateStore#getDocState', result );
	if ( !result ) {
		result = {
			name: doc,
			transactions: [],
			stores: [],
			selections: {},
			continueBases: {},
			rejections: {}
		};
		yield this.collection.insert( result );
	}
	return ve.dm.RebaseDocState.static.deserialize( {
		history: {
			start: 0,
			transactions: result.transactions,
			stores: result.stores,
			selections: result.selections
		},
		continueBases: result.continueBases,
		rejections: result.rejections
	} );
} );

MongoStateStore.prototype.updateDocState = ve.async( function* updateDocState( doc, author, newHistory, continueBase, rejections ) {
	var update;
	newHistory = newHistory.serialize();
	continueBase = continueBase ? continueBase.serialize() : null;
	update = {
		$push: {
			transactions: { $each: newHistory.transactions },
			stores: { $each: newHistory.stores }
		},
		$set: {
			selections: newHistory.selections
		}
	};
	update.$set[ 'rejections.' + author ] = rejections;
	if ( continueBase ) {
		update.$set[ 'continueBases.' + author ] = continueBase;
	}
	console.log( 'MongoStateStore#updateDocStore', update );
	yield this.collection.update( { name: doc }, update );
} );

module.exports = { MongoStateStore: MongoStateStore };
