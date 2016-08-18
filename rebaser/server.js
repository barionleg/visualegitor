/*global require*/
/*global __dirname*/
/*global console*/
var rebaser,
	port = 8081,
	express = require( 'express' ),
	bodyParser = require( 'body-parser' ),
	app = express(),
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
app.use( bodyParser.json() );
app.post( '/applyChange', function ( req, res ) {
	var change, parallel, response;
	try {
		change = VE.dm.Change.static.deserialize( req.body.change, true );
		parallel = rebaser.applyChange(
			req.body.doc,
			req.body.author,
			change
		);
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
app.listen( port );
console.log( 'Listening on ' + port );
