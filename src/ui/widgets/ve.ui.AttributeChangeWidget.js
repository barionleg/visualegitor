/*!
 * VisualEditor UserInterface AttributeChangeWidget class.
 *
 * @copyright See AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Creates a ve.ui.AttributeChangeWidget object.
 *
 * @class
 * @extends OO.ui.OptionWidget
 *
 * @constructor
 * @param {Object} config Configuration options
 */
ve.ui.AttributeChangeWidget = function VeUiAttributeChangeWidget( config ) {
	// Parent constructor
	ve.ui.AttributeChangeWidget.super.call( this, config );

	// DOM
	this.$element.addClass( 've-ui-attributeChangeWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.AttributeChangeWidget, OO.ui.OptionWidget );
