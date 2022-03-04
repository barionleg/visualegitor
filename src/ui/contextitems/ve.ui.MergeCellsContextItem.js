/*!
 * VisualEditor MergeCellsContextItem class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Context item for mergeable cels.
 *
 * @class
 * @extends ve.ui.LinearContextItem
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.MergeCellsContextItem = function VeUiMergeCellsContextItem( context, model, config ) {
	// Parent constructor
	ve.ui.MergeCellsContextItem.super.call( this, context, model, config );

	this.dimensions = new OO.ui.LabelWidget( {
		classes: [ 've-ui-mergeCellsContextItem-dimensions' ]
	} );

	// Initialization
	this.$element.addClass( 've-ui-mergeCellsContextItem' );
	this.$title.append( this.dimensions.$element );
};

/* Inheritance */

OO.inheritClass( ve.ui.MergeCellsContextItem, ve.ui.LinearContextItem );

/* Static Properties */

ve.ui.MergeCellsContextItem.static.name = 'mergeCells';

ve.ui.MergeCellsContextItem.static.icon = 'tableMergeCells';

ve.ui.MergeCellsContextItem.static.label = OO.ui.deferMsg( 'visualeditor-table-merge-cells' );

ve.ui.MergeCellsContextItem.static.commandName = 'mergeCells';

ve.ui.MergeCellsContextItem.static.deletable = false;

ve.ui.MergeCellsContextItem.static.embeddable = false;

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MergeCellsContextItem.static.isCompatibleWith = function ( model ) {
	return model instanceof ve.dm.Node && model.isCellable();
};

/**
 * @inheritdoc
 */
ve.ui.MergeCellsContextItem.prototype.setup = function () {
	// If not disabled, selection must be table and spanning multiple matrix cells
	var selection = this.getFragment().getSurface().getSelection(),
		documentModel = this.getFragment().getDocument(),
		// There's some situations involving transclusion table cells which
		// can make us have a LinearSelection here, so make sure this will
		// work:
		isMergeable = ( selection instanceof ve.dm.TableSelection ) &&
			selection.isMergeable( documentModel ) &&
			!this.isReadOnly();

	this.dimensions.setLabel(
		selection.getColCount() +
		ve.msg( 'visualeditor-dimensionswidget-times' ) +
		selection.getRowCount()
	);
	this.editButton.setLabel(
		selection.isSingleCell( documentModel ) ?
			ve.msg( 'visualeditor-table-merge-cells-unmerge' ) :
			ve.msg( 'visualeditor-table-merge-cells-merge' )
	);
	this.editButton.setDisabled( !isMergeable );
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.MergeCellsContextItem );
