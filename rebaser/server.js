var port = 8081,
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	io = require( 'socket.io' )( http ),
	Rebaser = require( './Rebaser' ),
	ve = { dm: {} };

require( '../src/dm/ve.dm.IndexValueStore.js' )( ve );
require( '../src/dm/ve.dm.Transaction' )( ve );
require( '../src/dm/ve.dm.Change' )( ve );

function summarize( change ) {
	var summary = [];
	if ( change.transactions.length > 0 ) {
		summary.push( change.transactions.length + ' transactions (start ' +
			change.transactionStart + ')' );
	}
	if ( change.store.getLength() > 0 ) {
		summary.push( change.store.getLength() + ' stored values (start ' +
			change.storeStart + ')' );
	}
	return summary.join( ', ' );
}

rebaser = new Rebaser();
docNamespaces = new Map();

function makeConnectionHandler( docName ) {
	return function handleConnection( socket ) {
		// HACK Catch the client up on the current state by sending it the entire history
		// TODO replace with sending just the current state
		console.log( 'new client for ' + docName );
		var existingDoc = rebaser.getDoc( docName );
		if ( existingDoc ) {
			socket.emit( 'newChange', {change: existingDoc } );
		}
		socket.on( 'submitChange', function ( data ) {
			var change, applied;
			try {
				change = ve.dm.Change.static.deserialize( data.change, true );
				console.log( '[socket] ' + data.author + ' recv ' + summarize( change ) );
				applied = rebaser.applyChange( docName, data.author, change );
				if ( applied ) {
					console.log( '[socket] ' + data.author + ' applied ' + summarize( applied ) );
					docNamespaces.get( docName ).emit( 'newChange', { author: data.author, change: applied } );
				} else {
					console.log( '[socket] ' + data.author + ' conflict' );
					socket.emit( 'rejectedChange', { transactionStart: change.transactionStart } );
				}
			} catch ( error ) {
				console.error( error.stack );
				socket.emit( 'rejectedChange', { error: error.toString() } );
			}
		})
	};
}

app.use( express.static( __dirname + '/..' ) );
app.set( 'view engine', 'ejs' );

app.get( '/doc/edit/:docName', function ( req, res ) {
	var nsp,
		docName = req.params.docName;
	if ( !docNamespaces.has( docName ) ) {
		nsp = io.of( '/' + docName );
		docNamespaces.set( docName, nsp );
		nsp.on( 'connection', makeConnectionHandler( docName ) );
	}
	res.render( 'editor', { docName: docName } );
} );

app.get( '/doc/raw/:docName', function ( req, res ) {
	// TODO return real data
	res.send( '' );
} );



http.listen( port );
console.log( 'Listening on ' + port );
