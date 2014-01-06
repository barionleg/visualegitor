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
	// Parent constructor
	OO.ui.Widget.call( this, config );

	// Configuration
	config = config || {};

	// The widget is designed to work in one of two ways:
	// 1. Instantiated with size configuration already set up
	// 2. Instantiated empty, and size details added when the
	//    data is available, such as is done from the media
	//    edit dialog
	this.width = config.width || 1;
	this.height = config.height || 1;
	this.originalDimensions = config.originalDimensions || {};

	// GUI containers
	this.widthInput = null;
	this.heightInput = null;

	this.valid = false;

	// Building widget GUI
	this.buildGUI();

	// Events
	this.buttonOriginalDimensions.connect( this, { 'click': 'onButtonOriginalDimensionsClick' } );

	// Since the two inputs are coupled, each value change in one incurs a change in the other.
	// If the event is 'change' that results in a loop, where the value of the input we type into
	// changes twice - once for the typed value and second from the update of the other input.
	// Instead, we use 'keyup' event to trigger the value change (per aspect ratio) and validation.
	this.widthInput.$input.on( 'keyup', { 'dir': 'width' }, OO.ui.bind( this.onKeyupWidth, this ) );
	this.heightInput.$input.on( 'keyup', { 'dir': 'height' }, OO.ui.bind( this.onKeyupHeight, this ) );

	// Initialization
	this.$element.addClass( 've-ui-MediaSizeWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.MediaSizeWidget, OO.ui.Widget );

/* Methods */

/**
 * Create the widget display
 */
ve.ui.MediaSizeWidget.prototype.buildGUI = function () {
	var labelHeight, labelWidth;

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
};

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
	// First check if original values are set to sane values.
	// If not, set them to current width/height values
	if ( this.originalDimensions.width <= 0 ) {
		this.originalDimensions.width = this.width;
	}
	if ( this.originalDimensions.height <= 0 ) {
		this.originalDimensions.height = this.height;
	}

	// Check which dimensions we are updating
	if ( dimensions.width && dimensions.height ) {
		// If both dimensions are set, apply these values verbatim
		this.width = dimensions.width;
		this.height = dimensions.height;
	} else if ( dimensions.width && dimensions.width !== this.width && !dimensions.height ) {
		// If only width is defined, calculate the height
		this.width = dimensions.width;
		this.height = Math.round( this.width / this.getAspectRatio() );
	} else if ( dimensions.height && dimensions.height !== this.height && !dimensions.width ) {
		// If only height is defined, calculate the width
		this.height = dimensions.height;
		this.width = Math.round( this.height * this.getAspectRatio() );
	}

	// Set the input values
	this.widthInput.setValue( this.width );
	this.heightInput.setValue( this.height );

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
};

/**
 * Calculates the aspect ratio between width/height of the original
 * dimensions. This will be redone by original dimensions always to
 * keep the aspect ratio properly defined.
 * @returns {Number} Aspect ratio
 */
ve.ui.MediaSizeWidget.prototype.getAspectRatio = function () {
	return this.originalDimensions.width / this.originalDimensions.height;
};

/**
 * Checks whether the input values have some problem.
 * Adds an error class to the inputs in case one is found.
 */
ve.ui.MediaSizeWidget.prototype.validateDimensions = function () {
	// Get the current values
	var width =  this.widthInput.$input.val(),
		height = this.heightInput.$input.val();

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
	if ( this.valid ) {
		this.widthInput.$element.removeClass( 've-ui-MediaSizeWidget-input-hasError' );
		this.heightInput.$element.removeClass( 've-ui-MediaSizeWidget-input-hasError' );
	} else {
		this.widthInput.$element.addClass( 've-ui-MediaSizeWidget-input-hasError' );
		this.heightInput.$element.addClass( 've-ui-MediaSizeWidget-input-hasError' );
	}
};

/**
 * Respond to keyup in the width input
 */
ve.ui.MediaSizeWidget.prototype.onKeyupWidth = function () {
	this.setDimensions( { 'width': this.widthInput.getValue() } );
};

/**
 * Respond to keyup in the height input
 */
ve.ui.MediaSizeWidget.prototype.onKeyupHeight = function () {
	this.setDimensions( { 'height': this.heightInput.getValue() } );
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
