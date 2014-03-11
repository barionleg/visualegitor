/*!
 * VisualEditor UserInterface Context class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * UserInterface context.
 *
 * @class
 * @extends OO.ui.Element
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Configuration options
 */
ve.ui.Context = function VeUiContext( surface, config ) {
	// Parent constructor
	OO.ui.Element.call( this, config );

	// Properties
	this.surface = surface;
	this.inspectors = new ve.ui.WindowSet( surface, ve.ui.inspectorFactory );
};

/* Inheritance */

OO.inheritClass( ve.ui.Context, OO.ui.Element );

/* Methods */

/**
 * Gets the surface the context is being used in.
 *
 * @method
 * @returns {ve.ui.Surface} Surface of context
 */
ve.ui.Context.prototype.getSurface = function () {
	return this.surface;
};

/**
 * Gets an inspector.
 *
 * @method
 * @param {string} Symbolic name of inspector
 * @returns {ve.ui.Inspector|undefined} Inspector or undefined if none exists by that name
 */
ve.ui.Context.prototype.getInspector = function ( name ) {
	return this.inspectors.getWindow( name );
};

/**
 * Destroy the context, removing all DOM elements.
 *
 * @method
 * @returns {ve.ui.Context} Context UserInterface
 * @chainable
 */
ve.ui.Context.prototype.destroy = function () {
	this.$element.remove();
	return this;
};

/**
 * Hides the context. Noop by default.
 *
 * @method
 * @chainable
 */
ve.ui.Context.prototype.hide = function () {
	return this;
};
