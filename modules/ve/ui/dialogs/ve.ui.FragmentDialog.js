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
 * @extends OO.ui.ProcessDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.FragmentDialog = function VeUiDialog( manager, config ) {
	// Parent constructor
	ve.ui.FragmentDialog.super.call( this, manager, config );

	// Properties
	this.fragment = null;
};

/* Inheritance */

OO.inheritClass( ve.ui.FragmentDialog, OO.ui.ProcessDialog );

/**
 * @inheritdoc
 */
ve.ui.FragmentDialog.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return ve.ui.FragmentDialog.super.prototype.getSetupProcess.apply( this, data )
		.first( function () {
			if ( !( data.fragment instanceof ve.dm.SurfaceFragment ) ) {
				throw new Error( 'Cannot open dialog: opening data must contain a fragment' );
			}
			this.fragment = data.fragment;
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.FragmentDialog.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.FragmentDialog.super.prototype.getTeardownProcess.apply( this, data )
		.next( function () {
			// Restore selection
			// HACK: Integration is a mess, and to prevent teardown being called multiple times we
			// need to rethink a whole lot of it, and spend a fair amount of time rewriting it - but
			// instead of doing all of that, we can just put this band aid (checking if there is a
			// fragment before calling select on it) and closed bug 63954 for now.
			if ( this.fragment ) {
				this.fragment.select();
			}
			this.fragment = null;
		}, this );
};

/**
 * Get the surface fragment the dialog is for
 *
 * @returns {ve.dm.SurfaceFragment|null} Surface fragment the dialog is for, null if the dialog is closed
 */
ve.ui.FragmentDialog.prototype.getFragment = function () {
	return this.fragment;
};
