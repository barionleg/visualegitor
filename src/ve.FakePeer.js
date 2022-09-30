/*!
 * VisualEditor fake PeerJS class.
 *
 * For convenient debugging. Create two FakePeers in one browser window. Then a single
 * debugger can see all the communication within its call stack.
 *
 * @copyright 2011-2022 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Map */
/* global Promise */

ve.FakePeer = function veFakePeer() {
	this.id = 'p' + this.constructor.static.peers.length;
	this.constructor.static.peers.push( this );
	this.connections = [];
	this.handlers = new Map();
	Promise.resolve( this.id ).then( this.callHandlers.bind( this, 'open' ) );
};

/* Initialization */

OO.initClass( ve.FakePeer );

/* Static properties */

ve.FakePeer.static.peers = [];

ve.FakePeer.static.test = function ( fake ) {
	function mkPeer() {
		if ( fake ) {
			return new ve.FakePeer();
		} else {
			return new Peer( undefined, { host: 'localhost', port: 9000, path: '/myapp' } );
		}
	}
	window.p0 = mkPeer();
	p0.on( 'open', function ( p0Id ) {
		console.log( 'p0open', p0Id );
		window.p1 = mkPeer();
		p1.on( 'open', function ( id ) {
			console.log( 'p1open', id );
			window.conn1 = p1.connect( p0Id );
			conn1.on( 'open', function () {
				console.log( 'conn1open' );
			} );
			conn1.on( 'data', function ( data ) {
				console.log( 'conn1data', data );
			} );
		} );
	} );
	p0.on( 'connection', function ( conn0 ) {
		console.log( 'p0conn' );
		window.conn0 = conn0;
		conn0.on( 'open', function () {
			console.log( 'conn0open' );
			conn0.send( 'hello' );
		} );
		conn0.on( 'data', function ( data ) {
			console.log( 'conn0data', data );
		} );
	} );
};

/* Methods */

ve.FakePeer.prototype.on = function ( ev, f ) {
	var handlers = this.handlers.get( ev );
	if ( !handlers ) {
		handlers = [];
		this.handlers.set( ev, handlers );
	}
	handlers.push( f );
};

ve.FakePeer.prototype.callHandlers = function ( type ) {
	var args = Array.prototype.slice.call( arguments, 1 );
	console.log( 've.FakePeer', this.id, type, args );
	( this.handlers.get( type ) || [] ).forEach( function ( handler ) {
		handler.apply( null, args );
	} );
};

ve.FakePeer.prototype.connect = function ( id ) {
	var peer = this.constructor.static.peers.filter( function ( peerI ) {
		return peerI.id === id;
	} )[ 0 ];
	if ( !peer ) {
		throw new Error( 'Unknown id: ' + id );
	}
	var thisConn = new ve.FakePeerConnection( peer.id + '-' + this.id, peer );
	var peerConn = new ve.FakePeerConnection( this.id + '-' + peer.id, this );
	thisConn.other = peerConn;
	peerConn.other = thisConn;
	this.connections.push( thisConn );
	peer.connections.push( peerConn );
	Promise.resolve( peerConn ).then( peer.callHandlers.bind( peer, 'connection' ) );
	Promise.resolve( thisConn.id ).then( thisConn.callHandlers.bind( thisConn, 'open' ) );
	Promise.resolve( peerConn.id ).then( peerConn.callHandlers.bind( peerConn, 'open' ) );
	return thisConn;
};

ve.FakePeerConnection = function VeFakePeerConnection( id, peer ) {
	this.id = id;
	this.peer = peer;
	this.other = null;
	this.handlers = new Map();
};

OO.initClass( ve.FakePeerConnection );

ve.FakePeerConnection.prototype.on = function ( ev, f ) {
	var handlers = this.handlers.get( ev );
	if ( !handlers ) {
		handlers = [];
		this.handlers.set( ev, handlers );
	}
	handlers.push( f );
};

ve.FakePeerConnection.prototype.callHandlers = function ( type ) {
	var args = Array.prototype.slice.call( arguments, 1 );
	console.log( 've.FakePeerConnection', this.id, type, args );
	( this.handlers.get( type ) || [] ).forEach( function ( handler ) {
		handler.apply( null, args );
	} );
};

ve.FakePeerConnection.prototype.setOther = function ( other ) {
	this.other = other;
	Promise.resolve( this.id ).then( this.callHandlers.bind( this, 'open' ) );
};

ve.FakePeerConnection.prototype.send = function ( data ) {
	Promise.resolve( data ).then( this.other.callHandlers.bind( this.other, 'data' ) );
};
