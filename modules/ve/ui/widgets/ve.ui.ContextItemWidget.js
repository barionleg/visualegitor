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
 * @param {Function} tool Tool item is a proxy for
 * @param {ve.dm.Node|ve.dm.Annotation} model Node or annotation item is related to
 * @param {Object} [config] Configuration options
 */
ve.ui.ContextItemWidget = function OoUiContextItemWidget( data, tool, model, config ) {
	// Config intialization
	config = config || {};

	// Parent constructor
	ve.ui.ContextItemWidget.super.call( this, data, config );

	// Properties
	this.tool = tool;
	this.model = model;

	// Initialization
	this.$element.addClass( 've-ui-contextItemWidget' );
	this.setIcon( this.tool.static.icon );
	this.setLabel( this.getDescription() );
};

/* Setup */

OO.inheritClass( ve.ui.ContextItemWidget, OO.ui.OptionWidget );

/* Methods */

ve.ui.ContextItemWidget.prototype.getDescription = function () {
	var description;

	if ( this.model instanceof ve.dm.Annotation ) {
		description = ve.ce.annotationFactory.getDescription( this.model );
	} else if ( this.model instanceof ve.dm.Node ) {
		description = ve.ce.nodeFactory.getDescription( this.model );
	}
	if ( !description ) {
		description = this.tool.static.title;
	}

	return description;
};

ve.ui.ContextItemWidget.prototype.getCommand = function () {
	return ve.ui.commandRegistry.lookup( this.tool.static.commandName );
};
