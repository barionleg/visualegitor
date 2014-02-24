/*!
 * VisualEditor UserInterface MediaSizeWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Widget that lets the user edit dimensions (width and height),
 * optionally with a fixed aspect ratio.
 *
 * The widget is designed to work in one of two ways:
 * 1. Instantiated with size configuration already set up
 * 2. Instantiated empty, and size details added when the
 *    data is available.
 *
 * @class
 * @extends OO.ui.Widget
 * @mixins ve.Scalable
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MediaSizeWidget = function VeUiMediaSizeWidget( config ) {
	var heightLabel, widthLabel;

	// Configuration
	config = config || {};

	// Parent constructor
	OO.ui.Widget.call( this, config );

	// Mixin constructors
	ve.Scalable.call( this, config );

	// Define dimension input widgets
	this.widthInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );
	this.heightInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );

	// Define dimension labels
	widthLabel = new OO.ui.LabelWidget( {
		'$': this.$,
		'input': this.widthInput,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-width' )
	} );
	heightLabel = new OO.ui.LabelWidget( {
		'$': this.$,
		'input': this.heightInput,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-height' )
	} );
	// Error label
	this.errorLabel = new OO.ui.LabelWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-defaulterror' )
	} );

	// Define buttons
	this.originalDimensionsButton = new OO.ui.ButtonWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-button-originaldimensions' )
	} );

	// Build the GUI
	this.$element.append( [
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-section-width' )
			.append( [
				widthLabel.$element,
				this.widthInput.$element
			] ),
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-section-height' )
			.append( [
				heightLabel.$element,
				this.heightInput.$element
			] ),
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-button-originalSize' )
			.append( this.originalDimensionsButton.$element ),
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-label-error' )
			.append( this.errorLabel.$element ),
	] );

	this.originalDimensionsButton.setDisabled( true );

	// Events
	this.originalDimensionsButton.connect( this, { 'click': 'onButtonOriginalDimensionsClick' } );

	this.widthInput.connect( this, { 'change': 'onWidthChange' } );
	this.heightInput.connect( this, { 'change': 'onHeightChange' } );

	// Initialization
	this.$element.addClass( 've-ui-mediaSizeWidget' );
	if ( config.originalDimensions ) {
		this.setOriginalDimensions( config.originalDimensions );
	}
	if ( config.maxDimensions ) {
		this.setMaxDimensions( config.maxDimensions );
	}
};

/* Inheritance */

OO.inheritClass( ve.ui.MediaSizeWidget, OO.ui.Widget );

OO.mixinClass( ve.ui.MediaSizeWidget, ve.Scalable );

/* Methods */

/**
 * Overridden from ve.Scalable to allow one dimension to be set
 * at a time, write values back to inputs and show any errors.
 */
ve.ui.MediaSizeWidget.prototype.setCurrentDimensions = function ( dimensions ) {
	// Recursion protection
	if ( this.preventChangeRecursion ) {
		return;
	}

	this.preventChangeRecursion = true;

	if ( !dimensions.height && this.getRatio() !== null && $.isNumeric( dimensions.width ) ) {
		dimensions.height = Math.round( dimensions.width / this.getRatio() );
	}
	if ( !dimensions.width && this.getRatio() !== null && $.isNumeric( dimensions.height ) ) {
		dimensions.width = Math.round( dimensions.height * this.getRatio() );
	}

	ve.Scalable.prototype.setCurrentDimensions.call( this, dimensions );

	// This will only update if the value has changed
	this.widthInput.setValue( this.getCurrentDimensions().width );
	this.heightInput.setValue( this.getCurrentDimensions().height );

	this.validateDimensions( false );

	this.preventChangeRecursion = false;
};

/**
 * Explicitly call for validating the current dimensions. This is especially
 * useful if we've changed conditions for the widget, like limiting image
 * dimensions for thumbnails when the image type changes. Triggers the error
 * class if needed.
 *
 * @param {boolean} isForced Force a re-evaluation even if this.valid is
 * already set.
 * @returns {boolean} Current dimensions are valid
 */
ve.ui.MediaSizeWidget.prototype.validateDimensions = function ( isForced ) {
	var isValid = this.isCurrentDimensionsValid( isForced );
	this.errorLabel.$element.toggle( !isValid );
	this.$element.toggleClass( 've-ui-mediaSizeWidget-input-hasError', !isValid );

	return isValid;
};

/** */
ve.ui.MediaSizeWidget.prototype.setOriginalDimensions = function ( dimensions ) {
	// Parent method
	ve.Scalable.prototype.setOriginalDimensions.call( this, dimensions );
	// Enable the 'original dimensions' button
	this.originalDimensionsButton.setDisabled( false );
};

/**
 * Respond to a change in the width input.
 */
ve.ui.MediaSizeWidget.prototype.onWidthChange = function () {
	var val = this.widthInput.getValue();
	this.setCurrentDimensions( { 'width': $.isNumeric( val ) ? Number( val ) : val } );
};

/**
 * Respond to a change in the height input.
 */
ve.ui.MediaSizeWidget.prototype.onHeightChange = function () {
	var val = this.heightInput.getValue();
	this.setCurrentDimensions( { 'height': $.isNumeric( val ) ? Number( val ) : val } );
};

/**
 * Set the width/height values to the original media dimensions
 *
 * @param {jQuery.Event} e Click event
 */
ve.ui.MediaSizeWidget.prototype.onButtonOriginalDimensionsClick = function () {
	this.setCurrentDimensions( this.getOriginalDimensions() );
};
