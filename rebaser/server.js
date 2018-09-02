/*!
 * VisualEditor rebase server script.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-disable no-console */

var logStream, docStore, protocolServer, transportServer,
	port = 8081,
	startTimestamp,
	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	io = require( 'socket.io' )( http ),
	ve = require( '../dist/ve-rebaser.js' ),
	MongoClient = require( 'mongodb' ).MongoClient;

function logEvent( event ) {
	if ( !logStream ) {
		logStream = fs.createWriteStream( 'rebaser.log', { flags: 'a' } );
	}
	logStream.write( JSON.stringify( event ) + '\n' );
}

function logServerEvent( event ) {
	var key,
		ob = {};
	ob.timestamp = Date.now() - startTimestamp;
	ob.clientId = 'server';
	for ( key in event ) {
		if ( event[ key ] instanceof ve.dm.Change ) {
			ob[ key ] = event[ key ].serialize( true );
		} else {
			ob[ key ] = event[ key ];
		}
	}
	logEvent( ob );
}

/**
 * Protocol server
 *
 * Handles the abstract protocol without knowing the specific transport
 *
 * @param {MongoDocStore} docStore the persistent storage
 */
function ProtocolServer( docStore ) {
	this.rebaseServer = new ve.dm.RebaseServer( logServerEvent );
	this.lastAuthorForDoc = new Map();
	this.loadingForDoc = new Map();
	this.docStore = docStore;
}

ProtocolServer.static = {};

ProtocolServer.static.palette = [
	'1f77b4', 'ff7f0e', '2ca02c', 'd62728', '9467bd',
	'8c564b', 'e377c2', '7f7f7f', 'bcbd22', '17becf',
	'aec7e8', 'ffbb78', '98df8a', 'ff9896', 'c5b0d5',
	'c49c94', 'f7b6d2', 'c7c7c7', 'dbdb8d', '9edae5'
];

/**
 * If the document is not loaded, load from storage (creating as empty if absent)
 *
 * @param {string} docName Name of the document
 * @return {Promise<undefined>} Resolves when loaded
 */
ProtocolServer.prototype.ensureLoaded = function ( docName ) {
	var loading = this.loadingForDoc.get( docName ),
		rebaseServer = this.rebaseServer;

	if ( loading ) {
		return loading;
	}
	loading = this.docStore.load( docName ).then( function ( change ) {
		rebaseServer.updateDocState( docName, null, change );
	} );
	this.loadingForDoc.set( docName, loading );
	return loading;
};

ProtocolServer.prototype.onUnload = function ( context ) {
	console.log( 'Unload', context.docName );
	this.loadingForDoc.delete( context.docName );
	this.rebaseServer.clearDocState( context.docName );
};

/**
 * Check the client's credentials, and return a connection context object
 *
 * If the client is not recognised and authenticated, a new client ID and token are assigned.
 *
 * @param {string} docName The document name
 * @param {number|null} authorId The author ID, if any
 * @param {token|null} token The secret token, if any
 *
 * @return {Object} The connection context
 */
ProtocolServer.prototype.authenticate = function ( docName, authorId, token ) {
	var context,
		state = this.rebaseServer.stateForDoc.get( docName ),
		authorData = state && state.authors.get( authorId );

	if ( !authorData || token !== authorData.token ) {
		authorId = 1 + ( this.lastAuthorForDoc.get( docName ) || 0 );
		this.lastAuthorForDoc.set( docName, authorId );
		token = Math.random().toString( 36 ).slice( 2 );
	}
	context = {
		docName: docName,
		authorId: authorId
	};
	logServerEvent( {
		type: 'newClient',
		doc: docName,
		authorId: context.authorId
	} );
	return context;
};

/**
 * Add an event to the log
 *
 * @param {Object} context The connection context
 * @param {Object} event Event data
 */
ProtocolServer.prototype.onLogEvent = function ( context, event ) {
	var key,
		ob = {};
	ob.recvTimestamp = Date.now() - startTimestamp;
	ob.clientId = context.authorId;
	ob.doc = context.docName;
	for ( key in event ) {
		ob[ key ] = event[ key ];
	}
	logEvent( ob );
};

/**
 * Setup author on the server and send initialization events
 *
 * @param {Object} context The connection context
 */
