/*!
 * VisualEditor EventEmitter class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * EventEmitter class.
 *
 * @class
 * @abstract
 * @mixins OO.EventEmitter
 * @constructor
 */
ve.EventEmitter = function VeEventEmitter() {
	// Mix-in constructor
	OO.EventEmitter.apply( this, arguments );
};

OO.mixinClass( ve.EventEmitter, OO.EventEmitter );

/* Methods */

/**
 * Emit an event, catching (and ignoring) errors in handlers
 *
 * @param {string} event Type of event
 * @param {...Mixed} args First in a list of variadic arguments passed to event handler (optional)
 * @return {boolean} Whether the event was handled by at least one listener
 */
ve.EventEmitter.prototype.emitCatch = function () {
	// TODO: Consider wrapping each handler call in a separate try/catch
	try {
		return this.emit.apply( this, arguments );
	} catch ( ex ) {
		return true;
	}
};
