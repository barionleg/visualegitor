/*!
 * VisualEditor UserInterface SurfaceWindowManager class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Window manager for desktop inspectors.
 *
 * @class
 * @extends ve.ui.WindowManager
 *
 * @constructor
 * @param {ve.ui.Surface} Surface this belongs to
 * @param {Object} [config] Configuration options
 * @cfg {ve.ui.Overlay} [overlay] Overlay to use for menus
 */
ve.ui.SurfaceWindowManager = function VeUiSurfaceWindowManager( surface, config ) {
	// Parent constructor
	ve.ui.SurfaceWindowManager.super.call( this, config );

	// Properties
	this.surface = surface;
};

/* Inheritance */

OO.inheritClass( ve.ui.SurfaceWindowManager, ve.ui.WindowManager );

/* Methods */

/**
 * Override the window manager's directionality method to get the
 * directionality from the surface.
 * @return {string} UI directionality
 */
ve.ui.SurfaceWindowManager.prototype.getDir = function () {
	return this.surface.getDir();
};

/**
 * Get surface.
 *
 * @return {ve.ui.Surface} Surface this belongs to
 */
ve.ui.SurfaceWindowManager.prototype.getSurface = function () {
	return this.surface;
};
