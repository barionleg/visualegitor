/*!
 * VisualEditor UserInterface Dialog class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Dialog with an associated surface fragment.
 *
 * @class
 * @abstract
 * @extends OO.ui.Dialog
 *
 * @constructor
 * @param {ve.dm.SurfaceFragment} fragment Surface fragment the dialog is for
 * @param {Object} [config] Configuration options
 */
ve.ui.Dialog = function VeUiDialog( fragment, config ) {
	// Parent constructor
	OO.ui.Dialog.call( this, config );

	// Properties
	this.fragment = fragment;
};

/* Inheritance */

OO.inheritClass( ve.ui.Dialog, OO.ui.Dialog );

/**
 * Get the surface fragment the inspector is for
 * @returns {ve.dm.SurfaceFragment} Surface fragment the inspector is for
 */
ve.ui.Dialog.prototype.getFragment = function () {
	return this.fragment;
};
