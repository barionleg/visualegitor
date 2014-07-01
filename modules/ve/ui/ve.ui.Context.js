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
 * @abstract
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
	this.visible = false;
	this.inspectors = new ve.ui.InspectorManager( {
		'$': this.$, 'factory': ve.ui.windowFactory, 'modal': false
	} );
};

/* Inheritance */

OO.inheritClass( ve.ui.Context, OO.ui.Element );

/* Methods */

/**
 * Check if context is visible.
 *
 * @return {boolean} Context is visible
 */
ve.ui.Context.prototype.isVisible = function () {
	return this.visible;
};

/**
 * Get the surface the context is being used with.
 *
 * @return {ve.ui.Surface}
 */
ve.ui.Context.prototype.getSurface = function () {
	return this.surface;
};

/**
 * Get inspector window set.
 *
 * @return {OO.ui.WindowManager}
 */
ve.ui.Context.prototype.getInspectors = function () {
	return this.inspectors;
};

/**
 * Destroy the context, removing all DOM elements.
 */
ve.ui.Context.prototype.destroy = function () {
	// Disconnect events
	this.surface.getModel().disconnect( this );
	this.surface.getView().disconnect( this );
	this.inspectors.disconnect( this );

	// Stop timers
	clearTimeout( this.afterModelChangeTimeout );

	this.$element.remove();
	this.inspectors.$element.remove();
	return this;
};

/**
 * Toggle the visibility of the context.
 *
 * @param {boolean} [show] Show the context, omit to toggle
 * @return {jQuery.Promise} Promise resolved when context is finished showing/hiding
 */
ve.ui.Context.prototype.toggle = function ( show ) {
	show = show === undefined ? !this.visible : !!show;
	if ( show !== this.visible ) {
		this.visible = show;
		this.$element.toggle();
	}
	return $.Deferred().resolve().promise();
};
