/*!
 * VisualEditor UserInterface Table Context class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface context.
 *
 * @class
 * @abstract
 * @extends OO.ui.Element
 *
 * @constructor
 * @param {ve.ce.TableNode} surface
 * @param {cfg} config Configuration options
 * @param {string} config.toolSet Set of tools to use, 'col' or 'row'
 * @param {string} config.indicator Indicator to use on button
 */
ve.ui.TableContext = function VeUiTableContext( tableNode, config ) {
	// Parent constructor
	ve.ui.TableContext.super.call( this, config );

	// Properties
	this.tableNode = tableNode;
	this.surface = tableNode.surface.surface;
	this.visible = false;
	this.indicator = new OO.ui.IndicatorWidget( {
		$: this.$,
		classes: ['ve-ui-tableContext-indicator'],
		indicator: config.indicator
	} );
	this.menu = new ve.ui.ContextMenuWidget( { $: this.$ } );
	this.popup = new OO.ui.PopupWidget( {
		$: this.$,
		$container: this.surface.$element,
		width: 150
	} );

	var i, l, tool,
		items = [], toolList = this.constructor.static.toolSets[config.toolSet];

	this.menu.clearItems();
	for ( i = 0, l = toolList.length; i < l; i++ ) {
		tool = ve.ui.toolFactory.lookup( toolList[i] );
		items.push( new ve.ui.ContextItemWidget(
			tool.static.name, tool, this.tableNode.getModel(), { $: this.$ }
		) );
	}
	this.menu.addItems( items );

	// Events
	this.indicator.$element.on( 'mousedown', ve.bind( this.onIndicatorMouseDown, this ) );
	this.menu.connect( this, { choose: 'onContextItemChoose' } );

	// Initialization
	this.menu.$element.addClass( 've-ui-tableContext-menu' );
	this.popup.$body.append( this.menu.$element );
	this.$element.addClass( 've-ui-tableContext' ).append( this.indicator.$element, this.popup.$element );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableContext, OO.ui.Element );

/* Static Properties */

ve.ui.TableContext.static.toolSets = {
	col: [
		'insertColumnBefore',
		'insertColumnAfter',
		'deleteColumn'
	],
	row: [
		'insertRowBefore',
		'insertRowAfter',
		'deleteRow'
	]
};

/* Methods */

/**
 * Handle context item choose events.
 *
 * @param {ve.ui.ContextItemWidget} item Chosen item
 */
ve.ui.TableContext.prototype.onContextItemChoose = function ( item ) {
	if ( item ) {
		item.getCommand().execute( this.surface );
	}
};

ve.ui.TableContext.prototype.onIndicatorMouseDown = function ( e ) {
	e.preventDefault();
	this.toggle();
};

ve.ui.TableContext.prototype.toggle = function () {
	this.popup.toggle();
	if ( this.popup.isVisible() ) {
		this.surface.getModel().once( 'select', ve.bind( this.toggle, this ) );
	}
};
