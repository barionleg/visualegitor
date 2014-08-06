/*global console */
/*!
 * VisualEditor debugging methods.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * @property {boolean} debug
 * @member ve
 */
ve.debug = true;

/**
 * Change the definition of "connect" so that it does late binding on method names.
 *
 * This is necessary so that ve.Filibuster can redefine functions after bindings have
 * been applied. It's pretty horrible though, because it makes debug mode more different
 * from production mode.
 */
OO.EventEmitter.prototype.connect = ( function ( connect ) {
	return function ( context, methods ) {
		var eventName, method,
			eventEmitter = this,
			wrappedMethods = {};

		/**
		 * Create a wrapper that looks up context[ method ] at call time
		 */
		function makeWrapper( method ) {
			return function () {
				return context[ method ].apply( context, arguments );
			};
		}

		// bind names late
		for ( eventName in methods ) {
			method = methods[ eventName ];
			if ( typeof method !== 'string' ) {
				// the name is already bound; cannot wrap :-(
				throw new Error( 'Early binding detected: ', context, method );
			}
			// bind name at call time
			wrappedMethods[ eventName ] = makeWrapper( method );
		}
		return connect.call( eventEmitter, context, wrappedMethods );
	};
} ( OO.EventEmitter.prototype.connect ) );

/**
 * @class ve.debug
 * @override ve
 * @singleton
 */

/* Methods */

/**
 * Logs data to the console.
 *
 * @method
 * @param {Mixed...} [data] Data to log
 */
ve.log = function () {
	// In IE9 console methods are not real functions and as such do not inherit
	// from Function.prototype, thus console.log.apply does not exist.
	// However it is function-like enough that passing it to Function#apply does work.
	Function.prototype.apply.call( console.log, console, arguments );
};

/**
 * Logs error to the console.
 *
 * @method
 * @param {Mixed...} [data] Data to log
 */
ve.error = function () {
	// In IE9 console methods are not real functions and as such do not inherit
	// from Function.prototype, thus console.error.apply does not exist.
	// However it is function-like enough that passing it to Function#apply does work.
	Function.prototype.apply.call( console.error, console, arguments );
};

/**
 * Logs an object to the console.
 *
 * @method
 * @param {Object} obj Object to log
 */
ve.dir = function () {
	Function.prototype.apply.call( console.dir, console, arguments );
};
