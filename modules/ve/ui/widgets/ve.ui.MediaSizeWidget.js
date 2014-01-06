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
	this.width = config.width || 0;
	this.height = config.height || 0;
	this.original = config.originalDimensions || {};

	// GUI containers
	this.inputs = { 'height': null, 'width': null };
	this.labels = { 'height': null, 'width': null };

	this.hasError = false;

	// Building widget GUI
	this.buildGUI();

	// Events
	this.buttonOriginalDimensions.connect( this, { 'click': 'onButtonOriginalDimensionsClick' } );

	this.inputs.width.$input.on( 'keyup', { 'dir': 'width' }, OO.ui.bind( this.onKeydown, this ) );
	this.inputs.height.$input.on( 'keyup', { 'dir': 'height' }, OO.ui.bind( this.onKeydown, this ) );

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
	// Define dimension input widgets
	this.inputs.height = new OO.ui.TextInputWidget( {
		'$': this.$
	} );
	this.inputs.width = new OO.ui.TextInputWidget( {
		'$': this.$
	} );

	// Define dimension labels
	this.labels.height = new OO.ui.InputLabelWidget( {
		'$': this.$,
		'input': this.inputs.height,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-height' )
	} );
	this.labels.width = new OO.ui.InputLabelWidget( {
		'$': this.$,
		'input': this.inputs.width,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-width' )
	} );
	this.labels.error = new OO.ui.InputLabelWidget( {
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
			.addClass( 've-ui-MediaSizeWidget-section-height' )
			.append( [
				this.labels.height.$element,
				this.inputs.height.$element
			] ),
		$( '<div>' )
			.addClass( 've-ui-MediaSizeWidget-section-width' )
			.append( [
				this.labels.width.$element,
				this.inputs.width.$element
			] ),
		$( '<div>' )
			.addClass( 've-ui-MediaSizeWidget-button-originalSize' )
			.append( this.buttonOriginalDimensions.$element ),
		$( '<div>' )
			.addClass( 've-ui-MediaSizeWidget-label-error' )
			.append( this.labels.error.$element ),
	] );
};

/**
 * Get the currently set dimensions
 * @returns {Object<String.Number>} Height and width values
 */
ve.ui.MediaSizeWidget.prototype.getDimensions = function () {
	return {
		'height': this.height,
		'width': this.width
	};
};

/**
 * Setting the current height/width dimensions.
 * This method accepts either both values or a single value. If
 * only a single dimension is provided, the other dimension is
 * calculated according to the aspect ratio.
 *
 * @param {Object} dimensions The given height/width dimensions
 */
ve.ui.MediaSizeWidget.prototype.setDimensions = function ( dimensions ) {
	dimensions = dimensions || {};

	// First check if original values are set to sane values.
	// If not, set them to current height/width values
	if ( this.original.height <= 0 ) {
		this.original.height = this.height;
	}
	if ( this.original.width <= 0 ) {
		this.original.width = this.width;
	}

	// Check which dimensions we are updating
	if ( dimensions.width && dimensions.height ) {
		// If both dimensions are set, apply these values verbatim
		this.width = dimensions.width;
		this.height = dimensions.height;
	} else if ( dimensions.height && !dimensions.width ) {
		// If only height is defined, calculate the width
		this.height = dimensions.height;
		this.width = Math.round( this.height * this.getAspectRatio() );
	} else if ( dimensions.width && !dimensions.height ) {
		// If only width is defined, calculate the height
		this.width = dimensions.width;
		this.height = Math.round( this.width / this.getAspectRatio() );
	}

	// Set the input values
	this.inputs.width.setValue( this.width );
	this.inputs.height.setValue( this.height );

	// Check if we need to notify the user that the dimensions
	// have a problem
	this.validateDimensions();
};

/**
 * Get the height and width values of the original dimensions
 * @returns {Object<String.Number>} Height and width values
 */
ve.ui.MediaSizeWidget.prototype.getOriginalDimensions = function () {
	if ( this.original ) {
		return {
			'height': this.original.height,
			'width': this.original.width
		};
	} else {
		return null;
	}
};

/**
 * Set the original dimensions
 * @param {Object} dimensions Original height/width media dimensions
 */
ve.ui.MediaSizeWidget.prototype.setOriginalDimensions = function ( dimensions ) {
	this.original = dimensions;
};

/**
 * Calculates the aspect ratio between width/height of the original
 * dimensions. This will be redone by original dimensions always to
 * keep the aspect ratio properly defined.
 * @returns {Number} Aspect ratio
 */
ve.ui.MediaSizeWidget.prototype.getAspectRatio = function () {
	return Math.round( this.original.width / this.original.height );
};

/**
 * Checks whether the input values have some problem.
 * Adds an error class to the inputs in case one is found.
 */
ve.ui.MediaSizeWidget.prototype.validateDimensions = function () {
	// Get the current values
	var height = this.inputs.height.$input.val(),
		width =  this.inputs.width.$input.val();

	// Check for an error in the values
	if (
		!$.isNumeric( height ) ||
		!$.isNumeric( width ) ||
		height <= 0 ||
		width <= 0 ||
		height > this.original.height ||
		width > this.original.width
	) {
		this.hasError = true;
		// Show default message
		this.displayError();
	} else {
		this.hideError();
		this.hasError = false;
	}

	// Add or remove the error class from relevant inputs
	if ( this.hasError ) {
		this.inputs.height.$element.addClass( 've-ui-MediaSizeWidget-input-hasError' );
		this.inputs.width.$element.addClass( 've-ui-MediaSizeWidget-input-hasError' );
	} else {
		this.inputs.height.$element.removeClass( 've-ui-MediaSizeWidget-input-hasError' );
		this.inputs.width.$element.removeClass( 've-ui-MediaSizeWidget-input-hasError' );
	}
};

/**
 * Respond to keydown in the height or width inputs
 *
 * @param {jQuery.Event} e Key up event
 */
ve.ui.MediaSizeWidget.prototype.onKeydown = function ( e ) {
	var data = {};

	data[e.data.dir] = this.inputs[e.data.dir].$input.val();
	this.setDimensions( data );
};

/**
 * Set the height/width values to the original media dimensions
 *
 * @param {jQuery.Event} e Click event
 */
ve.ui.MediaSizeWidget.prototype.onButtonOriginalDimensionsClick = function () {
	this.setDimensions( this.original );
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
	this.labels.error.setLabel( msg );
	this.labels.error.$element.show();
};

/**
 * Hide the error message
 */
ve.ui.MediaSizeWidget.prototype.hideError = function () {
	this.labels.error.$element.hide();
};

/**
 * Checks whether there is an error with the widget
 * @returns {Boolean} True if there is an error, false otherwise
 */
ve.ui.MediaSizeWidget.prototype.isError = function () {
	return this.hasError;
};
