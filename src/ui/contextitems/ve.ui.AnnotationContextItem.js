/*!
 * VisualEditor AnnotationContextItem class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Context item for an annotation.
 *
 * @class
 * @abstract
 * @extends ve.ui.LinearContextItem
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.AnnotationContextItem = function VeUiAnnotationontextItem( context, model, config ) {
	// Parent constructor
	ve.ui.AnnotationContextItem.super.call( this, context, model, config );

	// Initialization
	this.$element.addClass( 've-ui-annotationContextItem' );

	if ( !this.context.isMobile() ) {
		this.clearButton = new OO.ui.ButtonWidget( {
			title: ve.msg( 'visualeditor-clearbutton-tooltip' ),
			icon: this.constructor.static.clearIcon,
			flags: [ 'destructive' ]
		} );
	} else {
		this.clearButton = new OO.ui.ButtonWidget( {
			framed: false,
			icon: this.constructor.static.clearIcon,
			flags: [ 'destructive' ]
		} );
	}
	if ( this.isClearable() ) {
		this.actionButtons.addItems( [ this.clearButton ], 0 );
	}
	this.clearButton.connect( this, { click: 'onClearButtonClick' } );
};

/* Inheritance */

OO.inheritClass( ve.ui.AnnotationContextItem, ve.ui.LinearContextItem );

/* Static Properties */

ve.ui.AnnotationContextItem.static.clearable = true;
ve.ui.AnnotationContextItem.static.clearIcon = 'cancel';

/* Methods */

ve.ui.AnnotationContextItem.prototype.isClearable = function () {
	return this.constructor.static.clearable;
};

ve.ui.AnnotationContextItem.prototype.onClearButtonClick = function () {
	var i, len,
		modelClasses = this.constructor.static.modelClasses,
		fragment = this.getFragment(),
		annotations = fragment.getAnnotations( true ).filter( function ( annotation ) {
			return ve.isInstanceOfAny( annotation, modelClasses );
		} ).get();
	for ( i = 0, len = annotations.length; i < len; i++ ) {
		fragment.expandLinearSelection( 'annotation', annotations[ i ] ).annotateContent( 'clear', annotations[ i ] );
	}
};
