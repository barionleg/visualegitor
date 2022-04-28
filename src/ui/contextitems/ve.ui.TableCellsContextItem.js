/*!
 * VisualEditor TableCellsContextItem class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Context item for table cels.
 *
 * @class
 * @extends ve.ui.LinearContextItem
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.TableCellsContextItem = function VeUiTableCellsContextItem( context, model, config ) {
	// Parent constructor
	ve.ui.TableCellsContextItem.super.call( this, context, model, config );

	if ( this.context.isMobile() ) {
		// Use desktop-style label-only button, as otherwise the "edit" button
		// gets collapsed to just the edit icon.
		this.editButton
			.setIcon( null )
			.setInvisibleLabel( false );
	}

	if ( this.context.isMobile() ) {
		this.mergeButton = new OO.ui.ButtonWidget( {
			framed: false,
			label: ve.msg( 'visualeditor-table-merge-cells-merge' ),
			invisibleLabel: true,
			flags: [ 'progressive' ]
		} );
		this.$foot = $( '<div>' );
		this.$bodyAction = $( '<div>' );
	} else {
		// Desktop
		this.mergeButton = new OO.ui.ButtonWidget( {
			label: ve.msg( 'visualeditor-table-merge-cells-merge' ),
			flags: [ 'progressive' ]
		} );
	}
	this.actionButtons.addItems( [ this.mergeButton, this.editButton ] );

	// Events
	this.mergeButton.connect( this, { click: 'onMergeButtonClick' } );

	// Initialization
	this.$element.addClass( 've-ui-tableCellsContextItem' );

	this.editButton.setLabel( ve.msg( 'visualeditor-table-contextitem-properties' ) );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableCellsContextItem, ve.ui.LinearContextItem );

/* Static Properties */

ve.ui.TableCellsContextItem.static.name = 'tableCells';

ve.ui.TableCellsContextItem.static.icon = 'tableMergeCells'; // TODO: Fix icons

ve.ui.TableCellsContextItem.static.label = 'Cell'; // OO.ui.deferMsg( 'visualeditor-table-merge-cells' );

ve.ui.TableCellsContextItem.static.commandName = 'tableCells';

ve.ui.TableCellsContextItem.static.embeddable = false;

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.TableCellsContextItem.static.isCompatibleWith = function ( model ) {
	return model instanceof ve.dm.Node && model.isCellable();
};

/**
 * @inheritdoc
 */
ve.ui.TableCellsContextItem.prototype.setup = function () {
	// Parent method
	ve.ui.TableCellsContextItem.super.prototype.setup.apply( this, arguments );

	// If not disabled, selection must be table and spanning multiple matrix cells
	var selection = this.getFragment().getSurface().getSelection(),
		documentModel = this.getFragment().getDocument(),
		// There's some situations involving transclusion table cells which
		// can make us have a LinearSelection here, so make sure this will
		// work:
		isMergeable = ( selection instanceof ve.dm.TableSelection ) &&
			selection.isMergeable( documentModel ) &&
			!this.isReadOnly(),
		cellCount = selection.getMatrixCells( documentModel ).length;

	this.setLabel( cellCount > 1 ? 'Cells' : 'Cell' );
	this.mergeButton.setDisabled( !isMergeable );
	this.mergeButton.setLabel(
		isMergeable && selection.isSingleCell( documentModel ) ?
			ve.msg( 'visualeditor-table-merge-cells-unmerge' ) :
			ve.msg( 'visualeditor-table-merge-cells-merge' )
	);
};

/**
 * Handle merge button click events.
 */
ve.ui.TableCellsContextItem.prototype.onMergeButtonClick = function () {
	var surface = this.context.getSurface();
	var command = surface.commandRegistry.lookup( 'mergeCells' );

	if ( command ) {
		command.execute( surface, undefined, 'context' );
		this.emit( 'command' );
	}
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.TableCellsContextItem );
