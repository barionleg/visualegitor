var port = 8081,
	express = require( 'express' ),
	bodyParser = require( 'body-parser' ),
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
app.use( express.static( __dirname + '/..' ) );
app.use( bodyParser.json() );
app.post( '/applyChange', function ( req, res ) {
	var change, parallel, response;
	try {
		change = ve.dm.Change.static.deserialize( req.body.change, true );
		parallel = rebaser.applyChange(
			req.body.doc,
			req.body.author,
			change
		)[ 0 ];
		if ( change.transactions.length > 0 || parallel.transactions.length > 0 ) {
			console.log( 'recv ' + req.body.author + ' ' + summarize( change ) );
			console.log( 'send ' + req.body.author + ' ' + summarize( parallel ) );
		}
		response = {
			change: parallel.serialize( true )
		};
	} catch ( error ) {
		console.log( error.stack );
		response = { error: error.toString() };
	}
	res.setHeader( 'Content-Type', 'application/json' );
	res.end( JSON.stringify( response ) );
} );

io.on( 'connection', function( socket ) {
	socket.on( 'submitChange', function ( data ) {
		var change, applyResult, parallel, applied;
		try {
			change = ve.dm.Change.static.deserialize( data.change, true );
			console.log( '[socket] ' + data.author + ' recv ' + summarize( change ) );
			applyResult = rebaser.applyChange( data.doc, data.author, change );
			parallel = applyResult[ 0 ];
			console.log( '[socket] ' + data.author + ' parallel ' + summarize( parallel ) );
			applied = applyResult[ 1 ];
			if ( applied ) {
				console.log( '[socket] ' + data.author + ' applied ' + summarize( applied ) );
				io.emit( 'newChange', { doc: data.doc, author: data.author, change: applied } );
				socket.emit( 'receivedChange', { doc: data.doc, parallel: parallel, applied: applied } );
			} else {
				console.log( '[socket] ' + data.author + ' conflict' );
				socket.emit( 'receivedChange', { doc: data.doc, parallel: parallel, applied: false } );
			}
		} catch ( error ) {
			console.error( error.stack );
			socket.emit( 'receivedChange', { doc: data.doc, error: error.toString() } );
		}
	})
} );

http.listen( port );
console.log( 'Listening on ' + port );
