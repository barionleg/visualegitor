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
	this.ime.setLanguage( lang );
	imeDialog.onChooseMethodButtonClick();
};

ve.ui.ImeDialog.prototype.onChooseMethodButtonClick = function () {
	var imeDialog = this,
		inputMethods = this.ime.getInputMethods( this.ime.getLanguage() );
	this.dialogs.openWindow(
		'inputMethods',
		{ inputMethods: inputMethods }
	).then( function ( opened ) {
		opened.then( function ( closing ) {
			closing.then( function ( data ) {
				data = data || {};
				if ( data.action === 'apply' ) {
					imeDialog.ime.load( data.id ).done( function () {
						imeDialog.ime.setIM( data.id );
					} );
				}
			} );
		} );
	} );
};

ve.ui.ImeDialog.prototype.onImeLanguageChange = function () {
	var lang = this.ime.getLanguage();
	if ( lang ) {
		this.chooseLanguageButton.setLabel( this.ime.getAutonym( lang ) );
		this.chooseMethodButton.setDisabled( false );
	} else {
		this.chooseLanguageButton.setLabel(
			ve.msg( 'visualeditor-imedialog-widget-chooselanguage' )
		);
		this.chooseMethodButton.setDisabled( true );
	}
	this.onImeMethodChange();
};

ve.ui.ImeDialog.prototype.onImeMethodChange = function () {
	var inputMethod = this.ime.getIM();
	this.chooseMethodButton.setLabel(
		inputMethod ?
		this.ime.getInputMethodName( inputMethod.id ) :
		ve.msg( 'visualeditor-imedialog-widget-choosemethod' )
	);
};

/**
 * @inheritdoc
 */
ve.ui.ImeDialog.prototype.getSetupProcess = function ( data ) {
	var imeDialog = this;
	data = data || {};
	return ve.ui.ImeDialog.super.prototype.getSetupProcess.call( this, data )
		.first( function () {
			this.surface = data.surface;
			this.dialogs = this.surface.getDialogs();
			this.$doc = this.surface.view.documentView.getDocumentNode().$element;
			this.ime = this.$doc.data( 'ime' );
			this.$doc.on( 'imeLanguageChange', imeDialog.onImeLanguageChange.bind( imeDialog ) );
			this.$doc.on( 'imeMethodChange', imeDialog.onImeMethodChange.bind( imeDialog ) );
			imeDialog.onImeLanguageChange();
			imeDialog.onImeMethodChange();
			this.ime.enable();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.ImeDialog.prototype.getTeardownProcess = function ( data ) {
	// Cannot use this.ime.disable(), because it unsets the IM
	this.ime.toggle();
	this.$element.off( 'imeMethodChange' );
	this.$element.off( 'imeLanguageChange' );
	return ve.ui.ImeDialog.super.prototype.getTeardownProcess.call( this, data );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.ImeDialog );
