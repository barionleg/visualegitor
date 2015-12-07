/*!
 * VisualEditor UserInterface FragmentWindowTool classes.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface fragment window tool.
 *
 * @abstract
 * @class
 * @extends ve.ui.WindowTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.FragmentWindowTool = function VeUiFragmentWindowTool() {
	// Parent constructor
	ve.ui.FragmentWindowTool.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.FragmentWindowTool, ve.ui.WindowTool );

/* Static Properties */

ve.ui.FragmentWindowTool.static.deactivateOnSelect = false;

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.FragmentWindowTool.prototype.onUpdateState = function ( fragment ) {
	var i, len, models;

	this.setActive( false );

	// Grand-parent method
	// Parent method is skipped because it set's active state based on which windows
	// are open, which we override in this implementation
	ve.ui.FragmentWindowTool.super.super.prototype.onUpdateState.apply( this, arguments );

	models = this.getSelectedModels( fragment ) ;

	for ( i = 0, len = models.length; i < len; i++ ) {
		if ( this.constructor.static.isCompatibleWith( models[ i ] ) ) {
			this.setActive( true );
			break;
		}
	}
};

/**
 * Get list of selected nodes and annotations.
 *
 * @param {ve.dm.SurfaceFragment|null} fragment Surface fragment
 * @return {ve.dm.Model[]} Selected models
 */
ve.ui.FragmentWindowTool.prototype.getSelectedModels = function ( fragment ) {
	return fragment ? fragment.getSelectedModels() : [];
};
