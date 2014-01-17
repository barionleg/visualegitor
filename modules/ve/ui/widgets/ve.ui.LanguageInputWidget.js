/*!
 * VisualEditor UserInterface LanguageInputWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Creates an ve.ui.LanguageInputWidget object.
 *
 * @class
 * @extends OO.ui.TextInputWidget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.LanguageInputWidget = function VeUiLanguageInputWidget( config ) {
	var ulsParams, langInpObj;

	// Parent constructor
	OO.ui.Widget.call( this, config );

	// Visual Properties
	this.$langCodeDisp = this.getDisplayElement( config ); // language code
	this.$langNameDisp = this.getDisplayElement( config ); // human-readable language name
	this.$dirDisp = this.getDisplayElement( config );

	// Placeholders for attribute values
	this.lang = '';
	this.dir = '';

	// Create the informational table:
	this.$element.append(
		this.$( '<table>' ).css( { 'width': '100%' } )
			.addClass( 've-LanguageInspector-information' )
			.append( this.$( '<tr>' )
				.append( this.$( '<td>' )
					.addClass( 've-ui-LanguageInspector-info-title' )
					.text( ve.msg( 'visualeditor-languageinspector-widget-label-language' ) ) )
				.append( this.$( '<td>' )
					.addClass( 've-ui-LanguageInspector-info-langname' )
				.append( this.$langNameDisp ) ) )
			.append( this.$( '<tr>' )
				.append( this.$( '<td>' )
					.addClass( 've-ui-LanguageInspector-info-title' )
					.text( ve.msg( 'visualeditor-languageinspector-widget-label-langcode' ) ) )
				.append( this.$( '<td>' )
					.addClass( 've-ui-LanguageInspector-info-langcode' )
				.append( this.$langCodeDisp ) ) )
			.append( this.$( '<tr>' )
				.append( this.$( '<td>' )
					.addClass( 've-ui-LanguageInspector-info-title' )
					.text( ve.msg( 'visualeditor-languageinspector-widget-label-direction' ) ) )
				.append( this.$( '<td>' )
					.addClass( 've-ui-LanguageInspector-info-dir' )
				.append( this.$dirDisp ) ) )
	 );

	// Use a different reference than 'this' to avoid scope problems
	// inside the $.ULS callback:
	langInpObj = this;

	// Initialization
	this.$element.addClass( 've-ui-LangInputWidget' );

	ulsParams = {
		onSelect: function ( language ) {
			// Save the attributes:
			langInpObj.setAttributes( language, $.uls.data.getDir( language ) );
		},
		compact: true,
		// Temporary Quicklist for the Prototype:
		// (This will likely change once we find a better list)
		quickList: [ 'en', 'hi', 'he', 'ml', 'ta', 'fr' ]
	};

	// Create a 'change language' Button:
	this.$button = new OO.ui.ButtonWidget({
		'label': ve.msg( 'visualeditor-languageinspector-widget-changelang' ),
		// Add 'href' so the button returns true on click and triggers ULS
		'href': '#',
		'flags': ['primary']
	});

	// Attach ULS event call
	this.$button.$element.uls( ulsParams );

	this.$element.append( this.$button.$element );
};

/* Inheritance */

OO.inheritClass( ve.ui.LanguageInputWidget, OO.ui.Widget );

/* Static properties */

/* Methods */

/**
 * Get display element. This replaces the 'getInputElement'
 * of the InputWidget
 *
 * @method
 * @param {Object} [config] Configuration options
 * @returns {jQuery} span element
 */
ve.ui.LanguageInputWidget.prototype.getDisplayElement = function () {
	return this.$( '<span>' );
};

/**
 * Return the current language attributes
 *
 */
ve.ui.LanguageInputWidget.prototype.getAttributes = function () {
	return {
		'lang': this.lang,
		'dir': this.dir
	};
};

/**
 * Set the current language attributes
 *
 */
ve.ui.LanguageInputWidget.prototype.setAttributes = function ( lang, dir ) {
	this.lang = lang;
	this.dir = dir;
	// Update the view:
	this.updateLanguageTable();
};

/**
 * Get the language value of the current annotation
 * This is required by the AnnotationInspector onClose method
 */
ve.ui.LanguageInputWidget.prototype.getValue = function () {
	// Specifically to be displayed
	return this.$langNameDisp.text();
};

/**
 * Updates the language value in the display table
 *
 * This shouldn't be used directly. It is called from the
 * setAttributes method after receiving annotation details
 * to make sure the annotation and the table are synchronized.
 *
 * @method
 */
ve.ui.LanguageInputWidget.prototype.updateLanguageTable = function () {
	var langNameDisp = '';

	if ( this.lang ) {
		langNameDisp = $.uls.data.getAutonym( this.lang );
	}

	// Display the information in the table:
	this.$langCodeDisp.html( this.lang );
	this.$langNameDisp.html( langNameDisp );
	this.$dirDisp.html( this.dir );
};
