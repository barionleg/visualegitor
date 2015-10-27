/*!
 * VisualEditor KeyDownHandlerFactory class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Key down handler factory.
 *
 * @class
 * @extends OO.Factory
 * @constructor
 */
ve.ce.KeyDownHandlerFactory = function VeUiKeyDownHandlerFactory() {
	// Parent constructor
	ve.ce.KeyDownHandlerFactory.super.apply( this, arguments );

	// Handlers which match all kinds and a specific type
	this.handlerNamesByKeys = {};
};

/* Inheritance */

OO.inheritClass( ve.ce.KeyDownHandlerFactory, OO.Factory );

/* Methods */

/**
 * @inheritdoc
 */
ve.ce.KeyDownHandlerFactory.prototype.register = function ( constructor ) {
	var i, ilen, keys, name;

	// Parent method
	ve.ce.KeyDownHandlerFactory.super.prototype.register.call( this, constructor );

	keys = constructor.static.keys;
	name = constructor.static.name;

	for ( i = 0, ilen = keys.length; i < ilen; i++ ) {
		this.handlerNamesByKeys[ keys[ i ] ] = this.handlerNamesByKeys[ keys[ i ] ] || [];
		this.handlerNamesByKeys[ keys[ i ] ].push( name );
	}
};

/**
 * Get the handler for a specific key
 *
 * @param {number} key Key code
 * @param {string} selectionName Selection type nane
 * @return {Function[]} Matched handlers
 */
ve.ce.KeyDownHandlerFactory.prototype.lookupHandlersForKey = function ( key, selectionName ) {
	var i, constructor, supportedSelections,
		constructors = [],
		names = this.handlerNamesByKeys[ key ] || [];

	// Length is likely to be 1 or 0 so don't cache
	for ( i = 0; i < names.length; i++ ) {
		constructor = this.registry[ names[ i ] ];
		supportedSelections = constructor.static.supportedSelections;
		if ( !supportedSelections || supportedSelections.indexOf( selectionName ) !== -1 ) {
			constructors.push( constructor );
		}
	}

	return constructors;
};

/**
 * Execute the handlers for a specific key
 *
 * @param {number} key Key code
 * @param {string} selectionName Selection type nane
 * @param {ve.ce.Surface} surface Surface
 * @param {jQuery} e Key down event
 * @return {boolean} Some handlers were executed
 */
ve.ce.KeyDownHandlerFactory.prototype.executeHandlersForKey = function ( key, selectionName, surface, e ) {
	var i,
		handlers = this.lookupHandlersForKey( key, selectionName );

	// Length is likely to be 1 or 0 so don't cache
	for ( i = 0; i < handlers.length; i++ ) {
		handlers[ i ].static.execute( surface, e );
	}

	return !!handlers.length;
};

/* Initialization */

ve.ce.keyDownHandlerFactory = new ve.ce.KeyDownHandlerFactory();
