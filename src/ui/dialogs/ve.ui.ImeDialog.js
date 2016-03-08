/*!
 * VisualEditor UserInterface ImeDialog class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Find and replace dialog.
 *
 * @class
 * @extends ve.ui.ToolbarDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.ImeDialog = function VeUiImeDialog( config ) {
	// Parent constructor
	ve.ui.ImeDialog.super.call( this, config );

	// Pre-initialization
	this.$element.addClass( 've-ui-imeDialog' );
};

/* Inheritance */

OO.inheritClass( ve.ui.ImeDialog, ve.ui.ToolbarDialog );

ve.ui.ImeDialog.static.name = 'ime';

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.ImeDialog.prototype.initialize = function () {
	var languageLabel, methodLabel, closeButton;

	// Parent method
	ve.ui.ImeDialog.super.prototype.initialize.call( this );

	// Properties
	this.surface = null;
	this.lang = null;
	this.dialogs = null;

	languageLabel = new OO.ui.LabelWidget( {
		classes: [ 've-ui-imeDialog-cell ve-ui-imeDialog-languageLabel' ],
		label: ve.msg( 'visualeditor-imedialog-widget-label-inputlanguage' )
	} );
	this.chooseLanguageButton = new OO.ui.ButtonWidget( {
		classes: [ 've-ui-imeDialog-cell ve-ui-imeDialog-chooseLanguageButton' ],
		label: ve.msg( 'visualeditor-imedialog-widget-chooselanguage' ),
		indicator: 'next'
	} );
	methodLabel = new OO.ui.LabelWidget( {
		classes: [ 've-ui-imeDialog-cell ve-ui-imeDialog-methodLabel' ],
		label: ve.msg( 'visualeditor-imedialog-widget-label-inputmethod' )
	} );
	this.chooseMethodButton = new OO.ui.ButtonWidget( {
		classes: [ 've-ui-imeDialog-cell ve-ui-imeDialog-chooseMethodButton' ],
		label: ve.msg( 'visualeditor-imedialog-widget-choosemethod' ),
		indicator: 'next'
	} );
	closeButton = new OO.ui.ButtonWidget( {
		classes: [ 've-ui-imeDialog-cell ve-ui-imeDialog-closeButton' ],
		label: ve.msg( 'visualeditor-imedialog-widget-button-close' )
	} );

	// Events
	this.chooseLanguageButton.connect( this, { click: 'onFindLanguageButtonClick' } );
	this.chooseMethodButton.connect( this, { click: 'onChooseMethodButtonClick' } );
	closeButton.connect( this, { click: 'close' } );

	// Initialization
	this.chooseMethodButton.setDisabled( true );
	this.$body.append(
		$( '<div>' ).addClass( 've-ui-imeDialog-row' )
			.append(
				languageLabel.$element,
				this.chooseLanguageButton.$element,
				methodLabel.$element,
				this.chooseMethodButton.$element,
				closeButton.$element
			)
	);
};

ve.ui.ImeDialog.prototype.onFindLanguageButtonClick = function () {
	var imeDialog = this;
	this.dialogs.openWindow(
		'languageSearch',
		{ availableLanguages: this.ime.getLanguageCodes() }
	).then( function ( opened ) {
		opened.then( function ( closing ) {
			closing.then( function ( data ) {
				data = data || {};
				if ( data.action === 'apply' ) {
					imeDialog.setLangCode( data.lang );
				}
			} );
		} );
	} );
};

ve.ui.ImeDialog.prototype.setLangCode = function ( lang ) {
	var imeDialog = this;
	if ( lang === this.lang ) {
		// No change
		return;
	}
	this.ime.setLanguage( lang );
	this.chooseLanguageButton.setLabel( this.ime.getAutonym( lang ) );
	this.lang = lang;
	this.ime.loadInputMethods( lang ).then( function () {
		imeDialog.chooseMethodButton.setDisabled( false );
		imeDialog.onChooseMethodButtonClick();
	} );
};

ve.ui.ImeDialog.prototype.onChooseMethodButtonClick = function () {
	var imeDialog = this,
		inputMethods = this.ime.getInputMethods( this.lang );
	this.dialogs.openWindow(
		'inputMethods',
		{ inputMethods: inputMethods }
	).then( function ( opened ) {
		opened.then( function ( closing ) {
			closing.then( function ( data ) {
				data = data || {};
				if ( data.action === 'apply' ) {
					imeDialog.ime.setIM( data.id );
					imeDialog.chooseMethodButton.setLabel( data.name );
				}
			} );
		} );
	} );
};

/**
 * @inheritdoc
 */
ve.ui.ImeDialog.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return ve.ui.ImeDialog.super.prototype.getSetupProcess.call( this, data )
		.first( function () {
			this.surface = data.surface;
			this.dialogs = this.surface.getDialogs();
			this.ime = this.surface.view.documentView.getDocumentNode().$element.data( 'ime' );
			this.ime.enable();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.ImeDialog.prototype.getTeardownProcess = function ( data ) {
	// Cannot use this.ime.disable(), because it unsets the IM
	this.ime.toggle();
	return ve.ui.ImeDialog.super.prototype.getTeardownProcess.call( this, data );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.ImeDialog );
