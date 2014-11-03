/*!
 * VisualEditor UserInterface file drop handler class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * File drop handler.
 *
 * @class
 * @abstract
 *
 * @constructor
 * @param {ve.ui.Surface} surface Surface
 * @param {File} file File to handle
 */
ve.ui.FileDropHandler = function VeUiFileDropHandler( surface, file ) {
	// Properties
	this.surface = surface;
	this.file = file;
};

/* Inheritance */

OO.initClass( ve.ui.FileDropHandler );

/* Static properties */

/**
 * Symbolic name for this handler. Must be unique.
 *
 * @static
 * @property {string}
 * @inheritable
 */
ve.ui.FileDropHandler.static.name = null;

/**
 * List of mime types supported by this handler
 *
 * @static
 * @property {string[]}
 * @inheritable
 */
ve.ui.FileDropHandler.static.types = [];

/* Methods */

/**
 * Insert the file at a specified fragment
 *
 * @param {ve.dm.SurfaceFragment} fragment Fragment to insert at
 */
ve.ui.FileDropHandler.prototype.insert = function () {
	throw new Error( 've.ui.FileDropHandler subclass must implement insert' );
};
