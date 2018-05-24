/*!
 * VisualEditor UserInterface Table Context class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Context menu for editing tables.
 *
 * Two are usually generated for column and row actions separately.
 *
 * @class
 * @extends ve.ui.Context
 *
 * @constructor
 * @param {ve.ce.TableNode} tableNode
 * @param {string} mode Mode to use, 'col' or 'row'
 * @param {Object} [config] Configuration options
 */
ve.ui.TableLineContext = function VeUiTableLineContext( tableNode, mode, config ) {
	var widget = this,
		surfaceModel = tableNode.surface.getSurface().getModel();

	// tableNode.surface.getSurface()
	// Parent constructor
	ve.ui.TableLineContext.super.call( this, ve.extendObject( {
		icon: mode === 'col' ? 'expand' : 'next',
		indicator: '',
		$overlay: true,
		menu: {
			width: 'auto',
			horizontalPosition: mode === 'col' ? 'center' : 'after',
			verticalPosition: mode === 'col' ? 'below' : 'top'
		}
	}, config ) );

	// Properties
	this.tableNode = tableNode;
	this.mode = mode;
	// this.popup = new OO.ui.PopupWidget( {
	// 	classes: [ 've-ui-tableLineContext-menu' ],
	// 	$container: this.surface.$element,
	// 	$floatableContainer: this.icon.$element,
	// 	position: itemGroup === 'col' ? 'below' : 'after',
	// 	width: 180
	// } );

	var sides = [ 'before', 'after' ],
		actions = [ 'insert', 'move', 'delete' ],
		sideNames = { before: 'Before', after: 'After' },
		actionNames = { insert: 'Add', move: 'Move' },
		modeName = { row: 'Row', col: 'Column' }[ mode ];

	actions.forEach( function ( action ) {
		var actionName = actionNames[ action ];

		if ( action !== 'delete' ) {
			sides.forEach( function ( side ) {
				var sideName = sideNames[ side ];

				widget.menu.addItems( [
					new ve.ui.TableOptionWidget( surfaceModel, action, mode, side, {
						data: {
							commandName: action + modeName + sideName,
							action: action,
							mode: mode,
							side: side
						}
					} )
				] );
			} );
		} else {
			widget.menu.addItems( [
				new ve.ui.TableOptionWidget( surfaceModel, action, mode, null, {
					data: {
						commandName: action + modeName,
						action: action,
						mode: mode
					}
				} )
			] );
		}
	} );

	// Initialization
	// The following classes can be used here:
	// * ve-ui-tableLineContext-col
	// * ve-ui-tableLineContext-row
	this.$element
		.addClass( 've-ui-tableLineContext ve-ui-tableLineContext-' + mode );
	// Visibility is handled by the table overlay
	// this.toggle( true );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableLineContext, OO.ui.DropdownWidget );

/* Static Properties */

ve.ui.TableLineContext.static.groups = {
	col: [ 'insertColumnBefore', 'insertColumnAfter', 'moveColumnBefore', 'moveColumnAfter', 'deleteColumn' ],
	row: [ 'insertRowBefore', 'insertRowAfter', 'moveRowBefore', 'moveRowAfter', 'deleteRow' ]
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.TableLineContext.prototype.onMenuToggle = function ( isVisible ) {
	if ( isVisible ) {
		this.menu.items.forEach( function ( item ) {
			item.update();
		} );
	}
};

/**
 * @inheritdoc
 */
ve.ui.TableLineContext.prototype.onContextItemCommand = function () {
	this.toggleMenu( false );
};

/**
 * Handle model select events
 *
 * @param {ve.dm.Selection} selection
 */
ve.ui.TableLineContext.prototype.onModelSelect = function () {
	this.toggleMenu();
};
