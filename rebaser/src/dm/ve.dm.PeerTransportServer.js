/*!
 * VisualEditor DataModel PeerJS transport server class.
 *
 * @copyright 2011-2022 VisualEditor Team and others; see http://ve.mit-license.org
 */

'use strict';

/**
 * Transport server for Socket IO transport
 *
 * @constructor
 * @param {number} startHeight Length of shared completeHistory
 */
ve.dm.PeerTransportServer = function VeDmPeerTransportServer( startHeight ) {
	const startTimestamp = Date.now();
	this.startHeight = startHeight;
	this.protocolServer = new ve.dm.ProtocolServer(
		{
			startHeight: startHeight,
			serverId: 'server123',
			load: function () {
				return Promise.resolve(
					ve.dm.Change.static.deserialize( { transactions: [] } )
				);
			},
			onNewChange: function () {
				return Promise.resolve();
			}
		},
		{
			logServerEvent: ( x ) => console.log( x ),
			logEvent: ( x ) => console.log( x ),
			getRelativeTimestamp: () => Date.now() - startTimestamp
		}
	);
	this.connections = [];
};

OO.initClass( ve.dm.PeerTransportServer );

/**
 * Generic connection handler
 *
 * @param {Object} conn The connection
 */
ve.dm.PeerTransportServer.prototype.onConnection = function ( conn ) {
	const context = this.protocolServer.authenticate( 'doc123', null, null ),
		connections = this.connections,
		server = this.protocolServer,
		startHeight = this.startHeight;

	connections.push( conn );

	context.broadcast = function ( type, data ) {
		console.log( 'PeerTransportServer broadcast', type, data );
		var serialized = ve.serialize( data );
		connections.forEach( function ( connection ) {
			connection.send( { type: type, data: serialized } );
		} );
	};
	context.sendAuthor = function ( type, data ) {
		console.log( 'PeerTransportServer sendAuthor', type, data );
		var serialized = ve.serialize( data );
		conn.send( { type: type, data: serialized } );
	};
	conn.on( 'data', function ( data ) {
		const type = data.type;
		if ( type === 'submitChange' ) {
			server.onSubmitChange( context, data.data );
		} else if ( type === 'changeAuthor' ) {
			server.onChangeAuthor( context, data.data );
		} else if ( type === 'disconnect' ) {
			server.onDisconnect( context, data.data );
		} else if ( type === 'logEvent' ) {
			console.log( 'logEvent', data.data );
		} else {
			throw new Error( 'Unknown type "' + type + '"' );
		}
	} );
	conn.on( 'open', function () {
		server.welcomeClient( context, startHeight );
	} );
};
