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

	// Define button select widget
	this.sizeTypeSelectWidget = new OO.ui.ButtonSelectWidget( {
		'$': this.$,
	} );
	this.sizeTypeSelectWidget.addItems( [
		new OO.ui.ButtonOptionWidget( 'default', {
			'$': this.$,
			'label': ve.msg( 'visualeditor-mediasizewidget-sizeoptions-default' )
		} ),
		// Parsoid has not yet implemented 'upright'; when it is implemented
		// we should re-enable 'scale' option and input
/*
		new OO.ui.ButtonOptionWidget( 'scale', {
			'$': this.$,
			'label': ve.msg( 'visualeditor-mediasizewidget-sizeoptions-scale' )
		} ),
*/
		new OO.ui.ButtonOptionWidget( 'custom', {
			'$': this.$,
			'label': ve.msg( 'visualeditor-mediasizewidget-sizeoptions-custom' )
		} )
	] );
	this.sizeTypeSelectWidget.$element
		.addClass( 've-ui-mediaSizeWidget-section-sizetype' );

	// Define scale
	this.scaleInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );
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
		'align': 'right',
		'label': ve.msg( 'visualeditor-mediasizewidget-label-scale' )
	} );
/*	this.scaleInput.$element.append(
		scalePercentLabel.$element
	);
	fieldScale.$element
		.addClass( 've-ui-mediaSizeWidget-section-scale' );
*/
	fieldCustom = new OO.ui.FieldLayout(
		this.dimensionsWidget, {
		'$': this.$,
		'align': 'right',
		'label': ve.msg( 'visualeditor-mediasizewidget-label-custom' )
	} );
	fieldCustom.$element
		.addClass( 've-ui-mediaSizeWidget-section-custom' );

	// Buttons
	this.fullSizeButton = new OO.ui.ButtonWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-mediasizewidget-button-originaldimensions' ),
	} );
	this.fullSizeButton.$element
		.addClass( 've-ui-mediaSizeWidget-button-fullsize' );

	// Build GUI
	this.$element
		.addClass( 've-ui-mediaSizeWidget' )
		.append( [
			this.sizeTypeSelectWidget.$element,
			// Parsoid has not yet implemented 'upright'. When it is implemented
			// we should re-enable 'scale'. For now, hide it
			// fieldScale.$element,
			fieldCustom.$element,
			this.fullSizeButton.$element,
			this.$( '<div>' )
				.addClass( 've-ui-mediaSizeWidget-label-error' )
				.append( this.errorLabel.$element )
		] );

	// Events
	this.dimensionsWidget.connect( this, { 'widthChange': ['onDimensionsChange', 'width'] } );
	this.dimensionsWidget.connect( this, { 'heightChange': ['onDimensionsChange', 'height'] } );
	// When 'upright' is implemented in parsoid, we should re-enable this
	//this.scaleInput.connect( this, { 'change': 'onScaleChange' } );
	this.sizeTypeSelectWidget.connect( this, { 'select': 'onSizeTypeSelect' } );
	this.fullSizeButton.connect( this, { 'click': 'onFullSizeButtonClick' } );

};

/* Inheritance */

OO.inheritClass( ve.ui.MediaSizeWidget, OO.ui.Widget );

/* Events */

/**
 * @event change
 * @param {Object} dimensions Width and height dimensions
 */

/**
 * @event changeSizeType
 * @param {string} sizeType 'default', 'custom' or 'scale'
 */

/* Methods */

ve.ui.MediaSizeWidget.prototype.onScalableDefaultSizeChange = function ( isDefault ) {
	// Update the default size into the placeholders
	this.resetPlaceholderDimensions();
	// TODO: When 'scale' ('upright' support) is ready, this will need to be adjusted
	// to support that as well
	this.setSizeType(
		isDefault ?
		'default' :
		'custom'
	);
};

/**
 * Respond to width/height input value change. Only update dimensions if
 * the value is numeric. Invoke validation for every change.
 * @param {String} type The input that was updated, 'width' or 'height'
 * @param {String} value The new value of the input
 */
