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
		this.handlerNamesByKeys[ keys[ i ] ] = name;
	}
};

/**
 * Get the handler for a specific key
 *
 * @param {number} key Key code
 * @param {string} selectionName Selection type nane
 * @return {Function|undefined} Handler, or undefined if not found
 */
ve.ce.KeyDownHandlerFactory.prototype.lookupHandlerForKey = function ( key, selectionName ) {
	var constructor, supportedSelections,
		name = this.handlerNamesByKeys[ key ];

	if ( name ) {
		constructor = this.registry[ name ];
		supportedSelections = constructor.static.supportedSelections;
		if ( !supportedSelections || supportedSelections.indexOf( selectionName ) !== -1 ) {
			return constructor;
		}
	}

	// No matching handler
	return;
};

/* Initialization */

ve.ce.keyDownHandlerFactory = new ve.ce.KeyDownHandlerFactory();
