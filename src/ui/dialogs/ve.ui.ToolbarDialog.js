/*!
 * VisualEditor UserInterface ToolbarDialog class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Toolbar dialog.
 *
 * @class
 * @abstract
 * @extends OO.ui.Dialog
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Configuration options
 */
ve.ui.ToolbarDialog = function VeUiToolbarDialog( config ) {
	// Parent constructor
	ve.ui.ToolbarDialog.super.call( this, config );

	// Pre-initialization
	// This class needs to exist before setup to constrain the height
	// of the dialog when it first loads.
	this.$element.addClass( 've-ui-toolbarDialog' );
};

/* Inheritance */

OO.inheritClass( ve.ui.ToolbarDialog, OO.ui.Dialog );

/* Static Properties */

ve.ui.ToolbarDialog.static.size = 'full';

ve.ui.ToolbarDialog.static.activeSurface = true;

/* Methods */

/**
 * Get the surface fragment the dialog opened with
 *
 * @returns {ve.dm.SurfaceFragment|null} Surface fragment the dialog opened with, null if the
 *   dialog is closed
 */
ve.ui.ToolbarDialog.prototype.getFragment = function () {
	return this.fragment;
};

/**
 * @inheritdoc
 */
ve.ui.ToolbarDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.ToolbarDialog.super.prototype.initialize.call( this );

	this.$content.addClass( 've-ui-toolbarDialog-content' );
};

/**
 * @inheritdoc
 */
ve.ui.ToolbarDialog.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return ve.ui.ToolbarDialog.super.prototype.getSetupProcess.call( this, data )
		.first( function () {
			if ( !( data.fragment instanceof ve.dm.SurfaceFragment ) ) {
				throw new Error( 'Cannot open inspector: opening data must contain a fragment' );
			}
			this.fragment = data.fragment;
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.ToolbarDialog.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.ToolbarDialog.super.prototype.getTeardownProcess.apply( this, data )
		.next( function () {
			this.fragment = null;
		}, this );
};
