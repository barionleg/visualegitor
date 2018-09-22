/*!
 * VisualEditor rebase server script.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

'use strict';

const
	express = require( 'express' ),
	http = require( 'http' ),
	socketIO = require( 'socket.io' ),
	mongodb = require( 'mongodb' ),
	Logger = require( './Logger.js' ),
	ve = require( '../../dist/ve-rebaser.js' ),
	packageInfo = require( '../package.json' );

function initApp( options ) {
	const app = express();

	// get the options and make them available in the app
	app.logger = options.logger; // the logging device
	app.metrics = options.metrics; // the metrics
	app.conf = options.config; // this app's config options
	app.info = packageInfo; // this app's package info

	app.use( express.static( __dirname + '/../..' ) );
	app.set( 'view engine', 'ejs' );

	app.get( '/', function ( req, res ) {
		res.render( 'index' );
	} );

	// eslint-disable-next-line prefer-regex-literals
	app.get( new RegExp( '/doc/edit/(.*)' ), function ( req, res ) {
		const docName = req.params[ 0 ];
		res.render( 'editor', { docName: docName } );
	} );

	// eslint-disable-next-line prefer-regex-literals
	app.get( new RegExp( '/doc/raw/(.*)' ), function ( req, res ) {
		const docName = req.params[ 0 ];
		// eslint-disable-next-line no-use-before-define
		const state = protocolServer.rebaseServer.getDocState( docName );

		const doc = new ve.dm.Document( [
			{ type: 'paragraph' }, { type: '/paragraph' },
			{ type: 'internalList' }, { type: '/internalList' }
		] );
		const surface = new ve.dm.Surface( doc );

		// The state from getDocState has serialized store values
		const history = ve.dm.Change.static.deserialize( state.history.serialize( true ) );
		history.applyTo( surface );

		const dom = ve.dm.converter.getDomFromModel( surface.getDocument() );

		res.send( dom.body.innerHTML );
	} );

	const logger = new Logger( app.logger );
	const mongoClient = new mongodb.MongoClient(
		'mongodb://' + app.conf.mongodb.host + ':' + app.conf.mongodb.port
	);
	const documentStore = new ve.dm.DocumentStore( mongoClient, 'test', logger );
	const protocolServer = new ve.dm.ProtocolServer( documentStore, logger );
	app.transportServer = new ve.dm.TransportServer( protocolServer );
	app.logger.log( 'info', 'Connecting to document store' );

	return documentStore.connect().then( function () {
		const dropDatabase = ( process.argv.includes( '--drop' ) );
		if ( dropDatabase ) {
			app.logger.log( 'info', 'Dropping database' );
		}
		return ( dropDatabase ? documentStore.dropDatabase() : Promise.resolve() ).then( function () {
			return app;
		} );
	} );
}

function createServer( app ) {
	// return a promise which creates an HTTP server,
	// attaches the app to it, and starts accepting
	// incoming client requests
	let server;

	return new Promise( function ( resolve ) {
		server = http.createServer( app ).listen(
			app.conf.port,
			app.conf.interface,
			resolve
		);
		const io = socketIO( server );
		io.on(
			'connection',
			app.transportServer.onConnection.bind(
				app.transportServer,
				io.sockets.in.bind( io.sockets )
			)
		);
	} ).then( function () {
		app.logger.log( 'info',
			'Worker ' + process.pid + ' listening on ' + ( app.conf.interface || '*' ) + ':' + app.conf.port );
		return server;
	} );
}

/**
 * The service's entry point. It takes over the configuration
 * options and the logger and metrics-reporting objects from
 * service-runner and starts an HTTP server, attaching the application
 * object to it.
 *
 * @param {Object} options
 * @return {Promise} a promise for an http server.
 */
module.exports = function ( options ) {
	return initApp( options )
		.then( createServer );
};
