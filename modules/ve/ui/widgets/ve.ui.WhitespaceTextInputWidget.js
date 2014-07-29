/*!
 * VisualEditor UserInterface WhitespaceTextInputWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Text input widget which hides but preserves leading and trailing whitespace
 *
 * @class
 * @extends OO.ui.TextInputWidget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {String[]} [whitespace] Initial whitespace. Overriden if a value is set.
 * @cfg {Object} [limit] Maximum number of characters to preserve at each end
 */
ve.ui.WhitespaceTextInputWidget = function VeUiWhitespaceTextInputWidget( config ) {
	// Configuration
	config = config || {};

	this.limit = config.limit;
	this.whitespace = [ '', '' ];

	// Parent constructor
	ve.ui.WhitespaceTextInputWidget.super.call( this, config );

	this.$element.addClass( 've-ui-whitespaceTextInputWidget' );

};

/* Inheritance */

OO.inheritClass( ve.ui.WhitespaceTextInputWidget, OO.ui.TextInputWidget );

/* Methods */

/**
 * Set the value of the widget and extract whitespace.
 *
 * @param {string} value Value
 */
ve.ui.WhitespaceTextInputWidget.prototype.setValueAndWhitespace = function ( value ) {
	if ( this.limit ) {
		this.whitespace = [
			value.slice( 0, this.limit ).match( /^\s*/ )[0],
			value.slice( -this.limit ).match( /\s*$/ )[0]
		];
	} else {
		this.whitespace[0] = value.match( /^\s*/ )[0];
		value = value.slice( this.whitespace[0].length );
		this.whitespace[1] = value.match( /\s*$/ )[0];
		value = value.slice( 0, value.length - this.whitespace[1].length );
	}
	this.setValue( value );
};

/**
 * Set the value of the widget and extract whitespace.
 *
 * @param {string[]} whitespace Outer whitespace
 */
ve.ui.WhitespaceTextInputWidget.prototype.setWhitespace = function ( whitespace ) {
	this.whitespace = whitespace;
};

/**
 * @inheritdoc
 */
ve.ui.WhitespaceTextInputWidget.prototype.getValue = function () {
	return this.whitespace[0] + this.value + this.whitespace[1];
};

/**
 * Get the inner/displayed value of text widget, excluding hidden outer whitespace
 *
 * @return {string} Inner/displayed value
 */
ve.ui.WhitespaceTextInputWidget.prototype.getInnerValue = function () {
	return this.value;
};
