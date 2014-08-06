/*!
 * VisualEditor Logger class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Logger class for logging function entry/exit
 *
 * @class ve.Logger
 */

/**
 * @constructor
 * @param {string[]} eventNames List of event Names to listen to
 */
ve.Logger = function VeLogger() {
	this.clear();
};

ve.Logger.prototype.clear = function () {
	this.stack = [];
	this.count = 0;
	this.states = {};
	this.observers = {};
	this.observations = [];
	this.callLog = [];
};

ve.Logger.prototype.setObserver = function ( name, callback ) {
	this.observers[ name ] = callback;
};

ve.Logger.prototype.observe = function ( action ) {
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

ve.Logger.prototype.log = function ( funcName, action, data ) {
	var topFuncName, space;
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

ve.Logger.prototype.wrapFunction = function ( container, klassName, fnName ) {
	var wrapper, fn, logger = this,
		fullName = ( klassName || 'unknown' ) + '.' + fnName;
	fn = container[ fnName ];
	wrapper = function () {
		var returnVal,
			fnReturned = false;
		logger.log( fullName, 'call', arguments );
		try {
			returnVal = fn.apply( this, arguments );
			fnReturned = true;
			return returnVal;
		} finally {
			if ( fnReturned ) {
				logger.log( fullName, 'return', returnVal );
			} else {
				logger.log( fullName, 'throw' );
			}
		}
	};
	wrapper.wrappedFunction = fn;
	container[ fnName ] = wrapper;
};

ve.Logger.prototype.wrapClass = function ( klass ) {
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

ve.Logger.prototype.wrapNamespace = function ( ns, nsName ) {
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
 * Start logging, disabling surfaceObserver if passed
 * XXX usage:
 *   x = new ve.Logger(); x.start( ve.instances[0].view.surfaceObserver )
 *   x.setObserver('docmodel', function () { return JSON.stringify(ve.instances[0].model.documentModel.data.data); })
 *
 * @param {SurfaceObserver|undefined} surfaceObserver SurfaceObserver to disable
 */
ve.Logger.prototype.start = function ( surfaceObserver ) {
	if ( surfaceObserver ) {
		surfaceObserver.setTimeout = function () {};
		if ( surfaceObserver.timeoutId ) {
			clearTimeout( surfaceObserver.timeoutId );
			surfaceObserver.timeoutId = null;
		}
	}
	this.wrapNamespace( ve.ce, 've.ce' );
	this.wrapNamespace( ve.dm, 've.dm' );
	this.wrapNamespace( ve.ui, 've.ui' );
};
