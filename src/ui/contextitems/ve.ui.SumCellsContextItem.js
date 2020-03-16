/*!
 * VisualEditor SumCellsContextItem class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Show the sum and average of numeric values across a table selection.
 *
 * @class
 * @extends ve.ui.LinearContextItem
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.SumCellsContextItem = function VeUiSumCellsContextItem( context, model, config ) {
	// Parent constructor
	ve.ui.SumCellsContextItem.super.call( this, context, model, config );

	// Initialization
	this.$element.addClass( 've-ui-sumCellsContextItem' );
};

/* Inheritance */

OO.inheritClass( ve.ui.SumCellsContextItem, ve.ui.LinearContextItem );

/* Static Properties */

ve.ui.SumCellsContextItem.static.name = 'sumCells';

ve.ui.SumCellsContextItem.static.icon = 'mathematics';

ve.ui.SumCellsContextItem.static.editable = false;

ve.ui.SumCellsContextItem.static.deletable = false;

ve.ui.SumCellsContextItem.static.embeddable = false;

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.SumCellsContextItem.static.isCompatibleWith = function ( model ) {
	return model instanceof ve.dm.Node && model.isCellable();
};

/**
 * @inheritdoc
 */
ve.ui.SumCellsContextItem.prototype.setup = function () {
	// If not disabled, selection must be table and spanning multiple matrix cells
	var sum, cells, average, digits,
		count = 0,
		selection = this.getFragment().getSurface().getSelection(),
		doc = this.getFragment().getDocument();

	// There's some situations involving transclusion table cells which
	// can make us have a LinearSelection here, so make sure this will
	// work:
	if ( selection instanceof ve.dm.TableSelection ) {
		cells = selection.getMatrixCells( doc, true );
		if ( cells.length > 1 ) {
			sum = cells.reduce( function ( sum, cell ) {
				var number;
				if ( !cell.isPlaceholder() ) {
					number = +doc.data.getText( true, cell.node.getRange() );
					if ( !isNaN( number ) ) {
						count++;
						return sum + number;
					}
				}
				return sum;
			}, 0 );
		}
	}

	// Only show if more than one numeric value was selected
	if ( count > 1 ) {
		average = sum / count;
		digits = Math.floor( Math.log10( average ) );
		this.setLabel(
			ve.msg( 'visualeditor-table-sum-label',
				sum,
				// Show 3 significant figures, or the number of integer
				// digits, whichever is higher.
				average.toPrecision( Math.max( 3, digits ) )
			)
		);
	} else {
		this.$element.detach();
	}
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.SumCellsContextItem );
