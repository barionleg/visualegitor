/*!
 * VisualEditor UserInterface MediaSizeWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Creates an ve.ui.MediaSizeWidget object.
 *
 * @class
 * @extends OO.ui.TextInputWidget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MediaSizeWidget = function VeUiMediaSizeWidget( config ) {
	var labelHeight, labelWidth;

	// Parent constructor
	OO.ui.Widget.call( this, config );

	// Configuration
	config = config || {};

	// The widget is designed to work in one of two ways:
	// 1. Instantiated with size configuration already set up
	// 2. Instantiated empty, and size details added when the
	//    data is available, such as is done from the media
	//    edit dialog
	this.width = config.width;
	this.height = config.height;
	this.originalDimensions = config.originalDimensions || {};
	this.aspectRatio = null;

	this.valid = false;

	// Define dimension input widgets
	this.widthInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );
	this.heightInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );

	// Define dimension labels
	labelWidth = new OO.ui.InputLabelWidget( {
		'$': this.$,
		'input': this.widthInput,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-width' )
	} );
	labelHeight = new OO.ui.InputLabelWidget( {
		'$': this.$,
		'input': this.heightInput,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-height' )
	} );
	// Error label
	this.errorLabel = new OO.ui.InputLabelWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-defaulterror' )
	} );

	// Define buttons
	this.buttonOriginalDimensions = new OO.ui.PushButtonWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-button-originalDimensions' )
	} );

	// Build the GUI
	this.$element.append( [
		$( '<div>' )
			.addClass( 've-ui-MediaSizeWidget-section-width' )
			.append( [
				labelWidth.$element,
				this.widthInput.$element
			] ),
		$( '<div>' )
			.addClass( 've-ui-MediaSizeWidget-section-height' )
			.append( [
				labelHeight.$element,
				this.heightInput.$element
			] ),
		$( '<div>' )
			.addClass( 've-ui-MediaSizeWidget-button-originalSize' )
			.append( this.buttonOriginalDimensions.$element ),
		$( '<div>' )
			.addClass( 've-ui-MediaSizeWidget-label-error' )
			.append( this.errorLabel.$element ),
	] );

	// Events
	this.buttonOriginalDimensions.connect( this, { 'click': 'onButtonOriginalDimensionsClick' } );

	this.widthInput.connect( this, { 'change': 'onChangeWidth' } );
	this.heightInput.connect( this, { 'change': 'onChangeHeight' } );

	// Since the two inputs are coupled, each value change in one incurs a change in the other.
	// If the event is 'change' that results in a loop, where the value of the input we type into
	// changes twice - once for the typed value and second from the update of the other input.
	// Instead, we use 'keyup' event to trigger the value change (per aspect ratio) and validation.
//	this.widthInput.$input.on( 'keyup', { 'dir': 'width' }, OO.ui.bind( this.onKeyupWidth, this ) );
//	this.heightInput.$input.on( 'keyup', { 'dir': 'height' }, OO.ui.bind( this.onKeyupHeight, this ) );

	// Initialization
	this.$element.addClass( 've-ui-MediaSizeWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.MediaSizeWidget, OO.ui.Widget );

/* Methods */

/**
 * Get the currently set dimensions
 * @returns {Object<String.Number>} Height and width values
 */
ve.ui.MediaSizeWidget.prototype.getDimensions = function () {
	return {
		'width': this.width,
		'height': this.height
	};
};

/**
 * Setting the current width and height dimensions.
 * This method accepts either both values or a single value. If
 * only a single dimension is provided, the other dimension is
 * calculated according to the aspect ratio.
 *
 * @param {Object} dimensions The given width/height dimensions
 */
ve.ui.MediaSizeWidget.prototype.setDimensions = function ( dimensions ) {

	// First check if aspect ratio is set up
	if ( this.aspectRatio === null ) {
		// Keep aspect ratio from the initial width/height values
		this.setOriginalDimensions( {
			'width': this.width,
			'height': this.height
		} );
	}

	// Check which dimensions we are updating
	if ( dimensions.width && dimensions.height ) {
		// If both dimensions are set, apply these values verbatim
		this.width = dimensions.width;
		this.height = dimensions.height;
	} else if ( dimensions.width && dimensions.width !== this.width && !dimensions.height ) {
		// If only width is defined, calculate the height
		this.width = dimensions.width;
		this.height = this.width / this.getAspectRatio();
	} else if ( dimensions.height && dimensions.height !== this.height && !dimensions.width ) {
		// If only height is defined, calculate the width
		this.height = dimensions.height;
		this.width = this.height * this.getAspectRatio();
	}

	this.widthInput.setValue( Math.round( this.width ) );
	this.heightInput.setValue( Math.round( this.height ) );

	// Check if we need to notify the user that the dimensions
	// have a problem
	this.validateDimensions();
};

