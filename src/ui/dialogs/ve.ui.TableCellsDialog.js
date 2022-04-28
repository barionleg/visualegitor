/*!
 * VisualEditor UserInterface TableCellsDialog class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Dialog for table cell properties.
 *
 * @class
 * @extends ve.ui.FragmentDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.TableCellsDialog = function VeUiTableCellsDialog( config ) {
	// Parent constructor
	ve.ui.TableCellsDialog.super.call( this, config );

	this.$element.addClass( 've-ui-tableCellsDialog' );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableCellsDialog, ve.ui.FragmentDialog );

/* Static Properties */

ve.ui.TableCellsDialog.static.name = 'tableCells';

ve.ui.TableCellsDialog.static.size = 'large';

ve.ui.TableCellsDialog.static.title = 'Cell properties';// OO.ui.deferMsg( 'visualeditor-dialog-table-cell-title' );

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.TableCellsDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.TableCellsDialog.super.prototype.initialize.call( this );

	this.initialValues = null;

	this.panel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false,
		classes: [ 've-ui-tableCellsDialog-panel' ]
	} );

	this.alignWidget = new ve.ui.AlignWidget();
	this.alignWidget.addItems( [
		new OO.ui.ButtonOptionWidget( {
			data: 'default',
			label: 'Default'
		} )
	], 0 );
	this.alignField = new OO.ui.FieldLayout( this.alignWidget, {
		align: 'left',
		label: 'Alignment' // ve.msg( 'visualeditor-dialog-table-caption' )
		// TODO: Add message explaining that this only sets/reads the style attribute
		// help: '',
		// helpInline: true
	} );

	this.alignWidget.connect( this, { choose: 'updateActions' } );

	this.panel.$element.append( this.alignField.$element );

	this.$body.append( this.panel.$element );
};

/**
 * Update the 'done' action according to whether there are changes
 */
ve.ui.TableCellsDialog.prototype.updateActions = function () {
	this.actions.setAbilities( { done: !ve.compare( this.getValues(), this.initialValues ) } );
};

/**
 * Get object describing current form values.
 *
 * To be compared against this.initialValues
 *
 * @return {Object} Current form values
 */
ve.ui.TableCellsDialog.prototype.getValues = function () {
	var selectedAlign = this.alignWidget.findSelectedItem();
	return {
		align: selectedAlign ? selectedAlign.getData() : null
	};
};

/**
 * @inheritdoc
 */
ve.ui.TableCellsDialog.prototype.getSetupProcess = function ( data ) {
	return ve.ui.TableCellsDialog.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			var isReadOnly = this.isReadOnly();
			var documentModel = this.getFragment().getDocument();
			var cells = this.getFragment().getSelection().getMatrixCells( documentModel );
			var allAlign = null;
			cells.every( function ( cell ) {
				var cellAlign = cell.node.getAttribute( 'align' );
				if ( allAlign === null ) {
					// Take the alignment of the first cell
					allAlign = cellAlign;
				} else if ( allAlign !== cellAlign ) {
					// If subsequent cells have a different alignment, set
					// allAlign back to null (mixed alignment) and break.
					allAlign = null;
					return false;
				}
				return true;
			} );
			this.initialValues = {
				align: allAlign
			};
			this.alignWidget.selectItemByData( this.initialValues.align ).setDisabled( isReadOnly );
			this.updateActions();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.TableCellsDialog.prototype.getActionProcess = function ( action ) {
	return ve.ui.TableCellsDialog.super.prototype.getActionProcess.call( this, action )
		.next( function () {
			if ( action === 'done' ) {
				var fragment = this.getFragment();
				var surfaceModel = fragment.getSurface();
				var documentModel = fragment.getDocument();
				var values = this.getValues();
				if ( values.align !== this.initialValues.align ) {
					var cells = this.getFragment().getSelection().getMatrixCells( documentModel );
					cells.forEach( function ( cell ) {
						surfaceModel.getLinearFragment( cell.node.getOuterRange(), true ).changeAttributes( {
							align: values.align
						} );
					} );
				}
				this.close( { action: 'done' } );
			}
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.TableCellsDialog );
