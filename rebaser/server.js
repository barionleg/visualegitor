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
	var change, parallel, response;
	try {
		parallel = rebaser.applyChange(
			req.body.doc,
			req.body.author,
			ve.dm.Change.static.deserialize( req.body.change )
		);
		response = {
			change: parallel.serialize()
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
