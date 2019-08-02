/**
 * VisualEditor extensions to OO.EventEmitter class: tests
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 'OO.EventEmitter' );

QUnit.test( 'emit', function ( assert ) {
	var x,
		origSetTimeout = window.setTimeout,
		ee = new OO.EventEmitter();

	// Stub setTimeout for coverage purposes
	window.setTimeout = function ( fn ) {
		assert.throws( fn, 'Error in a callback is thrown' );
	};

	try {
		x = 0;
		ee.on( 'multiple-error', function () {
			x++;
		} );
		ee.on( 'multiple-error', function () {
			throw new Error( 'This is an unhandled error' );
		} );
		ee.on( 'multiple-error', function () {
			x++;
		} );
		ee.emit( 'multiple-error' );
		assert.strictEqual( x, 2, 'One callback throwing an error won\'t interfere with other callbacks' );
	} finally {
		// Restore it
		window.setTimeout = origSetTimeout;
	}
} );
