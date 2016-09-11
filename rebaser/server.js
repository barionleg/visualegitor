/*global require*/
/*global __dirname*/
/*global Map*/
/*global console*/
var rebaser, docNamespaces,
	port = 8081,
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	io = require( 'socket.io' )( http ),
	oo = require( 'oojs' ),
	/*jshint -W079 */
	ve = { dm: {} },
	/*jshint +W079 */
	Rebaser = require( './Rebaser' );

require( '../src/dm/ve.dm.IndexValueStore.js' )( ve, oo );
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
		var existingDoc = rebaser.getDoc( docName );
		console.log( 'new client for ' + docName );
		if ( existingDoc ) {
			// HACK Catch the client up on the current state by sending it the entire history
			// Ideally we'd be able to initialize the client using HTML, but that's hard, see
			// comments in the /raw handler. Keeping an updated linmod on the server could be
			// feasible if TransactionProcessor was modified to have a "don't sync, just apply"
			// mode and ve.dm.Document was faked with { data: ..., metadata: ..., store: ... }
			socket.emit( 'newChange', { change: existingDoc } );
		}
		socket.on( 'submitChange', function ( data ) {
			var change, applied;
			try {
				change = ve.dm.Change.static.deserialize( data.change, true );
				console.log( data.author + ' recv ' + summarize( change ) );
				applied = rebaser.applyChange( docName, data.author, change );
				if ( applied ) {
					console.log( data.author + ' applied ' + summarize( applied ) );
					docNamespaces.get( docName ).emit( 'newChange', { author: data.author, change: applied } );
				} else {
					console.log( data.author + ' conflict' );
					socket.emit( 'rejectedChange', { transactionStart: change.transactionStart } );
				}
			} catch ( error ) {
				console.error( error.stack );
				socket.emit( 'rejectedChange', { error: error.toString() } );
			}
		} );
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
	// In order to provide HTML here, we'd need all of ve.dm (Document, Converter, all nodes)
	// and none of that code is likely to work in nodejs without some work because of how heavily
	// it uses the DOM.
	res.status( 401 ).send( 'DOM in nodejs is hard' );
} );

http.listen( port );
console.log( 'Listening on ' + port );
