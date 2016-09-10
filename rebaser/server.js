/*global require*/
/*global __dirname*/
/*global console*/
var rebaser,
	port = 8081,
	express = require( 'express' ),
	app = express(),
	http = require( 'http' ).Server( app ),
	io = require( 'socket.io' )( http ),
	Rebaser = require( './Rebaser' ),
	VE = { dm: {} };

require( '../src/dm/ve.dm.IndexValueStore.js' )( VE );
require( '../src/dm/ve.dm.Transaction' )( VE );
require( '../src/dm/ve.dm.Change' )( VE );

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
app.use( express.static( __dirname + '/..' ) );

io.on( 'connection', function( socket ) {
	socket.on( 'submitChange', function ( data ) {
		var change, applied;
		try {
			change = VE.dm.Change.static.deserialize( data.change, true );
			console.log( '[socket] ' + data.author + ' recv ' + summarize( change ) );
			applied = rebaser.applyChange( data.doc, data.author, change );
			if ( applied ) {
				console.log( '[socket] ' + data.author + ' applied ' + summarize( applied ) );
				// TODO we need a group for each document
				io.emit( 'newChange', { doc: data.doc, author: data.author, change: applied } );
			} else {
				console.log( '[socket] ' + data.author + ' conflict' );
				socket.emit( 'rejectedChange', { doc: data.doc, transactionStart: change.transactionStart } );
			}
		} catch ( error ) {
			console.error( error.stack );
			socket.emit( 'rejectedChange', { doc: data.doc, error: error.toString() } );
		}
	})
} );

http.listen( port );
console.log( 'Listening on ' + port );
