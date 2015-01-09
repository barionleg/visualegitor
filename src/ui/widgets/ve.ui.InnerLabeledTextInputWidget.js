/*!
 * VisualEditor UserInterface InnerLabeledTextInputWidget class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Text input widget with a result value shown within the text input area opposite the input
 *
 * @class
 * @extends OO.ui.TextInputWidget
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {} []
 */
ve.ui.InnerLabeledTextInputWidget = function VeUiInnerLabeledTextInputWidget( config ) {
	// Configuration initialization
	config = config || {};

	// Parent constructor
	OO.ui.TextInputWidget.call( this, config );

	this.innerLabel = new OO.ui.LabelWidget( {
		$: this.$,
		classes: ['ve-ui-innerLabeledTextInputWidget-innerLabel']
	} );

	this.$element.addClass( 've-ui-innerLabeledTextInputWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.InnerLabeledTextInputWidget, OO.ui.TextInputWidget );
