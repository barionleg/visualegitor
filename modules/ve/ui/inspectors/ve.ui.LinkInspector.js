/*!
 * VisualEditor UserInterface LinkInspector class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Link inspector.
 *
 * @class
 * @extends ve.ui.AnnotationInspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.LinkInspector = function VeUiLinkInspector( manager, config ) {
	// Parent constructor
	ve.ui.AnnotationInspector.call( this, manager, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.LinkInspector, ve.ui.AnnotationInspector );

/* Static properties */

ve.ui.LinkInspector.static.name = 'link';

ve.ui.LinkInspector.static.title = OO.ui.deferMsg( 'visualeditor-linkinspector-title' );

ve.ui.LinkInspector.static.linkTargetInputWidget = ve.ui.LinkTargetInputWidget;

ve.ui.LinkInspector.static.modelClasses = [ ve.dm.LinkAnnotation ];

ve.ui.LinkInspector.static.actions = ve.ui.LinkInspector.super.static.actions.concat( [
	{ 'action': 'open', 'label': 'Open' }
] );

/* Methods */

/**
 * Handle target input change events.
 *
 * Updates the open button's hyperlink location.
 *
 * @param {string} value New target input value
 */
ve.ui.LinkInspector.prototype.onTargetInputChange = function ( value ) {
	var openButton = this.actionButtons.getButtonByAction( 'open' );

	if ( openButton ) {
		openButton
			.setHref( value ).setTarget( '_blank' )
			.setDisabled( !this.isHrefValid( value ) );
	}
};

/**
 * Checks if a hyperlink location is valid.
 *
 * @param {string} value Hyperlink location to check
 * @return {boolean} Hyperlink location is valid
 */
ve.ui.LinkInspector.prototype.isHrefValid = function ( value ) {
	return value.match( /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi )
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.shouldRemoveAnnotation = function () {
	return !this.targetInput.getValue().length;
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getInsertionText = function () {
	return this.targetInput.getValue();
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getAnnotation = function () {
	return this.targetInput.getAnnotation();
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getAnnotationFromFragment = function ( fragment ) {
	return new ve.dm.LinkAnnotation( {
		'type': 'link',
		'attributes': { 'href': fragment.getText() }
	} );
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.initialize = function () {
	// Parent method
	ve.ui.LinkInspector.super.prototype.initialize.call( this );

	// Properties
	this.targetInput = new this.constructor.static.linkTargetInputWidget( {
		'$': this.$,
		'$overlay': this.$frame,
		'disabled': true,
		'classes': [ 've-ui-linkInspector-target' ]
	} );

	// Events
	this.targetInput.connect( this, { 'change': 'onTargetInputChange' } );

	// Initialization
	this.frame.$content.addClass( 've-ui-linkInspector-content' );
	this.form.$element.append( this.targetInput.$element );
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.LinkInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			// Disable surface until animation is complete; will be reenabled in ready()
			this.getFragment().getSurface().disable();
			this.targetInput.setAnnotation( this.initialAnnotation );
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getReadyProcess = function () {
	return ve.ui.LinkInspector.super.prototype.getReadyProcess.call( this )
		.next( function () {
			this.targetInput.setDisabled( false ).focus().select();
			this.getFragment().getSurface().enable();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getHoldProcess = function () {
	return ve.ui.LinkInspector.super.prototype.getHoldProcess.call( this )
		.next( function () {
			this.targetInput.setDisabled( true ).blur();
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.LinkInspector );
