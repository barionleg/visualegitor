/*!
 * VisualEditor UserInterface MediaSizeWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Widget that lets the user edit dimensions (width and height),
 * based on a scalable object.
 *
 * @class
 * @extends OO.ui.Widget
 *
 * @constructor
 * @param {ve.dm.Scalable} scalable A scalable object
 * @param {Object} [config] Configuration options
 */
ve.ui.MediaSizeWidget = function VeUiMediaSizeWidget( scalable, config ) {
	var fieldScale, fieldCustom, scalePercentLabel;

	// Configuration
	config = config || {};

	this.scalable = scalable || {};

	// Parent constructor
	OO.ui.Widget.call( this, config );

	// Properties
	this.ratio = {};
	this.currentDimensions = {};
	this.maxDimensions = {};
	this.placeholders = {};

	// Define button select widget
	this.sizeTypeSelectWidget = new OO.ui.ButtonSelectWidget( {
		'$': this.$
	} );
	this.sizeTypeSelectWidget.addItems( [
		new OO.ui.ButtonOptionWidget( 'default', {
			'$': this.$,
			'label': ve.msg( 'visualeditor-mediasizewidget-sizeoptions-default' )
		} ),
		new OO.ui.ButtonOptionWidget( 'scale', {
			'$': this.$,
			'label': ve.msg( 'visualeditor-mediasizewidget-sizeoptions-scale' )
		} ),
		new OO.ui.ButtonOptionWidget( 'custom', {
			'$': this.$,
			'label': ve.msg( 'visualeditor-mediasizewidget-sizeoptions-custom' )
		} )
	] );

	// Define scale
	this.scaleInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );
	// TODO: Put the percent label after the scale input
	scalePercentLabel = new OO.ui.LabelWidget( {
		'$': this.$,
		'input': this.scaleInput,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-scale-percent' )
	} );

	this.dimensionsWidget = new ve.ui.DimensionsWidget( {
		'$': this.$
	} );

	// Error label is available globally so it can be displayed and
	// hidden as needed
	this.errorLabel = new OO.ui.LabelWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-label-defaulterror' )
	} );

	// Field layouts
	fieldScale = new OO.ui.FieldLayout(
		this.scaleInput, {
		'$': this.$,
		'align': 'inline',
		'label': ve.msg( 'visualeditor-mediasizewidget-label-scale' )
	} );
	fieldCustom = new OO.ui.FieldLayout(
		this.dimensionsWidget, {
		'$': this.$,
		'align': 'inline',
		'label': ve.msg( 'visualeditor-mediasizewidget-label-custom' )
	} );

	// Buttons
	this.fullSizeButton = new OO.ui.ButtonWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-button-fullsize' ),
	} );

	// Build GUI
	this.$element
		.addClass( 've-ui-mediaSizeWidget' )
		.append( [
			this.$sizeSelectWidget.$element
				.addClass( 've-ui-mediaSizeWidget-section-sizeSelectwidget' ),
			fieldScale.$element
				.addClass( 've-ui-mediaSizeWidget-section--scale' ),
			fieldCustom.$element
				.addClass( 've-ui-mediaSizeWidget-section-custom' ),
			this.fullSizeButton.$element
				.addClass( 've-ui-mediaSizeWidget-button-fullsize' ),
			this.$( '<div>' )
				.addClass( 've-ui-mediaSizeWidget-label-error' )
				.append( this.errorLabel.$element )
		] );

	// Events
	this.dimensionsWidget.connect( this, { 'changeWidth': 'onWidthChange' } );
	this.dimensionsWidget.connect( this, { 'changeHeight': 'onHeightChange' } );
	this.scaleInput.connect( this, { 'change': 'onScaleChange' } );
	this.sizeTypeSelectWidget.connect( this, { 'select': 'onSizeTypeSelect' } );
	this.fullSizeButton.connect( this, { 'click': 'onFullSizeButtonClick' } );

	// Initialization
	if ( config.originalDimensions ) {
		this.setOriginalDimensions( config.originalDimensions );
	}
	if ( config.maxDimensions ) {
		this.setMaxDimensions( config.maxDimensions );
	}
};

/* Inheritance */

OO.inheritClass( ve.ui.MediaSizeWidget, OO.ui.Widget );

/* Events */

/**
 * @event change
 */

/* Methods */

/**
 * Respond to width input value change. Only update dimensions if
 * the value is numeric. Invoke validation for every change.
 * @param {String} width New width
 */
ve.ui.MediaSizeWidget.prototype.onWidthChange = function ( width ) {
	if ( $.isNumeric( width ) ) {
		this.setCurrentDimensions( {
			'width': width
		} );
	}
	this.validateDimensions();
};

/**
 * Respond to height input value change. Only update dimensions if
 * the value is numeric. Invoke validation for every change.
 * @param {String} width New width
 */
ve.ui.MediaSizeWidget.prototype.onHeightChange = function ( height ) {
	if ( $.isNumeric( height ) ) {
		this.setCurrentDimensions( {
			'height': height
		} );
	}
	this.validateDimensions();
};

ve.ui.MediaSizeWidget.prototype.onScaleChange = function ( scale ) {
};

ve.ui.MediaSizeWidget.prototype.setRatio = function ( ratio ) {
	this.scalable.setRatio( ratio );
};

ve.ui.MediaSizeWidget.prototype.getRatio = function ( ratio ) {
	return this.scalable.getRatio();
};

