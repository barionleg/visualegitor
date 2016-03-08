/*!
 * VisualEditor UserInterface InputMethodDialog class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Dialog for searching for and selecting a language.
 *
 * @class
 * @extends OO.ui.ProcessDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.InputMethodDialog = function VeUiInputMethodDialog( config ) {
	// Parent constructor
	ve.ui.InputMethodDialog.super.call( this, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.InputMethodDialog, OO.ui.ProcessDialog );

/* Static Properties */

ve.ui.InputMethodDialog.static.name = 'inputMethods';

ve.ui.InputMethodDialog.static.size = 'medium';

ve.ui.InputMethodDialog.static.title =
	OO.ui.deferMsg( 'visualeditor-inputmethodsdialog-input-methods-title' );

ve.ui.InputMethodDialog.static.actions = [
	{
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-cancel' ),
		flags: [ 'back' ]
	}
];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.InputMethodDialog.prototype.initialize = function () {
	ve.ui.InputMethodDialog.super.prototype.initialize.apply( this, arguments );
	this.methodSelect = new OO.ui.SelectWidget( {
		label: 'Select input method',
		menu: { items: [] }
	} );
	this.$body.append( this.methodSelect.$element );
};

/**
 * @inheritdoc
 */
ve.ui.InputMethodDialog.prototype.getSetupProcess = function ( data ) {
	var inputMethods;
	data = data || {};
	inputMethods = data.inputMethods || [];

	this.methodSelect.clearItems();
	this.methodSelect.addItems( inputMethods.map( function ( inputMethod ) {
		return new OO.ui.MenuOptionWidget( {
			data: inputMethod.id,
			label: inputMethod.name
		} );
	} ) );
	this.methodSelect.connect( this, { choose: 'onMethodSelectChoose' } );
	return ve.ui.InputMethodDialog.super.prototype.getSetupProcess.call( this, data );
};

ve.ui.InputMethodDialog.prototype.onMethodSelectChoose = function ( item ) {
	this.close( {
		action: 'apply',
		id: item.getData(),
		name: item.getLabel()
	} );
};

/**
 * @inheritdoc
 */
ve.ui.InputMethodDialog.prototype.getBodyHeight = function () {
	return 200;
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.InputMethodDialog );
