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
	var fieldScale, fieldCustom;//, scalePercentLabel;

	// Configuration
	config = config || {};

	this.scalable = scalable || {};

	// Parent constructor
	OO.ui.Widget.call( this, config );

	// Properties
	this.ratio = {};
	this.currentDimensions = {};
	this.maxDimensions = {};

	// Define button select widget
	this.sizeTypeSelectWidget = new OO.ui.ButtonSelectWidget( {
		'$': this.$,
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
//	scalePercentLabel = new OO.ui.LabelWidget( {
//		'$': this.$,
//		'input': this.scaleInput,
//		'label': ve.msg( 'visualeditor-mediasizewidget-label-scale-percent' )
//	} );

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
		'align': 'right',
		'label': ve.msg( 'visualeditor-mediasizewidget-label-scale' )
	} );
	fieldCustom = new OO.ui.FieldLayout(
		this.dimensionsWidget, {
		'$': this.$,
		'align': 'right',
		'label': ve.msg( 'visualeditor-mediasizewidget-label-custom' )
	} );

	// Buttons
	this.fullSizeButton = new OO.ui.ButtonWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-button-originaldimensions' ),
	} );

	// Build GUI
	this.$element
		.addClass( 've-ui-mediaSizeWidget' )
		.append( [
			this.sizeTypeSelectWidget.$element
				.addClass( 've-ui-mediaSizeWidget-section-sizetype' ),
			fieldScale.$element
				.addClass( 've-ui-mediaSizeWidget-section-scale' ),
			fieldCustom.$element
				.addClass( 've-ui-mediaSizeWidget-section-custom' ),
			this.fullSizeButton.$element
				.addClass( 've-ui-mediaSizeWidget-button-fullsize' ),
			this.$( '<div>' )
				.addClass( 've-ui-mediaSizeWidget-label-error' )
				.append( this.errorLabel.$element )
		] );

	// Events
	this.dimensionsWidget.connect( this, { 'changeWidth': ['onDimensionsChange', 'width'] } );
	this.dimensionsWidget.connect( this, { 'changeHeight': ['onDimensionsChange', 'height'] } );
	this.scaleInput.connect( this, { 'change': 'onScaleChange' } );
	this.sizeTypeSelectWidget.connect( this, { 'select': 'onSizeTypeSelect' } );
	this.fullSizeButton.connect( this, { 'click': 'onFullSizeButtonClick' } );

};

/* Inheritance */

OO.inheritClass( ve.ui.MediaSizeWidget, OO.ui.Widget );

/* Events */

/**
 * @event change
 */

/* Methods */

/**
 * Respond to width/height input value change. Only update dimensions if
 * the value is numeric. Invoke validation for every change.
 * @param {String} type The input that was updated, 'width' or 'height'
 * @param {String} value The new value of the input
 */
ve.ui.MediaSizeWidget.prototype.onDimensionsChange = function ( type, value ) {
	var obj = {};
	obj[type] = value;

	if ( $.isNumeric( value ) ) {
		this.setCurrentDimensions( obj );
	}
	this.validateDimensions();

	// If the input changed (and not empty), set to 'custom'
	// Otherwise, set to 'default'
	if ( !this.dimensionsWidget.isEmpty() ) {
		this.sizeTypeSelectWidget.selectItem(
			this.sizeTypeSelectWidget.getItemFromData( 'custom' )
		);
	} else {
		this.sizeTypeSelectWidget.selectItem(
			this.sizeTypeSelectWidget.getItemFromData( 'default' )
		);
	}
};

ve.ui.MediaSizeWidget.prototype.onScaleChange = function ( scale ) {
	// If the input changed (and not empty), set to 'custom'
	// Otherwise, set to 'default'
	if ( !this.dimensionsWidget.isEmpty() ) {
		this.sizeTypeSelectWidget.selectItem(
			this.sizeTypeSelectWidget.getItemFromData( 'custom' )
		);
	} else {
		this.sizeTypeSelectWidget.selectItem(
			this.sizeTypeSelectWidget.getItemFromData( 'default' )
		);
	}
};

/**
 * Respond to size type change
 * @param {[type]} item Selected size type item
 */
ve.ui.MediaSizeWidget.prototype.onSizeTypeSelect = function ( item ) {
	var selectedType = item ? item.getData() : '';

	if ( selectedType === 'default' ) {
		this.dimensionsWidget.setDisabled( true );
		this.scaleInput.setDisabled( true );
		// Set the inputs to reflect the values of their placeholders
		this.dimensionsWidget.setValuesToPlaceholders();
		this.scaleInput.setValue( this.getScalePlaceholder() );
	} else if ( selectedType === 'scale' ) {
		// Disable the dimensions widget
		this.dimensionsWidget.setDisabled( true );
		// Enable the scale input
		this.scaleInput.setDisabled( false );
	} else if ( selectedType === 'custom' ) {
		// Enable the dimensions widget
		this.dimensionsWidget.setDisabled( false );
		// Disable the scale input
		this.scaleInput.setDisabled( true );
	}
};

/**
 * Set the placeholder value of the scale input
 * @param {number} value Placeholder value
 */
