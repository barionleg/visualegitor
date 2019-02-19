/*!
 * VisualEditor user interface FragmentWindow class.
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Mixin for window for working with fragments of content.
 *
 * @class
 * @abstract
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.FragmentWindow = function VeUiFragmentWindow() {
	// Properties
	this.fragment = null;
};

/* Inheritance */

OO.initClass( ve.ui.FragmentWindow );

/* Methods */

/**
 * Get the surface fragment the window is for.
 *
 * @return {ve.dm.SurfaceFragment|null} Surface fragment the window is for, null if the
 *   window is closed
 */
ve.ui.FragmentWindow.prototype.getFragment = function () {
	return this.fragment;
};

/**
 * @inheritdoc OO.ui.Window
 * @throws {Error} If fragment was not provided through data parameter
 */
ve.ui.FragmentWindow.prototype.getSetupProcess = function ( data, process ) {
	data = data || {};
	return process.first( function () {
		if ( !( data.fragment instanceof ve.dm.SurfaceFragment ) ) {
			throw new Error( 'Cannot open dialog: opening data must contain a fragment' );
		}
		this.fragment = data.fragment;
		this.previousSelection = this.fragment.getSelection();
	}, this ).next( function () {
		this.actions.setMode( this.getMode() );
	}, this );
};

/**
 * @inheritdoc OO.ui.Window
 */
ve.ui.FragmentWindow.prototype.getTeardownProcess = function ( data, process ) {
	return process.next( function () {
		this.fragment = null;
		this.previousSelection = null;
	}, this );
};

/**
 * Get a symbolic mode name.
 *
 * By default will return 'edit' if #isEditing is true, and 'insert' otherwise.
 *
 * @return {string} Symbolic mode name
 */
ve.ui.FragmentWindow.prototype.getMode = function () {
	if ( this.getFragment() ) {
		return this.isEditing() ? 'edit' : 'insert';
	}
	return '';
};

/**
 * Check if the current fragment is editable by this window.
 *
 * @localdoc Returns true if the fragment being edited selects at least one model,
 *
 * @return {boolean} Fragment is editable by this window
 */
ve.ui.FragmentWindow.prototype.isEditing = function () {
	return !!this.fragment.getSelectedModels().length;
};