ProtocolServer.prototype.welcomeClient = function ( context ) {
	var state, authorData,
		docName = context.docName,
		authorId = context.authorId;

	console.log( 'connection ' + context.connectionId );
	this.rebaseServer.updateDocState( docName, authorId, null, {
		// TODO: i18n
		displayName: 'User ' + authorId,
		displayColor: this.constructor.static.palette[
			authorId % this.constructor.static.palette.length
		],
		active: true
	} );

	state = this.rebaseServer.getDocState( docName );
	authorData = state.authors.get( authorId );

	context.sendAuthor( 'registered', {
		authorId: authorId,
		authorName: authorData.displayName,
		authorColor: authorData.displayColor,
		token: authorData.token
	} );
	context.broadcast( 'nameChange', {
		authorId: authorId,
		authorName: authorData.displayName
	} );
	context.broadcast( 'colorChange', {
		authorId: authorId,
		authorColor: authorData.displayColor
	} );
	// HACK Catch the client up on the current state by sending it the entire history
	// Ideally we'd be able to initialize the client using HTML, but that's hard, see
	// comments in the /raw handler. Keeping an updated linmod on the server could be
	// feasible if TransactionProcessor was modified to have a "don't sync, just apply"
	// mode and ve.dm.Document was faked with { data: …, metadata: …, store: … }
	context.sendAuthor( 'initDoc', {
		history: state.history.serialize( true ),
		authors: state.getActiveAuthors()
	} );
};

/**
 * Try to apply a received change, and broadcast the successful portion as rebased
 *
 * @param {Object} context The connection context
 * @param {Object} data The change data
 */
ProtocolServer.prototype.onSubmitChange = function ( context, data ) {
	var change, applied, appliedSerialized;
	change = ve.dm.Change.static.deserialize( data.change, null, true );
	applied = this.rebaseServer.applyChange( context.docName, context.authorId, data.backtrack, change );
	if ( !applied.isEmpty() ) {
		appliedSerialized = applied.serialize( true );
		this.docStore.onNewChange( context.docName, appliedSerialized );
		context.broadcast( 'newChange', appliedSerialized );
	}
};

/**
 * Apply and broadcast a name change,
 *
 * @param {Object} context The connection context
 * @param {string} newName The new name
 */
ProtocolServer.prototype.onChangeName = function ( context, newName ) {
	this.rebaseServer.updateDocState( context.docName, context.authorId, null, {
		displayName: newName
	} );
	context.broadcast( 'nameChange', {
		authorId: context.authorId,
		authorName: newName
	} );
	logServerEvent( {
		type: 'nameChange',
		doc: context.docName,
		authorId: context.authorId,
		newName: newName
	} );
};

/**
 * Apply and broadcast a color change,
 *
 * @param {Object} context The connection context
 * @param {string} newColor The new color
 */
ProtocolServer.prototype.onChangeColor = function ( context, newColor ) {
	this.rebaseServer.updateDocState( context.docName, context.authorId, null, {
		displayColor: newColor
	} );
	context.broadcast( 'colorChange', {
		authorId: context.authorId,
		authorColor: newColor
	} );
	logServerEvent( {
		type: 'colorChange',
		doc: context.docName,
		authorId: context.authorId,
		newColor: newColor
	} );
};

/**
 * Apply and broadcast a disconnection (which may be temporary)
 *
 * @param {Object} context The connection context
 */
ProtocolServer.prototype.onDisconnect = function ( context ) {
	console.log( 'disconnect ' + context.connectionId );
	this.rebaseServer.updateDocState( context.docName, context.authorId, null, {
		active: false,
		continueBase: null,
		rejections: null
	} );
	context.broadcast( 'authorDisconnect', context.authorId );
	logServerEvent( {
		type: 'disconnect',
		doc: context.docName,
		authorId: context.authorId
	} );
};

/**
 * Transport server for Socket IO transport
 *
 * @constructor
 * @param {ProtocolServer} protocolServer The protocol server
 */
function TransportServer( protocolServer ) {
	this.protocolServer = protocolServer;
	this.docNamespaces = new Map();
}

/**
 * Generic connection handler
 *
 * This just creates a namespace handler for the docName, if one does not already exist
 *
 * @param {Object} socket The io socket
 */
TransportServer.prototype.onConnection = function ( socket ) {
	var namespace,
		docName = socket.handshake.query.docName;
	if ( docName && !this.docNamespaces.has( docName ) ) {
		namespace = io.of( '/' + docName );
		this.docNamespaces.set( docName, namespace );
		// We must bind methods separately, using a namespace handler, because
		// the socket object passed into namespace handlers is different
		namespace.on( 'connection', this.onDocConnection.bind( this, docName, namespace ) );
	}
};

/**
 * Namespace connection handler
 *
 * This sends events to initialize the client, and adds handlers to the client's socket
 *
 * @param {string} docName Name of the document
 * @param {Object} namespace The io namespace
 * @param {Object} socket The io socket (specific to one client's current connection)
 * @return {Promise<undefined>} Resolves when finished initializing
 */