ve.ui.MediaSizeWidget.prototype.setScalePlaceholder = function( value ) {
	this.scaleInput.$element.attr( 'placeholder', value );
};

/**
 * Get the placeholder value of the scale input
 * @returns {string} Placeholder value
 */
ve.ui.MediaSizeWidget.prototype.getScalePlaceholder = function() {
	return this.scaleInput.$element.attr( 'placeholder' );
};

/**
 * Set the placeholder values of the dimension inputs
 * @param {Object} placeholders The width and height values of the placeholders
 * @param {number} placeholders.width The value of the width input placeholder
 * @param {number} placeholders.height The value of the height input placeholder
 */
ve.ui.MediaSizeWidget.prototype.setDimensionsPlaceholders = function( placeholders ) {
	this.dimensionsWidget.setPlaceholders( placeholders );
};

ve.ui.MediaSizeWidget.prototype.getDimensionsPlaceholders = function() {
	return this.dimensionsWidget.getPlaceholders();
};

/**
 * Select an item from the sizeTypeSelectWidget
 * @param {string} [type] The size type representation. Omit to deselect all
 */
ve.ui.MediaSizeWidget.prototype.setSizeType = function ( type ) {
	this.sizeTypeSelectWidget.selectItem(
		this.sizeTypeSelectWidget.getItemFromData( type )
	);
};

/**
 * Set the scalable object the widget deals with
 * @param {ve.dm.Scalable} scalable A scalable object representing the
 * media source being resized.
 */
ve.ui.MediaSizeWidget.prototype.setScalable = function ( scalable ) {
	this.scalable = scalable;
	// Reset current dimensions to new scalable object
	this.setCurrentDimensions( this.scalable.getCurrentDimensions() );

	// If we don't have original dimensions, disable the full size button
	if ( !this.scalable.getOriginalDimensions() ) {
		this.fullSizeButton.setDisabled( true );
	}
};

/**
 * Get the attached scalable object
 * @returns {ve.dm.Scalable} The scalable object representing the media
 * source being resized.
 */
ve.ui.MediaSizeWidget.prototype.getScalable = function () {
	return this.scalable;
};

/**
 * Set the width/height values to the original media dimensions
 *
 * @param {jQuery.Event} e Click event
 */
ve.ui.MediaSizeWidget.prototype.onFullSizeButtonClick = function () {
	this.setCurrentDimensions( this.scalable.getOriginalDimensions() );
};

ve.ui.MediaSizeWidget.prototype.setRatio = function ( ratio ) {
	this.scalable.setRatio( ratio );
};

ve.ui.MediaSizeWidget.prototype.getRatio = function () {
	return this.scalable.getRatio();
};

ve.ui.MediaSizeWidget.prototype.setMaxDimensions = function ( dimensions ) {
	// Normalize dimensions before setting
	var maxDimensions = this.scalable.getDimensionsFromValue( dimensions );
	this.scalable.setMaxDimensions( maxDimensions );
};

ve.ui.MediaSizeWidget.prototype.getMaxDimensions = function () {
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
		this.dimensionsWidget.getPlaceholders() &&
		( this.currentDimensions.height === 0 || this.currentDimensions.width === 0 )
	) {
		// Use placeholders
		this.dimensionsWidget.setWidth( '' );
		this.dimensionsWidget.setHeight( '' );
	} else {
		// This will only update if the value has changed
		this.dimensionsWidget.setWidth( this.currentDimensions.width );
		this.dimensionsWidget.setHeight( this.currentDimensions.height );
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
	// Normalize dimensions before setting
	this.dimensionsWidget.setPlaceholders(
		this.scalable.getDimensionsFromValue( dimensions )
	);
};

/**
 * Remove the placeholders.
 */
ve.ui.MediaSizeWidget.prototype.removePlaceholderDimensions = function () {
	this.dimensionsWidget.removePlaceholders();
};

/**
 * Return the values of the placeholder dimensions.
 * @returns {Object} The width and height of the placeholder values
 */
ve.ui.MediaSizeWidget.prototype.getPlaceholderDimensions = function () {
	return this.dimensionsWidget.getPlaceholders();
};

/**
 * Check if the custom dimensions are empty.
 * @returns {boolean} Both width/height values are empty
 */
ve.ui.MediaSizeWidget.prototype.isCustomEmpty = function () {
	return this.dimensionsWidget.isEmpty();
};

/**
 * Check if the scale input is empty.
 * @returns {boolean} Scale input value is empty
 */
ve.ui.MediaSizeWidget.prototype.isScaleEmpty = function () {
	return ( this.scaleInput.getValue() === '' );
};

/**
 * Check if all inputs are empty.
 * @returns {boolean} All input values are empty
 */
ve.ui.MediaSizeWidget.prototype.isEmpty = function () {
	return ( this.isCustomEmpty() && this.isScaleEmpty() );
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
		this.getPlaceholderDimensions() &&
		this.dimensionsWidget.isEmpty()
	) {
		return true;
	} else if (
		$.isNumeric( this.dimensionsWidget.getWidth() ) &&
		$.isNumeric( this.dimensionsWidget.getHeight() )
	) {
		return this.scalable.isCurrentDimensionsValid();
	} else {
		return false;
	}
};