ve.ui.MediaSizeWidget.prototype.onDimensionsChange = function ( type, value ) {
	var dimensions = {};

	if ( value === '' ) {
		value = 0;
	}

	if ( $.isNumeric( value ) ) {
		dimensions[type] = Number( value );
		this.setCurrentDimensions( dimensions );
	}
};

/**
 * Respond to change of the scale input
 */
ve.ui.MediaSizeWidget.prototype.onScaleChange = function () {
	// If the input changed (and not empty), set to 'custom'
	// Otherwise, set to 'default'
	if ( !this.dimensionsWidget.isEmpty() ) {
		this.sizeTypeSelectWidget.selectItem(
			this.sizeTypeSelectWidget.getItemFromData( 'scale' )
		);
	} else {
		this.sizeTypeSelectWidget.selectItem(
			this.sizeTypeSelectWidget.getItemFromData( 'default' )
		);
	}
};

/**
 * Respond to size type change
 * @param {OO.ui.OptionWidget} item Selected size type item
 * @fires changeSizeType
 */
ve.ui.MediaSizeWidget.prototype.onSizeTypeSelect = function ( item ) {
	var selectedType = item && item.getData();

	this.scalable.toggleDefault( selectedType === 'default' );

	if ( selectedType === 'default' ) {
		this.dimensionsWidget.setDisabled( true );
		this.scaleInput.setDisabled( true );
		// If there are placeholders, put them into the values
		if ( !$.isEmptyObject( this.getPlaceholderDimensions() ) ) {
			this.setCurrentDimensions(
				this.getPlaceholderDimensions()
			);
		}
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
		this.validateDimensions();
	}

	this.emit( 'changeSizeType', selectedType );
	this.validateDimensions();
};

/**
 * Set the placeholder value of the scale input
 * @param {number} value Placeholder value
 */
ve.ui.MediaSizeWidget.prototype.setScalePlaceholder = function ( value ) {
	this.scaleInput.$element.attr( 'placeholder', value );
};

/**
 * Get the placeholder value of the scale input
 * @returns {string} Placeholder value
 */
ve.ui.MediaSizeWidget.prototype.getScalePlaceholder = function () {
	return this.scaleInput.$element.attr( 'placeholder' );
};

/**
 * Select an item from the sizeTypeSelectWidget
 * @param {string} [type] The size type representation. Omit to deselect all
 */
ve.ui.MediaSizeWidget.prototype.setSizeType = function ( type ) {
	if ( this.getSizeType !== type ) {
		this.sizeTypeSelectWidget.selectItem(
			this.sizeTypeSelectWidget.getItemFromData( type )
		);
	}
};
/**
 * Retrieve the selected item from the sizeTypeSelectWidget
 */
ve.ui.MediaSizeWidget.prototype.getSizeType = function () {
	return ( this.sizeTypeSelectWidget.getSelectedItem() ? this.sizeTypeSelectWidget.getSelectedItem().getData() : '' );
};

/**
 * Set the scalable object the widget deals with
 * @param {ve.dm.Scalable} scalable A scalable object representing the
 * media source being resized.
 */
