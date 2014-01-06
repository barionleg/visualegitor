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
	// Optional maximum dimensions to limit the size
	this.maxDimensions = config.maxDimensions || {};

	// Cache for the aspect ratio, that is set by originalDimensions
	this.aspectRatio = null;

	// Validation
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
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-section-width' )
			.append( [
				labelWidth.$element,
				this.widthInput.$element
			] ),
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-section-height' )
			.append( [
				labelHeight.$element,
				this.heightInput.$element
			] ),
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-button-originalSize' )
			.append( this.buttonOriginalDimensions.$element ),
		this.$( '<div>' )
			.addClass( 've-ui-mediaSizeWidget-label-error' )
			.append( this.errorLabel.$element ),
	] );

	this.buttonOriginalDimensions.setDisabled( true );

	// Events
	this.buttonOriginalDimensions.connect( this, { 'click': 'onButtonOriginalDimensionsClick' } );

	this.widthInput.connect( this, { 'change': 'onWidthChange' } );
	this.heightInput.connect( this, { 'change': 'onHeightChange' } );

	// Initialization
	this.$element.addClass( 've-ui-mediaSizeWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.MediaSizeWidget, OO.ui.Widget );

/* Methods */

/**
 * Get the currently set rounded dimensions
 * @returns {Object<string.number>} Height and width values
 */
ve.ui.MediaSizeWidget.prototype.getDimensions = function () {
	return {
		'width': Number( this.widthInput.getValue() ),
		'height': Number( this.heightInput.getValue() )
	};
};

/**
 * Set the current width and height dimensions.
 * This method accepts either both values or a single value.
 *
 * In general, it is expected that the original dimensions will
 * be supplied before the current dimensions, but in case they
 * are not, several fallback options exist.
 *
 * The method will accept and handle either of the following:
 * 1. Both width/height dimensions are supplied:
 *    a. If original dimensions already set the inputs are filled
 *       in without calculation, trusting the verification method to
 *       notify the user in case there are errors.
 *    b. If original dimensions are not yet set, initial width
 *       and height values will be considered 'original dimensions'
 *       and used for future calculations through the entire session.
 * 2. Only width or only height are supplied:
 *    a. If original dimensions are already set, the corresponding
 *       input value is calculated.
 *    b. If original dimensions weren't yet set, we have no reference
 *       to make calculations. For the moment in this case, the
 *       method will assume a 1:1 ratio.
 *
 * All raw values are catched internally for accurate calculations
 * and the values are rounded for display inside the inputs.
 *
 * @param {Object} dimensions The given width/height dimensions
 */
ve.ui.MediaSizeWidget.prototype.setDimensions = function ( dimensions ) {

	// Recursion protection
	if ( this.preventChangeRecursion ) {
		return;
	}

	this.preventChangeRecursion = true;

	if ( this.aspectRatio === null && dimensions.width && dimensions.height ) {
		// If aspectRatio isn't defined and we have both width/height
		// values, use those for the original dimension values
		this.setOriginalDimensions( {
			'width': dimensions.width,
			'height': dimensions.height
		} );
	}

	if ( dimensions.width && dimensions.height ) {
		// If both dimensions are set up, use them directly
		this.width = dimensions.width;
		this.height = dimensions.height;
	} else if ( dimensions.width && !dimensions.height ) {
		// If only width is defined
		this.width = dimensions.width;
		if ( this.aspectRatio !== null ) {
			// If aspect ratio is available, calculate
			this.height = Math.round( this.width / this.getAspectRatio() );
		} else {
			// If aspect ratio is not available, assume 1:1 ratio
			this.height = this.width;
		}
	} else if ( dimensions.height && !dimensions.width ) {
		// If only height is defined
		this.height = dimensions.height;
		if ( this.aspectRatio !== null ) {
			// If aspect ratio is available, calculate
			this.width = Math.round( this.height * this.getAspectRatio() );
		} else {
			// If aspect ratio is not available, assume 1:1 ratio
			this.width = this.height;
		}
	}

	this.widthInput.setValue( this.width );
	this.heightInput.setValue( this.height );

	// Check if we need to notify the user that the dimensions
	// have a problem
	this.validateDimensions();

	this.preventChangeRecursion = false;
};

/**
 * Get the height and width values of the maximum allowed dimensions
 * @returns {Object<string.number>} Height and width values
 */
ve.ui.MediaSizeWidget.prototype.getMaxDimensions = function () {
	return this.originalDimensions;
};

/**
 * Set the maximum dimension limit for the image.
 * It is also possible to limit only one dimension.
 * @param {Object} dimensions Maximum width/height media dimensions
 */
ve.ui.MediaSizeWidget.prototype.setMaxDimensions = function ( dimensions ) {
	this.maxDimensions = {
		'width': dimensions.width,
		'height': dimensions.height
	};
};

/**
 * Get the height and width values of the original dimensions
 * @returns {Object<string.number>} Height and width values
 */
ve.ui.MediaSizeWidget.prototype.getOriginalDimensions = function () {
	return this.originalDimensions;
};

/**
 * Set the original dimensions and cache the aspect ratio.
 * @param {Object} dimensions Original width/height media dimensions
 */
ve.ui.MediaSizeWidget.prototype.setOriginalDimensions = function ( dimensions ) {
	this.originalDimensions = {
		'width': dimensions.width,
		'height': dimensions.height
	};
	// Cache the aspect ratio
	this.aspectRatio = ( this.originalDimensions.width / this.originalDimensions.height );
	// Enable the 'original dimensions' button
	this.buttonOriginalDimensions.setDisabled( false );
};

/**
 * Retrieve the aspect ratio
 * @returns {Number} Aspect ratio
 */
ve.ui.MediaSizeWidget.prototype.getAspectRatio = function () {
	return this.aspectRatio;
};

/**
 * Checks whether the input values are valid. If the inputs are
 * not valid, an error class will be added to the inputs.
 */
ve.ui.MediaSizeWidget.prototype.validateDimensions = function () {

	// Check for an error in the values
	if (
		!$.isNumeric( this.width ) ||
		!$.isNumeric( this.height ) ||
		Number( this.width ) <= 0 ||
		Number( this.height ) <= 0 ||
		// Check if the size exceeds max dimensions,
		// but only if the originalDimensions are set
		$.isNumeric( this.maxDimensions.width ) &&
		Number( this.width ) > this.maxDimensions.width ||
		$.isNumeric( this.maxDimensions.height ) &&
		Number( this.height ) > this.maxDimensions.height

	) {
		this.valid = false;
		// Show default error message
		this.errorLabel.setLabel( ve.msg( 'visualeditor-mediasizewidget-label-defaulterror' ) );
		this.errorLabel.$element.show();
	} else {
		// Hide the error message
		this.hideError();
		this.valid = true;
	}

	// Add or remove the error class from relevant inputs
	this.widthInput.$element.toggleClass( 've-ui-mediaSizeWidget-input-hasError', !this.valid );
	this.heightInput.$element.toggleClass( 've-ui-mediaSizeWidget-input-hasError', !this.valid );
};

/**
 * Respond to change in the width input
 */
ve.ui.MediaSizeWidget.prototype.onWidthChange = function () {
	var val = this.widthInput.getValue();
	if ( $.isNumeric( val ) ) {
		// Calculate and update the corresponding value
		this.setDimensions( { 'width': Number( this.widthInput.getValue() ) } );
	} else {
		this.width = val;
		// We didn't perform an actual change, but we should still validate
		// the input values
		this.validateDimensions();
	}
};

/**
 * Respond to change in the height input
 */
ve.ui.MediaSizeWidget.prototype.onHeightChange = function () {
	var val = this.heightInput.getValue();
	if ( $.isNumeric( val ) ) {
		// Calculate and update the corresponding value
		this.setDimensions( { 'height': Number( this.heightInput.getValue() ) } );
	} else {
		this.height = val;
		// We didn't perform an actual change, but we should still validate
		// the input values
		this.validateDimensions();
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
