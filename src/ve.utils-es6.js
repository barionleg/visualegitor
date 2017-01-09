/*!
 * VisualEditor ES6 utilities.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-env es6 */

/**
 * Run to completion a thenable-yielding iterator
 *
 * Each value yielded by the iterator is wrapped in a promise, the result of which is fed into
 * iterator.next/iterator.throw . For thenable values, this has the effect of pausing execution
 * until the thenable resolves.
 *
 * @param {Object} iterator An iterator that may yield promises
 * @return {Promise} Promise resolving on the iterator's return/throw value
 */
ve.spawn = function ( iterator ) {
	return new Promise( function ( resolve, reject ) {
		var resumeNext, resumeThrow;
		function resume( method, value ) {
			var result;
			try {
				result = method.call( iterator, value );
				if ( result.done ) {
					resolve( result.value );
				} else {
					Promise.resolve( result.value ).then( resumeNext, resumeThrow );
				}
			} catch ( err ) {
				reject( err );
			}
		}
		resumeNext = result => resume( iterator.next, result );
		resumeThrow = err => resume( iterator.throw, err );
		resumeNext();
	} );
};

/**
 * Wrap a thenable-yielding generator function to make an async function
 *
 * @param {Function} generator A generator function
 * @return {Function} Function returning a promise resolving on the generator's return/throw value
 */
ve.async = function ( generator ) {
	return function () {
		return ve.spawn( generator.apply( this, arguments ) );
	};
};
