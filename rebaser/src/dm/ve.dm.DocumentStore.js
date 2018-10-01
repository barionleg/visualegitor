/*!
 * VisualEditor document store class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-env node, es6 */

/**
 * @constructor
 * @param {Object} storageClient MongoClient-like object; passed as a parameter for testing purposes
 * @param {string} dbName Database name
 * @param {Object} logger Logger class
 * @param {Function} logger.logServerEvent Stringify object argument to log, adding timestamp and server ID properties
 */
ve.dm.DocumentStore = function VeDmDocumentStore( storageClient, dbName, logger ) {
	this.storageClient = storageClient;
	this.dbName = dbName;
	this.logger = logger;
	this.db = null;
	this.collection = null;
	this.startForDoc = new Map();
};

/**
 * @return {Promise} Resolves when connected
 */
ve.dm.DocumentStore.prototype.connect = function () {
	var documentStore = this;
	return this.storageClient.connect().then( function ( client ) {
		var db = client.db( documentStore.dbName );
		documentStore.logger.logServerEvent( { type: 'DocumentStore#connected', dbName: documentStore.dbName } );
		documentStore.db = db;
		// XXX for testing only: drop database on connect
		return db.dropDatabase().then( function () {
			documentStore.collection = db.collection( 'vedocstore' );
		} );
	} );
};

/**
 * Load a document from storage (creating as empty if absent)
 *
 * @param {string} docName Name of the document
 * @return {Promise} Confirmed document history as a ve.dm.Change
 */
ve.dm.DocumentStore.prototype.load = function ( docName ) {
	var documentStore = this;
	return this.collection.findOneAndUpdate(
		{ docName: docName },
		{ $setOnInsert: { start: 0, transactions: [], stores: [] } },
		{ upsert: true, returnOriginal: false }
	).then( function ( result ) {
		var length = result.value.transactions.length || 0;
		documentStore.startForDoc.set( docName, result.value.start + length );
		return ve.dm.Change.static.deserialize( {
			start: 0,
			transactions: result.value.transactions,
			stores: result.value.stores,
			selections: {}
		}, undefined, true );
	} );
};

/**
 * Save a new change to storage
 *
 * @param {string} docName Name of the document
 * @param {ve.dm.Change} change The new change
 * @return {Promise} Resolves when saved
 */
ve.dm.DocumentStore.prototype.onNewChange = function ( docName, change ) {
	var documentStore = this,
		serializedChange = change.serialize( true ),
		expectedStart = this.startForDoc.get( docName ) || 0;

	if ( expectedStart !== serializedChange.start ) {
		throw new Error( 'Unmatched starts:', expectedStart, serializedChange.start );
	}
	this.startForDoc.set( docName, serializedChange.start + serializedChange.transactions.length );
	return this.collection.updateOne(
		{ docName: docName },
		{
			$push: {
				transactions: { $each: serializedChange.transactions },
				stores: { $each: serializedChange.stores || serializedChange.transactions.map( function () {
					return null;
				} ) }
			}
		}
	).then( function () {
		documentStore.logger.logServerEvent( { type: 'DocumentStore#onNewChange', docName: docName, change: serializedChange } );
	} );
};

ve.dm.DocumentStore.prototype.onClose = function () {
	this.logger.logServerEvent( { type: 'DocumentStore#onClose' } );
	this.storageClient.close();
};