ve.ui.MediaSizeWidget.prototype.setScalable = function ( scalable ) {
	if ( this.scalable instanceof ve.dm.Scalable ) {
		this.scalable.disconnect( this );
	}
	this.scalable = scalable;
	// Events
	this.scalable.connect( this, { 'defaultSizeChange': 'onScalableDefaultSizeChange' } );
	// Reset current dimensions to new scalable object
	this.setCurrentDimensions( this.scalable.getCurrentDimensions() );

	// If we don't have original dimensions, disable the full size button
	if ( !this.scalable.getOriginalDimensions() ) {
		this.fullSizeButton.setDisabled( true );
	} else {
		this.fullSizeButton.setDisabled( false );
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
 * Handle click events on the full size button.
 * Set the width/height values to the original media dimensions
 */
ve.ui.MediaSizeWidget.prototype.onFullSizeButtonClick = function () {
	this.setCurrentDimensions( this.scalable.getOriginalDimensions() );
	this.dimensionsWidget.setDisabled( false );
	this.sizeTypeSelectWidget.selectItem(
		this.sizeTypeSelectWidget.getItemFromData( 'custom' )
	);
};

/**
 * Set the image aspect ratio explicitly
 * @param {number} Numerical value of an aspect ratio
 */
ve.ui.MediaSizeWidget.prototype.setRatio = function ( ratio ) {
	this.scalable.setRatio( ratio );
};

/**
 * Get the current aspect ratio
 * @returns {number} Aspect ratio
 */
ve.ui.MediaSizeWidget.prototype.getRatio = function () {
	return this.scalable.getRatio();
};

/**
 * Set the maximum dimensions for the image. These will be limited only if
 * enforcedMax is true.
 * @param {Object} dimensions Height and width
 */
ve.ui.MediaSizeWidget.prototype.setMaxDimensions = function ( dimensions ) {
	// Normalize dimensions before setting
	var maxDimensions = this.scalable.getDimensionsFromValue( dimensions );
	this.scalable.setMaxDimensions( maxDimensions );
};

/**
 * Retrieve the currently defined maximum dimensions
 * @returns {Object} dimensions Height and width
 */
ve.ui.MediaSizeWidget.prototype.getMaxDimensions = function () {
	return this.scalable.getMaxDimensions();
};

/**
 * Retrieve the current dimensions
 * @returns {Object} Width and height
 */
ve.ui.MediaSizeWidget.prototype.getCurrentDimensions = function () {
	return this.currentDimensions;
};

/**
 * Updates the current dimensions in the inputs, either one at a time or both
 *
 * @param {Object} givenDimensions Width and height
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
		!$.isEmptyObject( this.dimensionsWidget.getPlaceholders() ) &&
		( this.currentDimensions.height === 0 || this.currentDimensions.width === 0 )
	) {
		// Use placeholders
		this.dimensionsWidget.setWidth( '' );
		this.dimensionsWidget.setHeight( '' );
		this.scalable.toggleDefault( true );
	} else {
		// This will only update if the value has changed
		this.dimensionsWidget.setWidth( this.currentDimensions.width );
		this.dimensionsWidget.setHeight( this.currentDimensions.height );
		// Update scalable object
		this.scalable.setCurrentDimensions( this.currentDimensions );
	}

	this.validateDimensions();

	// Emit change event
	this.emit( 'change', this.currentDimensions );
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
 * Set placeholder dimensions that will appear in case the widget
 * is empty or set to 0 values. Values are given by scalable's
 * defaultDimensions. If no default dimensions are available,
 * the placeholders are removed.
 */
ve.ui.MediaSizeWidget.prototype.resetPlaceholderDimensions = function () {
	var defaultDimensions = this.scalable.getDefaultDimensions();

	if ( !$.isEmptyObject( defaultDimensions ) ) {
		this.dimensionsWidget.setPlaceholders(
			this.scalable.getDefaultDimensions()
		);
	} else {
		this.dimensionsWidget.removePlaceholders();
	}
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
 * Toggle a disabled state for the full size button
 * @param {Boolean} isDisabled Disabled or not
 */
ve.ui.MediaSizeWidget.prototype.toggleFullSizeButtonDisabled = function ( isDisabled ) {
	this.fullSizeButton.setDisabled( isDisabled );
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
 * @returns {Boolean} Valid or invalid dimension values
 */
ve.ui.MediaSizeWidget.prototype.isValid = function () {
	var itemType = this.sizeTypeSelectWidget.getSelectedItem() ?
		this.sizeTypeSelectWidget.getSelectedItem().getData() : 'custom';

	if ( itemType === 'custom' ) {
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
	} else {
		// Default images are always valid size
		return true;
	}
	// TODO: When 'upright' is implemented in parsoid, add
	// validation for scale
};
