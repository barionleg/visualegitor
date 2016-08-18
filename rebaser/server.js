var port = 8081,
	express = require( 'express' ),
	bodyParser = require( 'body-parser' ),
	app = express(),
	Rebaser = require( './Rebaser' ),
	ve = { dm: {} };

require( '../src/dm/ve.dm.IndexValueStore.js' )( ve );
require( '../src/dm/ve.dm.Transaction' )( ve );
require( '../src/dm/ve.dm.Change' )( ve );

rebaser = new Rebaser();
app.use( express.static( __dirname + '/..' ) );
app.use( bodyParser.json() );
app.post( '/applyChange', function ( req, res ) {
	var response;
	try {
		response = rebaser.applyChange(
			req.body.doc,
			req.body.author,
			new ve.dm.Change(
				req.body.change.start,
				req.body.change.transactions.map( function ( ops ) {
					return new ve.dm.Transaction( null, ops );
				} )
			)
		);
	} catch ( error ) {
		console.log( error.stack );
		response = { error: error.toString() };
	}
	res.setHeader( 'Content-Type', 'application/json' );
	res.end( JSON.stringify( response ) );
} );
app.listen( port );
console.log( 'Listening on ' + port );
