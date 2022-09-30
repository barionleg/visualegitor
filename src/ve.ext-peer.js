/*!
 * VisualEditor PeerJS extensions.
 *
 * @copyright 2011-2022 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Peer */

/**
 * Recursively serialize objects into plain data.
 *
 * Non-plain objects must have a .serialize or .toJSON method.
 *
 * @param {Object|Array} value The value to serialize
 * @return {Object|Array} The serialized version
 */
ve.serialize = function ( value ) {
	if ( Array.isArray( value ) ) {
		return value.map( function ( item ) {
			return ve.serialize( item );
		} );
	} else if ( value === null || typeof value !== 'object' ) {
		return value;
	} else if ( value.constructor === Object ) {
		var serialized = {};
		for ( var property in value ) {
			serialized[ property ] = ve.serialize( value[ property ] );
		}
		return serialized;
	} else if ( typeof value.serialize === 'function' ) {
		return ve.serialize( value.serialize() );
	} else if ( typeof value.toJSON === 'function' ) {
		return ve.serialize( value.toJSON() );
	}
	throw new Error( 'Cannot serialize ' + value );
};


ve.dm.Surface.prototype.newPeer = function () {
	// To use the public PeerJS server:
	return new Peer();
	// To use a local PeerJS server:
	// return new Peer( undefined, { host: 'localhost', port: 9000, path: '/myapp' } );
	// To use a ve.FakePeer (for debugging):
	// return new ve.FakePeer();
};

ve.dm.Surface.prototype.initPeerServer = function () {
	var surface = this;

	ve.dm.peerServer = new ve.dm.PeerTransportServer( this.documentModel.completeHistory.getLength() );
	if ( this.documentModel.completeHistory.transactions.length > 0 ) {
		this.documentModel.completeHistory.transactions[ 0 ].authorId = 1;
	}
	ve.dm.peerServer.protocolServer.rebaseServer.updateDocState(
		'doc123',
		1,
		ve.dm.Change.static.deserialize(
			this.documentModel.completeHistory.serialize(),
			true
		),
		this.documentModel.completeHistory,
		{}
	);
	ve.dm.peerServer.peer = this.newPeer();
	ve.dm.peerServer.peer.on( 'open', function ( id ) {
		/* eslint-disable-next-line no-console */
		console.log( 'Open, Now in another browser window, do:\nve.init.target.surface.model.initPeerClient( \'' + id + '\' );' );
		surface.initPeerClient( id );
	} );
	ve.dm.peerServer.peer.on( 'connection', function ( conn ) {
		ve.dm.peerServer.onConnection( conn );
	} );
};

ve.dm.Surface.prototype.initPeerClient = function ( serverId ) {
	var surface = this,
		peerClient = this.newPeer();
	if ( surface.documentModel.completeHistory.transactions.length > 0 ) {
		surface.documentModel.completeHistory.transactions[ 0 ].authorId = 1;
	}
	peerClient.on( 'open', function ( /* id */ ) {
		var conn = peerClient.connect( serverId );
		conn.on( 'open', function () {
			surface.createSynchronizer( 'foo', { peerConnection: conn } );
			surface.synchronizer.commitLength = surface.documentModel.completeHistory.getLength();
			surface.synchronizer.sentLength = surface.documentModel.completeHistory.getLength();
		} );
	} );
};

ve.collab = function () {
	OO.ui.prompt(
		'Enter collab session to join (blank to start a new one)',
		{
			textInput: { placeholder: '[session-id-goes-here]' },
			size: 'medium'
		}
	).then( function( id ) {
		if ( id === null ) {
			return;
		}
		if ( id !== '' ) {
			ve.init.target.surface.model.initPeerClient( id );
			return;
		} else {
			ve.init.target.surface.model.initPeerServer();
			ve.dm.peerServer.peer.on( 'open', function ( id ) {
				OO.ui.alert( 'Share this sesion ID: ' + id, { size: 'medium' } );
			} );
		}
	} );
};
