/*global require*/
/*global __dirname*/
/*global Map*/
/*global process*/
/*global console*/
var rebaser, docNamespaces, lastAuthorForDoc, artificialDelay,
	port = 8081,
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	io = require( 'socket.io' )( http ),
	/*jshint -W079 */
	ve = require( '../dist/ve-rebaser.js' ),
	/*jshint +W079 */
	Rebaser = require( './Rebaser' );

function summarize( author, change, selection ) {
	var summary = [];
	summary.push( 'author=' + author );
	if ( change.transactions.length > 0 ) {
		summary.push( change.transactions.length + ' transactions (start ' +
			change.transactionStart + ')' );
	}
	if ( change.store.getLength() > 0 ) {
		summary.push( change.store.getLength() + ' stored values (start ' +
			change.storeStart + ')' );
	}
	if ( selection ) {
		summary.push( 'selection ' + selection.getDescription() );
	}
	return summary.join( ', ' );
}

rebaser = new Rebaser();
docNamespaces = new Map();
lastAuthorForDoc = new Map();
artificialDelay = parseInt( process.argv[ 2 ] ) || 0;

function makeConnectionHandler( docName ) {
	return function handleConnection( socket ) {
		var existingState = rebaser.getStateForDoc( docName ),
			author = 1 + ( lastAuthorForDoc.get( docName ) || 0 );
		lastAuthorForDoc.set( docName, author );
		console.log( 'new client ' + author + ' for ' + docName );
		socket.emit( 'registered', author );
		if ( existingState ) {
			// HACK Catch the client up on the current state by sending it the entire history
			// Ideally we'd be able to initialize the client using HTML, but that's hard, see
			// comments in the /raw handler. Keeping an updated linmod on the server could be
			// feasible if TransactionProcessor was modified to have a "don't sync, just apply"
			// mode and ve.dm.Document was faked with { data: ..., metadata: ..., store: ... }
			socket.emit( 'newUpdate', {
				author: null,
				change: existingState.change.serialize( true ),
				selections: existingState.selections
			} );
		}
		socket.on( 'submitUpdate', setTimeout.bind( null, function ( data ) {
			var change, selection, applied;
			// TODO: validate author ID
			try {
				change = ve.dm.Change.static.deserialize( data.change, true );
				selection = ve.dm.Selection.static.newFromJSON( null, data.selection );
				console.log( 'receive ' + summarize( data.author, change, selection ) );
				applied = rebaser.applyChange( docName, data.author, change, selection );
				if ( applied ) {
					console.log( 'applied ' + summarize( data.author, applied.change, applied.selection ) );
					docNamespaces.get( docName ).emit( 'newUpdate', {
						author: data.author,
						change: applied.change.serialize( true ),
						selections: applied.selections
					} );
				} else {
					console.log( data.author + ' conflict' );
					socket.emit( 'rejectedUpdate', { transactionStart: change.transactionStart } );
				}
			} catch ( error ) {
				console.error( error.stack );
				socket.emit( 'rejectedUpdate', { error: error.toString() } );
			}
		}, artificialDelay ) );
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
console.log( 'Listening on ' + port + ' (artificial delay ' + artificialDelay + ' ms)' );