TransportServer.prototype.onDocConnection = function ( docName, namespace, socket ) {
	var server = this.protocolServer,
		authorId = +socket.handshake.query.authorId || null,
		token = socket.handshake.query.token || null,
		broadcast = this.broadcast.bind( this, docName, namespace );

	/**
		* Ensure the doc is loaded when calling f
		*
		* @param {Function} f A method of server
		* @param {Object} context Connection context object passed to f as first argument
		* @return {Function} Function returning a promise resolving with f's return value
		*/
	function ensureLoadedWrap( f, context ) {
		// In theory, some protection is needed to ensure the document cannot unload
		// between the ensureLoaded promise resolving and f running. In practice,
		// this should not happen if the unloading is not too aggressive.
		return function () {
			var args = Array.prototype.slice.call( arguments );
			args.splice( 0, 0, context );
			return server.ensureLoaded( docName ).then( function () {
				return f.apply( server, args );
			} );
		};
	}

	return server.ensureLoaded( docName ).then( function () {
		var context = server.authenticate( docName, authorId, token );
		context.broadcast = broadcast;
		context.sendAuthor = socket.emit.bind( socket );
		context.connectionId = socket.client.conn.remoteAddress + ' ' + socket.handshake.url;
		socket.on( 'submitChange', ensureLoadedWrap( server.onSubmitChange, context ) );
		socket.on( 'changeName', ensureLoadedWrap( server.onChangeName, context ) );
		socket.on( 'changeColor', ensureLoadedWrap( server.onChangeColor, context ) );
		socket.on( 'disconnect', ensureLoadedWrap( server.onDisconnect, context ) );
		socket.on( 'logEvent', ensureLoadedWrap( server.onLogEvent, context ) );
		// XXX event for testing purposes only; replace with unit tests
		socket.on( 'unload', server.onUnload.bind( server, context ) );
		server.welcomeClient( context );
	} );
};

TransportServer.prototype.broadcast = function ( docName, namespace, eventName, object ) {
	namespace.emit( eventName, object );
};

TransportServer.prototype.onClose = function () {
	this.docStore.onClose();
};

function MongoDocStore( url ) {
	this.url = url;
	this.db = null;
	this.collection = null;
	this.startForDoc = new Map();
}

/**
 * @return {Promise<undefined>} Resolves when connected
 */
MongoDocStore.prototype.connect = function () {
	var mongoDocStore = this;
	return MongoClient.connect( this.url ).then( function ( db ) {
		console.log( 'Connected', mongoDocStore.url );
		mongoDocStore.db = db;
		// XXX for testing only: drop database on connect
		return db.dropDatabase().then( function () {
			mongoDocStore.collection = db.collection( 'vedocstore' );
		} );
	} );
};

/**
 * Load a document from storage (creating as empty if absent)
 *
 * @param {string} docName Name of the document
 * @return {Promise<ve.dm.Change>} Confirmed document history
 */
MongoDocStore.prototype.load = function ( docName ) {
	var mongoDocStore = this;
	return this.collection.findAndModify(
		{ docName: docName },
		undefined,
		{ $setOnInsert: { start: 0, transactions: [], stores: [] } },
		{ upsert: true, 'new': true }
	).then( function ( result ) {
		mongoDocStore.startForDoc.set( docName, result.value.start + result.value.transactions.length || 0 );
		console.log( 'Loaded', result.value );
		return ve.dm.Change.static.deserialize( {
			start: 0,
			transactions: result.value.transactions,
			stores: result.value.stores,
			selections: {}
		} );
	} );
};

MongoDocStore.prototype.onNewChange = function ( docName, object ) {
	var mongoDocStore = this,
		expectedStart = mongoDocStore.startForDoc.get( docName ) || 0;
	console.log( 'Processing new change', docName, object );
	if ( expectedStart !== object.start ) {
		console.log( 'Unmatched starts:', expectedStart, object.start );
		throw new Error( 'Unmatched starts:', expectedStart, object.start );
	}
	mongoDocStore.startForDoc.set( docName, object.start + object.transactions.length );
	return mongoDocStore.collection.update(
		{ docName: docName },
		{
			$push: {
				transactions: { $each: object.transactions },
				stores: { $each: object.stores || object.transactions.map( function () {
					return null;
				} ) }
			}
		}
	);
};

MongoDocStore.prototype.onClose = function () {
	console.log( 'closing' );
	this.db.close();
};

app.use( express.static( __dirname + '/..' ) );
app.set( 'view engine', 'ejs' );

app.get( '/', function ( req, res ) {
	res.render( 'index' );
} );

app.get( '/doc/edit/:docName', function ( req, res ) {
	var docName = req.params.docName;
	res.render( 'editor', { docName: docName } );
} );

app.get( '/doc/raw/:docName', function ( req, res ) {
	// TODO return real data
	// In order to provide HTML here, we'd need all of ve.dm (Document, Converter, all nodes)
	// and none of that code is likely to work in nodejs without some work because of how heavily
	// it uses the DOM.
	res.status( 401 ).send( 'DOM in nodejs is hard' );
} );

docStore = new MongoDocStore( 'mongodb://localhost:27017/test' );
protocolServer = new ProtocolServer( docStore );
transportServer = new TransportServer( protocolServer );
io.on( 'connection', transportServer.onConnection.bind( transportServer ) );

startTimestamp = Date.now();
logServerEvent( { type: 'restart' } );
docStore.connect().then( function () {
	http.listen( port );
} );
console.log( 'Listening on ' + port );
