/*!
 * VisualEditor UserInterface DimensionsWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Widget that visually displays width and height inputs.
 * This widget is for presentation-only, no calculation is done.
 *
 * @class
 * @extends OO.ui.Widget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.DimensionsWidget = function VeUiDimensionsWidget( config ) {
	var labelTimes, labelPx;

	// Configuration
	config = config || {};

	this.placeholders = config.placeholders || {};

	// Parent constructor
	OO.ui.Widget.call( this, config );

	this.widthInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );
	this.heightInput = new OO.ui.TextInputWidget( {
		'$': this.$
	} );

	labelTimes = new OO.ui.LabelWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-dimensionswidget-times' )
	} );
	labelPx = new OO.ui.LabelWidget( {
		'$': this.$,
		'label': ve.msg( 'visualeditor-dimensionswidget-px' )
	} );

	// Events
	this.widthInput.connect( this, { 'change': 'onWidthChange' } );
	this.heightInput.connect( this, { 'change': 'onHeightChange' } );

	// Setup

	this.$element
		.addClass( 've-ui-dimensionsWidget' )
		.append( [
			this.widthInput.$element,
			labelTimes.$element
				.addClass( 've-ui-dimensionsWidget-label-times' ),
			this.heightInput.$element,
			labelPx.$element
				.addClass( 've-ui-dimensionsWidget-label-px' )
		] );
};

/* Inheritance */

OO.inheritClass( ve.ui.DimensionsWidget, OO.ui.Widget );

/* Events */

/**
 * @event widthChange
 * @param {string} value The new width
 */

/**
 * @event heightChange
 * @param {string} value The new width
 */

/* Methods */

/**
 * Respond to width change, propogate the input change event
 * @param {string} value The new changed value
 * @fires widthChange
 */
ve.ui.DimensionsWidget.prototype.onWidthChange = function ( value ) {
	this.emit( 'widthChange', value );
};

/**
 * Respond to height change, propogate the input change event
 * @param {string} value The new changed value
 * @fires heightChange
 */
ve.ui.DimensionsWidget.prototype.onHeightChange = function ( value ) {
	this.emit( 'heightChange', value );
};

/**
 * Set placeholder dimension values
 * @param {Object} dimensions Width and height placeholders
 */
ve.ui.DimensionsWidget.prototype.setPlaceholders = function ( dimensions ) {
	if ( dimensions && dimensions.width && dimensions.height ) {
		this.placeholders = dimensions;
		this.widthInput.$input.attr( 'placeholder', this.placeholders.width );
		this.heightInput.$input.attr( 'placeholder', this.placeholders.height );
	}
};

/**
 * Get the current placeholder values
 * @returns {Object} Placeholder dimensions width and height values
 */
ve.ui.DimensionsWidget.prototype.getPlaceholders = function () {
	return this.placeholders;
};

/**
 * Reset and remove the placeholder values
 */
ve.ui.DimensionsWidget.prototype.removePlaceholders = function () {
	this.placeholders = {};
	this.widthInput.$input.attr( 'placeholder', '' );
	this.heightInput.$input.attr( 'placeholder', '' );
};

/**
 * Check whether the widget is empty. This indicates that placeholders,
 * if they exist, are shown.
 * @returns {boolean} Both values are empty
 */
ve.ui.DimensionsWidget.prototype.isEmpty = function () {
	return (
		this.widthInput.getValue() === '' &&
		this.heightInput.getValue() === ''
	);
};

/**
 * Set an empty value for the dimensions inputs so they show
 * the placeholders if those exist.
 */
ve.ui.DimensionsWidget.prototype.clear = function () {
	this.widthInput.setValue( '' );
	this.heightInput.setValue( '' );
};

/**
 * Set the values of the width and height inputs to those of the
 * placeholders.
 */
ve.ui.DimensionsWidget.prototype.setValuesToPlaceholders = function () {
	this.setDimensions( this.getPlaceholders() );
};

/**
 * Set the dimensions value of the inputs
 * @param {Object} dimensions The width and height values of the inputs
 * @param {number} dimensions.width The value of the width input
 * @param {number} dimensions.height The value of the height input
 */
ve.ui.DimensionsWidget.prototype.setDimensions = function ( dimensions ) {
	dimensions = dimensions || {};
	if ( dimensions.width ) {
		this.setWidth( dimensions.width );
	}
	if ( dimensions.height ) {
		this.setHeight( dimensions.height );
	}
};

/**
 * Return the current dimension values in the widget
 * @returns {Object} dimensions The width and height values of the inputs
 * @returns {number} dimensions.width The value of the width input
 * @returns {number} dimensions.height The value of the height input
 */
ve.ui.DimensionsWidget.prototype.getDimensions = function () {
	return {
		'width': this.widthInput.getValue(),
		'height': this.heightInput.getValue()
	};
};

/**
 * Disable or enable the inputs
 * @param {boolean} isDisabled Set disabled or enabled
 */
ve.ui.DimensionsWidget.prototype.setDisabled = function ( isDisabled ) {
	// The 'setDisabled' method runs in the constructor before the
	// inputs are initialized
	if ( this.widthInput ) {
		this.widthInput.setDisabled( isDisabled );
	}
	if ( this.heightInput ) {
		this.heightInput.setDisabled( isDisabled );
	}
};

/**
 * Get the current value in the width input
 * @returns {String} Input value
 */
ve.ui.DimensionsWidget.prototype.getWidth = function () {
	return this.widthInput.getValue();
};

/**
 * Get the current value in the height input
 * @returns {String} Input value
 */
ve.ui.DimensionsWidget.prototype.getHeight = function () {
	return this.heightInput.getValue();
};

/**
 * Set a value for the width input
 * @param {String} value
 */
ve.ui.DimensionsWidget.prototype.setWidth = function ( value ) {
	this.widthInput.setValue( value );
};

/**
 * Set a value for the height input
 * @param {String} value
 */
ve.ui.DimensionsWidget.prototype.setHeight = function ( value ) {
	this.heightInput.setValue( value );
};