ve.ui.MediaSizeWidget.prototype.setMaxDimensions = function ( dimensions ) {
	var maxDimensions = this.scalable.getDimensionsFromValue( dimensions );
	this.scalable.setMaxDimensions( maxDimensions );
};
ve.ui.MediaSizeWidget.prototype.getMaxDimensions = function ( dimensions ) {
	// Normalize dimensions
	return this.scalable.getMaxDimensions();
};

/**
 * Updates the current dimensions in the inputs, either one at a time or both
 *
 * @fires change
 */
ve.ui.MediaSizeWidget.prototype.setCurrentDimensions = function ( givenDimensions ) {
	// Recursion protection
	if ( this.preventChangeRecursion ) {
		return;
	}
	this.preventChangeRecursion = true;

	// Normalize the new dimensions
	this.currentDimensions = this.scalable.getDimensionsFromValue( givenDimensions );

	if (
		// If placeholders are set and dimensions are 0x0, erase input values
		// so placeholders are visible
		this.getPlaceholderDimensions() &&
		( this.currentDimensions.height === 0 || this.currentDimensions.width === 0 )
	) {
		// Use placeholders
		this.widthInput.setValue( '' );
		this.heightInput.setValue( '' );
	} else {
		// This will only update if the value has changed
		this.widthInput.setValue( this.currentDimensions.width );
		this.heightInput.setValue( this.currentDimensions.height );
	}

	// Update scalable object
	this.scalable.setCurrentDimensions( this.currentDimensions );

	this.validateDimensions();

	// Emit change event
	this.emit( 'change' );
	this.preventChangeRecursion = false;
};

/**
 * Validate current dimensions.
 * Explicitly call for validating the current dimensions. This is especially
 * useful if we've changed conditions for the widget, like limiting image
 * dimensions for thumbnails when the image type changes. Triggers the error
 * class if needed.
 *
 * @returns {boolean} Current dimensions are valid
 */
ve.ui.MediaSizeWidget.prototype.validateDimensions = function () {
	var isValid = this.isValid();
	this.errorLabel.$element.toggle( !isValid );
	this.$element.toggleClass( 've-ui-mediaSizeWidget-input-hasError', !isValid );

	return isValid;
};

/**
 * Set placeholder dimensions in case the widget is empty or set to 0 values
 * @param {Object} dimensions Height and width placeholders
 */
ve.ui.MediaSizeWidget.prototype.setPlaceholderDimensions = function ( dimensions ) {
	this.placeholders = this.scalable.getDimensionsFromValue( dimensions );

	// Set the inputs' placeholders
	this.widthInput.$input.attr( 'placeholder', this.placeholders.width );
	this.heightInput.$input.attr( 'placeholder', this.placeholders.height );
};

/**
 * Remove the placeholders.
 */
ve.ui.MediaSizeWidget.prototype.removePlaceholderDimensions = function () {
	this.placeholders = {};
};

/**
 * Return the values of the placeholder dimensions.
 * @returns {Object} The width and height of the placeholder values
 */
ve.ui.MediaSizeWidget.prototype.getPlaceholderDimensions = function () {
	return this.placeholders;
};

/**
 * Check whether the current value inputs are valid
 * 1. If placeholders are visible, the input is valid
 * 2. If inputs have non numeric values, input is invalid
 * 3. If inputs have numeric values, validate through scalable
 *    calculations to see if the dimensions follow the rules.
 * @returns {Boolean} [description]
 */
ve.ui.MediaSizeWidget.prototype.isValid = function () {
	if (
		this.placeholders &&
		this.heightInput.getValue() === '' &&
		this.widthInput.getValue() === ''
	) {
		return true;
	} else if (
		$.isNumeric( this.widthInput.getValue() ) &&
		$.isNumeric( this.heightInput.getValue() )
	) {
		return this.scalable.isCurrentDimensionsValid();
	} else {
		return false;
	}
};





























/**
 * Check if both inputs are empty, so to use their placeholders
 * @returns {boolean}
 */
ve.ui.MediaSizeWidget.prototype.isEmpty = function () {
	return ( this.widthInput.getValue() === '' && this.heightInput.getValue() === '' );
};

/**
 * Overridden from ve.Scalable to allow one dimension to be set
 * at a time, write values back to inputs and show any errors.
 *
 * @fires change
 *
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

	if (
		// If placeholders are set and dimensions are 0x0, erase input values
		// so placeholders are visible
		this.getPlaceholderDimensions() &&
		( dimensions.height === 0 || dimensions.width === 0 )
	) {
		// Use placeholders
		this.widthInput.setValue( '' );
		this.heightInput.setValue( '' );
	} else {
		// This will only update if the value has changed
		this.widthInput.setValue( this.getCurrentDimensions().width );
		this.heightInput.setValue( this.getCurrentDimensions().height );
	}

	this.validateDimensions();

	// Emit change event
	this.emit( 'change' );
	this.preventChangeRecursion = false;
};


/** */
ve.ui.MediaSizeWidget.prototype.setOriginalDimensions = function ( dimensions ) {
	// Parent method
	ve.Scalable.prototype.setOriginalDimensions.call( this, dimensions );

	// Enable the 'original dimensions' button
	if ( this.showOriginalDimensionsButton ) {
		this.originalDimensionsButton.setDisabled( false );
	}
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