/**
 * Get the height and width values of the original dimensions
 * @returns {Object<String.Number>} Height and width values
 */
ve.ui.MediaSizeWidget.prototype.getOriginalDimensions = function () {
	return this.originalDimensions;
};

/**
 * Set the original dimensions
 * @param {Object} dimensions Original width/height media dimensions
 */
ve.ui.MediaSizeWidget.prototype.setOriginalDimensions = function ( dimensions ) {
	this.originalDimensions = dimensions;
	this.aspectRatio = ( this.originalDimensions.width / this.originalDimensions.height );
};

/**
 * Retrieve the aspect ratio
 * @returns {Number} Aspect ratio
 */
ve.ui.MediaSizeWidget.prototype.getAspectRatio = function () {
	return this.aspectRatio;
};

/**
 * Checks whether the input values have some problem.
 * Adds an error class to the inputs in case one is found.
 */
ve.ui.MediaSizeWidget.prototype.validateDimensions = function () {
	// Get the current values
	var width = Number( this.widthInput.getValue() ),
		height = Number( this.heightInput.getValue() );

	// Check for an error in the values
	if (
		!$.isNumeric( width ) ||
		!$.isNumeric( height ) ||
		width <= 0 ||
		height <= 0 ||
		width > this.originalDimensions.width ||
		height > this.originalDimensions.height
	) {
		this.valid = false;
		// Show default message
		this.displayError();
	} else {
		this.hideError();
		this.valid = true;
	}

	// Add or remove the error class from relevant inputs
	this.widthInput.$element.toggleClass( 've-ui-MediaSizeWidget-input-hasError', !this.valid );
	this.heightInput.$element.toggleClass( 've-ui-MediaSizeWidget-input-hasError', !this.valid );
};

/**
 * Respond to keyup in the width input
 */
ve.ui.MediaSizeWidget.prototype.onChangeWidth = function () {
	if ( Number( this.widthInput.getValue() ) !== Math.round( this.width ) && this.widthInput.getValue().length > 0 ) {
		this.setDimensions( { 'width': Number( this.widthInput.getValue() ) } );
	}
};

/**
 * Respond to keyup in the height input
 */
ve.ui.MediaSizeWidget.prototype.onChangeHeight = function () {
	if ( Number( this.heightInput.getValue() ) !== Math.round( this.height ) && this.heightInput.getValue().length > 0 ) {
		this.setDimensions( { 'height': Number( this.heightInput.getValue() ) } );
	}
};

/**
 * Set the width/height values to the original media dimensions
 *
 * @param {jQuery.Event} e Click event
 */
ve.ui.MediaSizeWidget.prototype.onButtonOriginalDimensionsClick = function () {
	this.setDimensions( this.originalDimensions );
};

/**
 * Set the 'original dimensions' button to disabled, in case original
 * dimensions are unavailable.
 *
 * @param {Boolean} isDisabled True to disable, false otherwise
 */
ve.ui.MediaSizeWidget.prototype.disableButtonOriginalDimensions = function ( isDisabled ) {
	this.buttonOriginalDimensions.setDisabled( isDisabled );
};

/**
 * Displays an error message
 * @param {String} msg The message to display
 */
ve.ui.MediaSizeWidget.prototype.displayError = function ( msg ) {
	msg = msg || ve.msg( 'visualeditor-mediasizewidget-label-defaulterror' );
	this.errorLabel.setLabel( msg );
	this.errorLabel.$element.show();
};

/**
 * Hide the error message
 */
ve.ui.MediaSizeWidget.prototype.hideError = function () {
	this.errorLabel.$element.hide();
};

/**
 * Checks whether there is an error with the widget
 * @returns {Boolean} Indicating if the values are valid
 */
ve.ui.MediaSizeWidget.prototype.isValid = function () {
	return this.valid;
};
