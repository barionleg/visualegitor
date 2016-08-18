var port = 8081,
	express = require( 'express' ),
	bodyParser = require( 'body-parser' ),
	app = express(),
	Rebaser = require( './Rebaser' );

rebaser = new Rebaser();
app.use( express.static( __dirname + '/..' ) );
app.use( bodyParser.json() );
app.post( '/applyChange', function ( req, res ) {
	var response;
	try {
		response = rebaser.applyChange( req.body.doc, req.body.author, req.body.change );
	} catch ( error ) {
		response = { error: error.toString() };
	}
	res.setHeader( 'Content-Type', 'application/json' );
	res.end( JSON.stringify( response ) );
} );
app.listen( port );
console.log( 'Listening on ' + port );
