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


ve.newPeer = function () {
	// To use the public PeerJS server:
	return new Peer();
	// To use a local PeerJS server:
	// return new Peer( undefined, { host: 'localhost', port: 9000, path: '/myapp' } );
	// To use a ve.FakePeer (for debugging):
	// return new ve.FakePeer();
};

ve.ui.Surface.prototype.initPeerServer = function () {
	var surface = this,
		completeHistory = this.model.documentModel.completeHistory;

	ve.dm.peerServer = new ve.dm.PeerTransportServer( completeHistory.getLength() );
	if ( completeHistory.getLength() > 0 ) {
		completeHistory.transactions[ 0 ].authorId = 1;
	}
	ve.dm.peerServer.protocolServer.rebaseServer.updateDocState(
		'doc123',
		1,
		ve.dm.Change.static.deserialize( completeHistory.serialize(), true ),
		completeHistory,
		{}
	);
	ve.dm.peerServer.peer = ve.newPeer();
	ve.dm.peerServer.peer.on( 'open', function ( id ) {
		/* eslint-disable-next-line no-console */
		console.log( 'Open. Now in another browser window, do:\nve.init.target.surface.initPeerClient( \'' + id + '\' );' );
		surface.initPeerClient( id, true );
	} );
	ve.dm.peerServer.peer.on( 'connection', function ( conn ) {
		ve.dm.peerServer.onConnection( conn );
	} );
};

ve.ui.Surface.prototype.initPeerClient = function ( serverId, isMain ) {
	var surface = this,
		completeHistory = this.model.documentModel.completeHistory,
		peerClient = ve.newPeer();
	if ( completeHistory.getLength() > 0 ) {
		completeHistory.transactions[ 0 ].authorId = 1;
	}
	// HACK: Disable redo command until supported (T185706)
	ve.ui.commandRegistry.unregister( 'redo' );

	if ( !isMain ) {
		ve.ui.commandRegistry.unregister( 'showSave' );
		$( '.ve-ui-toolbar-saveButton' ).css( 'text-decoration', 'line-through' );
	}

	peerClient.on( 'open', function ( /* id */ ) {
		var conn = peerClient.connect( serverId );
		conn.on( 'open', function () {
			surface.model.createSynchronizer( 'foo', { peerConnection: conn } );
			surface.model.synchronizer.commitLength = completeHistory.getLength();
			surface.model.synchronizer.sentLength = completeHistory.getLength();
			surface.view.connectModelSynchronizer();
		} );
	} );
};

ve.ce.Surface.prototype.connectModelSynchronizer = function () {
	this.model.synchronizer.connect( this, {
		authorSelect: 'onSynchronizerAuthorUpdate',
		authorChange: 'onSynchronizerAuthorUpdate',
		authorDisconnect: 'onSynchronizerAuthorDisconnect',
		wrongDoc: 'onSynchronizerWrongDoc',
		pause: 'onSynchronizerPause'
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
			ve.init.target.surface.initPeerClient( id );
			return;
		} else {
			ve.init.target.surface.initPeerServer();
			ve.dm.peerServer.peer.on( 'open', function ( id ) {
				OO.ui.alert( 'Share this sesion ID: ' + id, { size: 'medium' } );
			} );
		}
	} );
};
