/*!
 * VisualEditor user interface ActionDialog class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Dialog for editing a node.
 *
 * @class
 * @extends ve.ui.Dialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.ActionDialog = function VeUiActionDialog( config ) {
	// Parent constructor
	ve.ui.Dialog.call( this, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.ActionDialog, ve.ui.Dialog );

/* Static Properties */

/**
 * Default dialog size, either `small`, `medium` or `large`.
 *
 * @static
 * @property {string}
 * @inheritable
 */
ve.ui.ActionDialog.static.defaultSize = 'medium';

/* Methods */

/**
 * Handle apply button click events.
 */
ve.ui.ActionDialog.prototype.onApplyButtonClick = function () {
	var promise = this.applyChanges();

	if ( !promise.isResolved() ) {
		this.pushPending();
		promise.always( ve.bind( this.popPending, this ) );
	}
};

/**
 * Handle apply changes done events.
 *
 * Closes dialog and re-enables apply button.
 * 
 * @param {Object} data Dialog closing data
 */
ve.ui.ActionDialog.prototype.onApplyChangesDone = function ( data ) {
	this.close( data );
};

/**
 * Handle apply changes fail events.
 *
 * Shows errors that occured.
 *
 * @param {string[]} data Apply changes errors
 */
ve.ui.ActionDialog.prototype.onApplyChangesFail = function ( errors ) {
	this.showErrors( errors );
};

/**
 * Get a deferred object for applying changes.
 *
 * @return {jQuery.deferred}
 */
ve.ui.ActionDialog.prototype.getApplyChangesDeferred = function () {
	return new jQuery.Deferred()
		.done( ve.bind( this.onApplyChangesDone, this ) )
		.fail( ve.bind( this.onApplyChangesFail, this ) );
};

/**
 * Get the apply button label.
 *
 * @returns {string} Apply button label
 */
ve.ui.ActionDialog.prototype.getApplyButtonLabel = function () {
	return ve.msg( 'visualeditor-dialog-action-apply' );
};

/**
 * Apply changes to selected node.
 *
 * To apply changes asynchronously, don't call the parent method when overriding this method.
 *
 * To display errors, reject the deferred object, passing in an array of strings, one for each error
 * message to display.
 *
 * @return {jQuery.Promise} Promise, resolved when changes are done being applied
 */
ve.ui.ActionDialog.prototype.applyChanges = function () {
	return this.getApplyChangesDeferred().resolve().promise();
};

/**
 * Show errors.
 *
 * @param {string[]} errors List of errors that occured
 */
ve.ui.ActionDialog.prototype.showErrors = function ( errors ) {
	var i, len,
		$errors = $( [] );

	for ( i = 0, len = errors.length; i < len; i++ ) {
		$errors = $errors.add(
			this.$( '<div>' )
				.addClass( 've-ui-actionDialog-error' )
				.text( String( errors[i] ) )
		);
	}

	this.$errorsTitle.after( $errors );
	this.$errors.show();
};

/**
 * Hide errors.
 */
ve.ui.ActionDialog.prototype.dismissErrors = function () {
	this.$errors
		.hide()
		.find( '.ve-ui-actionDialog-error' )
			.remove();
};

/**
 * @inheritdoc
 */
ve.ui.ActionDialog.prototype.pushPending = function () {
	// Parent method
	ve.ui.ActionDialog.super.prototype.pushPending.call( this );

	this.applyButton.setDisabled( this.isPending() );
};

/**
 * @inheritdoc
 */
ve.ui.ActionDialog.prototype.popPending = function () {
	// Parent method
	ve.ui.ActionDialog.super.prototype.popPending.call( this );

	this.applyButton.setDisabled( this.isPending() );
};

/**
 * @inheritdoc
 */
ve.ui.ActionDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.ActionDialog.super.prototype.initialize.call( this );

	// Properties
	this.applyButton = new OO.ui.ButtonWidget( { '$': this.$, 'flags': [ 'primary' ] } );
	this.dismissErrorsButton = new OO.ui.ButtonWidget( {
		'$': this.$, 'label': ve.msg( 'visualeditor-dialog-error-dismiss' )
	} );
	this.panels = new OO.ui.StackLayout( { '$': this.$ } );
	this.$errors = this.$( '<div>' );
	this.$errorsTitle = this.$( '<div>' );

	// Events
	this.applyButton.connect( this, { 'click': [ 'applyChanges' ] } );
	this.dismissErrorsButton.connect( this, { 'click': [ 'dismissErrors' ] } );

	// Initialization
	this.$errorsTitle
		.addClass( 've-ui-actionDialog-error-title' )
		.text( ve.msg( 'visualeditor-dialog-error' ) );
	this.$errors
		.addClass( 've-ui-actionDialog-errors' )
		.append( this.$errorsTitle, this.dismissErrorsButton.$element );
	this.frame.$content
		.addClass( 've-ui-actionDialog' )
		.append( this.$errors );
	this.$body.append( this.panels.$element );
	this.$foot.append( this.applyButton.$element );
	this.setSize( this.constructor.static.defaultSize );
};

/**
 * @inheritdoc
 */
ve.ui.ActionDialog.prototype.setup = function ( data ) {
	// Parent method
	ve.ui.ActionDialog.super.prototype.setup.call( this, data );

	this.applyButton.setLabel( this.getApplyButtonLabel() );
};
