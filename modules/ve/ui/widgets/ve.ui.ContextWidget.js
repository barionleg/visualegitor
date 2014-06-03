/**
 * List of context items, displaying information about the current context.
 *
 * Use with ve.ui.ContextItemWidget.
 *
 * @class
 * @extends OO.ui.SelectWidget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.ContextWidget = function OoUiContextWidget( config ) {
	// Config intialization
	config = config || {};

	// Parent constructor
	ve.ui.ContextWidget.super.call( this, config );

	// Initialization
	this.$element.addClass( 've-ui-contextWidget' );
};

/* Setup */

OO.inheritClass( ve.ui.ContextWidget, OO.ui.SelectWidget );
