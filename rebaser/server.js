/*!
 * VisualEditor rebase server script.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-disable no-console */

var rebaseServer, palette, logStream, handlers,
	port = 8081,
	startTimestamp,
	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	io = require( 'socket.io' )( http ),
	ve = require( '../dist/ve-rebaser.js' ),
	docNamespaces = new Map(),
	lastAuthorForDoc = new Map();

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

rebaseServer = new ve.dm.RebaseServer( logServerEvent );
docNamespaces = new Map();
lastAuthorForDoc = new Map();
palette = [
	'1f77b4', 'ff7f0e', '2ca02c', 'd62728', '9467bd',
	'8c564b', 'e377c2', '7f7f7f', 'bcbd22', '17becf',
	'aec7e8', 'ffbb78', '98df8a', 'ff9896', 'c5b0d5',
	'c49c94', 'f7b6d2', 'c7c7c7', 'dbdb8d', '9edae5'
];

function welcomeNewClient( socket, docName, authorId ) {
	var state, authorData;
	rebaseServer.updateDocState( docName, authorId, null, {
		// TODO: i18n
		displayName: 'User ' + authorId,
		displayColor: palette[ authorId % palette.length ]
	} );

	state = rebaseServer.getDocState( docName );
	authorData = state.authors.get( authorId );

	socket.emit( 'registered', {
		authorId: authorId,
		authorName: authorData.displayName,
		authorColor: authorData.displayColor,
		token: authorData.token
	} );
	docNamespaces.get( docName ).emit( 'nameChange', {
		authorId: authorId,
		authorName: authorData.displayName
	} );
	docNamespaces.get( docName ).emit( 'colorChange', {
		authorId: authorId,
		authorColor: authorData.displayColor
	} );
	// HACK Catch the client up on the current state by sending it the entire history
	// Ideally we'd be able to initialize the client using HTML, but that's hard, see
	// comments in the /raw handler. Keeping an updated linmod on the server could be
	// feasible if TransactionProcessor was modified to have a "don't sync, just apply"
	// mode and ve.dm.Document was faked with { data: ..., metadata: ..., store: ... }
	socket.emit( 'initDoc', {
		history: state.history.serialize( true ),
		names: state.getActiveNames()
	} );
}

function onSubmitChange( context, data ) {
	var change, applied;
	change = ve.dm.Change.static.deserialize( data.change, null, true );
	applied = rebaseServer.applyChange( context.docName, context.authorId, data.backtrack, change );
	if ( !applied.isEmpty() ) {
		docNamespaces.get( context.docName ).emit( 'newChange', applied.serialize( true ) );
	}
}

function onChangeName( context, newName ) {
	rebaseServer.updateDocState( context.docName, context.authorId, null, {
		displayName: newName
	} );
	docNamespaces.get( context.docName ).emit( 'nameChange', {
		authorId: context.authorId,
		authorName: newName
	} );
	logServerEvent( {
		type: 'nameChange',
		doc: context.docName,
		authorId: context.authorId,
		newName: newName
	} );
}

function onChangeColor( context, newColor ) {
	rebaseServer.updateDocState( context.docName, context.authorId, null, {
		displayColor: newColor
	} );
	docNamespaces.get( context.docName ).emit( 'colorChange', {
		authorId: context.authorId,
		authorColor: newColor
	} );
	logServerEvent( {
		type: 'colorChange',
		doc: context.docName,
		authorId: context.authorId,
		newColor: newColor
	} );
}

function onUsurp( context, data ) {
	var state = rebaseServer.getDocState( context.docName ),
		newAuthorData = state.authors.get( data.authorId );
	if ( newAuthorData.token !== data.token ) {
		context.socket.emit( 'usurpFailed' );
		return;
	}
	rebaseServer.updateDocState( context.docName, data.authorId, null, {
		active: true
	} );
	// TODO either delete this author, or reimplement usurp in a client-initiated way
	rebaseServer.updateDocState( context.docName, context.authorId, null, {
		active: false
	} );
	context.socket.emit( 'registered', {
		authorId: data.authorId,
		authorName: newAuthorData.displayName,
		token: newAuthorData.token
	} );
	docNamespaces.get( context.docName ).emit( 'nameChange', {
		authorId: data.authorId,
		authorName: newAuthorData.displayName
	} );
	docNamespaces.get( context.docName ).emit( 'authorDisconnect', context.authorId );

	context.authorId = data.authorId;
}

function onDisconnect( context ) {
	console.log( 'disconnect ' + context.socket.client.conn.remoteAddress + ' ' + context.socket.handshake.url );
	rebaseServer.updateDocState( context.docName, context.authorId, null, {
		active: false,
		continueBase: null,
		rejections: null
	} );
	docNamespaces.get( context.docName ).emit( 'authorDisconnect', context.authorId );
	logServerEvent( {
		type: 'disconnect',
		doc: context.docName,
		authorId: context.authorId
	} );
}

handlers = {
	submitChange: onSubmitChange,
	changeName: onChangeName,
	changeColor: onChangeColor,
	usurp: onUsurp,
	disconnect: onDisconnect
};

function handleEvent( context, eventName, data ) {
	handlers[ eventName ]( context, data );
}

function makeConnectionHandler( docName ) {
	return function handleConnection( socket ) {
		// Allocate new author ID
		var context = {
				socket: socket,
				docName: docName,
				authorId: 1 + ( lastAuthorForDoc.get( docName ) || 0 )
			},
			eventName;
		lastAuthorForDoc.set( docName, context.authorId );
		logServerEvent( {
			type: 'newClient',
			doc: docName,
			authorId: context.authorId
		} );

		// Kick off welcome process
		welcomeNewClient( socket, docName, context.authorId );

		// Attach event handlers
		for ( eventName in handlers ) {
			// eslint-disable-next-line no-loop-func
			socket.on( eventName, handleEvent.bind( null, context, eventName ) );
		}
		socket.on( 'logEvent', function ( event ) {
			var key,
				ob = {};
			ob.recvTimestamp = Date.now() - startTimestamp;
			ob.clientId = context.authorId;
			ob.doc = docName;
			for ( key in event ) {
				ob[ key ] = event[ key ];
			}
			logEvent( ob );
		} );
	};
}

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

io.on( 'connection', function ( socket ) {
	var nsp,
		docName = socket.handshake.query.docName;

	console.log( 'connection ' + socket.client.conn.remoteAddress + ' ' + socket.handshake.url );
	if ( docName && !docNamespaces.has( docName ) ) {
		nsp = io.of( '/' + docName );
		docNamespaces.set( docName, nsp );
		nsp.on( 'connection', makeConnectionHandler( docName ) );
	}
} );

startTimestamp = Date.now();
logServerEvent( { type: 'restart' } );
http.listen( port );
console.log( 'Listening on ' + port );
