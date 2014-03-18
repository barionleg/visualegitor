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

	labelTimes = new OO.ui.LabelWidget( {}, {
		'$': this.$,
		'label': ve.msg( 'visualeditor-dimensionsWidget-times' )
	} );
	labelPx = new OO.ui.LabelWidget( {}, {
		'$': this.$,
		'label': ve.msg( 'visualeditor-dimensionsWidget-px' )
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
 * @event heightChange
 */

/* Methods */

/**
 * Set placeholder dimension values
 * @param {Object} dimensions Height and width placeholders
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
 * @returns {Object} Placeholder dimensions height and width values
 */
ve.ui.DimensionsWidget.prototype.getPlaceholders = function () {
	return this.placeholders;
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
	);l
};

/**
 * Respond to width change, propogate the input change event
 * @emit widthChange
 */
ve.ui.DimensionsWidget.prototype.onWidthChange = function () {
	this.emit( 'widthChange', this.widthInput.getValue() );
};

/**
 * Respond to height change, propogate the input change event
 * @emit heightChange
 */
ve.ui.DimensionsWidget.prototype.onHeightChange = function () {
	this.emit( 'heightChange', this.heightInput.getValue() );
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
