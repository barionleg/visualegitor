'use strict';

ve.createDeferred = function () {
	const deferred = {};
	const promise = new Promise( function ( resolve, reject ) {
		deferred.resolve = function ( value ) {
			if ( arguments.length > 1 ) {
				ve.log( 'ES6 Promises can\'t be resolved with more than one argument' );
			}
			resolve.call( this, value );
			return deferred;
		};
		deferred.reject = function ( value ) {
			if ( arguments.length > 1 ) {
				ve.log( 'ES6 Promises can\'t be rejected with more than one argument' );
			}
			reject.call( this, value );
			return deferred;
		};
	} );

	promise.done = function ( f ) {
		return promise.then( f );
	};
	promise.fail = function ( f ) {
		return promise.then( null, f );
	};
	deferred.then = promise.then;
	deferred.always = promise.finally;
	deferred.promise = function () {
		return promise;
	};
	return deferred;
};

ve.createPromise = function ( callback ) {
	return new Promise( callback );
};

ve.promiseAll = Promise.all;
