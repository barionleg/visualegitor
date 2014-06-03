/**
 * Proxy for a tool, displaying information about the current context.
 *
 * Use with ve.ui.ContextWidget.
 *
 * @class
 * @extends OO.ui.OptionWidget
 *
 * @constructor
 * @param {Object} data Item data
 * @param {ve.dm.Node|ve.dm.Annotation} data.model Node or annotation item is related to
 * @param {Function} data.tool Tool item is a proxy for
 * @param {Object} [config] Configuration options
 */
ve.ui.ContextItemWidget = function OoUiContextItemWidget( data, config ) {
	// Config intialization
	config = config || {};

	// Parent constructor
	ve.ui.ContextItemWidget.super.call( this, data, config );

	// Initialization
	this.$element.addClass( 've-ui-contextItemWidget' );
};

/* Setup */

OO.inheritClass( ve.ui.ContextItemWidget, OO.ui.OptionWidget );
