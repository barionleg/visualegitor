var port = 8081,
	express = require( 'express' ),
	bodyParser = require( 'body-parser' ),
	app = express(),
	Collab = require( './Collab' );

collab = new Collab();
app.use( express.static( __dirname + '/..' ) );
app.use( bodyParser.json() );
app.post( '/applyChange', function ( req, res ) {
	var response;
	try {
		response = collab.applyChange( req.body.doc, req.body.author, req.body.change );
	} catch ( error ) {
		response = { error: error.toString() };
	}
	res.setHeader( 'Content-Type', 'application/json' );
	res.end( JSON.stringify( response ) );
} );
app.listen( port );
console.log( 'Listening on ' + port );
