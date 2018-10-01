/*!
 * VisualEditor rebase server script.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-disable no-console */

var logger, documentStore, protocolServer, transportServer,
	port = 8081,
	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	io = require( 'socket.io' )( http ),
	MongoClient = require( 'mongodb' ).MongoClient,
	ve = require( '../../dist/ve-rebaser.js' );

function Logger( filename ) {
	this.filename = filename;
	this.logStream = null;
	this.startTimestamp = null;
}

Logger.prototype.getRelativeTimestamp = function () {
	return Date.now() - this.startTimestamp;
};

/**
 * @param {Object} event The event to log
 */
Logger.prototype.logEvent = function ( event ) {
	if ( !this.logStream ) {
		this.logStream = fs.createWriteStream( 'rebaser.log', { flags: 'a' } );
	}
	this.logStream.write( JSON.stringify( event ) + '\n' );
};

/**
 * Log a server event
 *
 * @param {Object} event The server event to log
 */
Logger.prototype.logServerEvent = function ( event ) {
	var key,
		ob = {};
	ob.timestamp = this.getRelativeTimestamp();
	ob.clientId = 'server';
	for ( key in event ) {
		if ( event[ key ] instanceof ve.dm.Change ) {
			ob[ key ] = event[ key ].serialize( true );
		} else {
			ob[ key ] = event[ key ];
		}
	}
	this.logEvent( ob );
};

/**
 * Transport server for Socket IO transport
 *
 * @constructor
 * @param {ve.dm.ProtocolServer} protocolServer The protocol server
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
 * @return {Promise}
 */
TransportServer.prototype.onConnection = function ( socket ) {
	var server = this.protocolServer,
		docName = socket.handshake.query.docName,
		authorId = +socket.handshake.query.authorId || null,
		token = socket.handshake.query.token || null;

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

	socket.join( docName );
	return server.ensureLoaded( docName ).then( function () {
		var context = server.authenticate( docName, authorId, token );
		context.broadcast = function () {
			var room = io.sockets.in( docName );
			room.emit.apply( room, arguments );
		};
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
	this.documentStore.onClose();
};

app.use( express.static( __dirname + '/../..' ) );
app.set( 'view engine', 'ejs' );

app.get( '/', function ( req, res ) {
	res.render( 'index' );
} );

app.get( new RegExp( '/doc/edit/(.*)' ), function ( req, res ) {
	var docName = req.params[ 0 ];
	res.render( 'editor', { docName: docName } );
} );

app.get( new RegExp( '/doc/raw/(.*)' ), function ( req, res ) {
	// TODO return real data
	// In order to provide HTML here, we'd need all of ve.dm (Document, Converter, all nodes)
	// and none of that code is likely to work in nodejs without some work because of how heavily
	// it uses the DOM.
	// var docName = req.params[ 0 ];
	res.status( 401 ).send( 'DOM in nodejs is hard' );
} );

logger = new Logger( 'rebaser.log' );
documentStore = new ve.dm.DocumentStore( MongoClient, 'mongodb://localhost:27017/test', logger );
protocolServer = new ve.dm.ProtocolServer( documentStore, logger );
transportServer = new TransportServer( protocolServer );
io.on( 'connection', transportServer.onConnection.bind( transportServer ) );
console.log( 'Connecting to document store' );
documentStore.connect().then( function () {
	http.listen( port );
	console.log( 'Listening on ' + port );
} );
