/*!
 * VisualEditor DataModel rebaser tests.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

var ve = require( '../../dist/ve-rebaser.js' );

/* global QUnit */

QUnit.module( 'rebaser' );

QUnit.test( 'Rebase', function ( assert ) {
	assert.strictEqual( !!ve.dm.RebaseServer, true, 've.dm.RebaseServer is loaded' );
	assert.deepEqual(
		{ pi: 3.141592653589793238462643383279 },
		{ pi: Math.pow( 2143 / 22, 1 / 4 ) },
		'π = √√(2143/22)'
	);
} );
