/*!
 * VisualEditor Logger class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Logger class for logging function entry/exit
 *
 * @class ve.Filibuster
 */

/**
 * @constructor
 * @param {string[]} eventNames List of event Names to listen to
 */
ve.Filibuster = function VeFilibuster() {
	this.stack = [];
	this.count = 0;
	this.states = {};
	this.observers = {};
	this.observations = [];
	this.callLog = [];
	this.active = false;
};

/**
 * Clears logs, without detaching observers
 */
ve.Filibuster.prototype.clearLogs = function () {
	var name;
	this.count = 0;
	for ( name in this.states ) {
		delete this.states[ name ];
	}
	this.observations.length = 0;
	this.callLog.length = 0;
};

ve.Filibuster.prototype.setObserver = function ( name, callback ) {
	this.observers[ name ] = callback;
};

ve.Filibuster.prototype.observe = function ( action ) {
	var name, callback, oldState, newState;
	for ( name in this.observers ) {
		callback = this.observers[ name ];
		oldState = this.states[ name ];
		try {
			newState = callback();
		} catch ( ex ) {
			newState = 'Error: ' + ex;
		}
		if ( oldState !== newState ) {
			this.observations.push( {
				name: name,
				logCount: this.count,
				oldState: oldState,
				newState: newState,
				stack: this.stack.slice(),
				action: action
			} );
			this.states[ name ] = newState;
		}
	}
};

ve.Filibuster.prototype.log = function ( funcName, action, data ) {
	var topFuncName, space;
	if ( !this.active ) {
		return;
	}
	if ( action === 'call' ) {
		this.stack.push( { funcName: funcName, action: action, data: data } );
	}
	space = new Array( this.stack.length ).join( ' ' );
	this.count++;
	this.observe();
	this.callLog.push( {
		count: this.count,
		stack: this.stack.slice(),
		funcName: funcName,
		action: action,
		data: data
	} );
	if ( action !== 'call' ) {
		if ( this.stack.length > 0 ) {
			topFuncName = this.stack[ this.stack.length - 1 ].funcName;
		} else {
			topFuncName = '(none)';
		}
		if ( this.stack.length === 0 || topFuncName !== funcName ) {
			throw new Error(
				'Expected funcName "' + topFuncName + '", got "' + funcName + '"'
			);
		}
		this.stack.pop();
	}
};

ve.Filibuster.prototype.wrapFunction = function ( container, klassName, fnName ) {
	var wrapper, fn, filibuster = this,
		fullName = ( klassName || 'unknown' ) + '.' + fnName;
	fn = container[ fnName ];
	wrapper = function () {
		var returnVal,
			fnReturned = false;
		filibuster.log( fullName, 'call', Array.prototype.slice.call( arguments ) );
		try {
			returnVal = fn.apply( this, arguments );
			fnReturned = true;
			return returnVal;
		} finally {
			if ( fnReturned ) {
				filibuster.log( fullName, 'return', returnVal );
			} else {
				filibuster.log( fullName, 'throw' );
			}
		}
	};
	wrapper.wrappedFunction = fn;
	container[ fnName ] = wrapper;
};

ve.Filibuster.prototype.wrapClass = function ( klass ) {
	var i, len, fnName, fn, fnNames, container;
	container = klass.prototype;
	fnNames = Object.getOwnPropertyNames( container );
	for ( i = 0, len = fnNames.length; i < len; i++ ) {
		fnName = fnNames[i];
		if ( fnName === 'prototype' || fnName === 'constructor' ) {
			continue;
		}
		fn = container[fnName];
		if ( typeof fn !== 'function' || fn.wrappedFunction ) {
			continue;
		}
		this.wrapFunction( container, klass.name, fnName );
	}
};

ve.Filibuster.prototype.wrapNamespace = function ( ns, nsName ) {
	var i, len, propNames, propName, prop, isConstructor;
	propNames = Object.getOwnPropertyNames( ns );
	for ( i = 0, len = propNames.length; i < len; i++ ) {
		propName = propNames[i];
		prop = ns[propName];
		isConstructor = (
			typeof prop === 'function' &&
			!$.isEmptyObject( prop.prototype )
		);
		if ( isConstructor ) {
			this.wrapClass( prop );
		} else if ( typeof prop === 'function' ) {
			this.wrapFunction( ns, nsName, propName );
		} else if ( $.isPlainObject( prop ) ) {
			// might be a namespace; recurse
			this.wrapNamespace( ns, nsName + '.' + propName );
		}
	}
};

/**
 * Start logging
 */
ve.Filibuster.prototype.start = function () {
	this.active = true;
};

/**
 * Stop logging
 */
ve.Filibuster.prototype.stop = function () {
	this.active = false;
};

ve.Filibuster.prototype.getObservationsData = function () {

	function getPlainJson( ob, seen, recurse ) {
		var plainOb;
		if ( seen === undefined ) {
			seen = [];
		}
		if ( recurse === undefined ) {
			recurse = 1;
		}
		if ( recurse === 0 ) {
			return '...';
		}
		if ( Array.isArray( ob ) ) {
			if ( seen.indexOf( ob ) !== -1 ) {
				return '...';
			}
			seen.push( ob );
			plainOb = ob.map( function ( x ) { return getPlainJson( x, seen, recurse - 1 ); } );
		} else if ( typeof ob === 'function' ) {
			return '(function ' + ob.name + ')';
		} else if ( ob === null ) {
			return null;
		} else if ( ob === window ) {
			return '(window)';
		} else if ( typeof ob === 'object' ) {
			if ( seen.indexOf( ob ) !== -1 ) {
				return '...';
			}
			seen.push( ob );
			plainOb = {};
			Object.getOwnPropertyNames( ob ).forEach( function ( k ) {
				plainOb[ k ] = getPlainJson( ob[ k ], seen, recurse - 1 );
			} );
		} else {
			return ob;
		}
		return plainOb;
	}

	function getStackData( stackItem ) {
		return {
			funcName: stackItem.funcName,
			action: stackItem.action,
			data: getPlainJson( stackItem.data )
		};
	}

	function getObservationData( observation ) {
		return {
			name: observation.name,
			logCount: observation.logCount,
			oldState: observation.oldState,
			newState: observation.newState,
			stack: observation.stack.map( getStackData )
		};
	}

	return this.observations.map( getObservationData );
};

ve.Filibuster.prototype.getObservationsHtml = function () {
	function getStackHtml( stackItem ) {
		return [
			stackItem.funcName,
			stackItem.action,
			JSON.stringify( stackItem.data )
		].map( ve.escapeHtml ).join( ' ' );
	}

	function getObservationHtml( observation ) {
		return ( '<tr><td>' +
			[
				observation.name,
				String( observation.logCount ),
				String( observation.oldState ),
				String( observation.newState )
			].map( ve.escapeHtml ).join( '</td><td>' ) +
			'</td><td>' +
			observation.stack.map( getStackHtml ).join( '<br>' ) +
			'</td></tr>'
		);
	}
	return (
		'<table class="ve-filibuster">' +
		'<tr><th>Type</th><th>Log</th><th>Old State</th><th>New State</th><th>Stack</th></tr>' +
		this.getObservationsData().map( getObservationHtml ).join( '' ) +
		'</table>'
	);
};
