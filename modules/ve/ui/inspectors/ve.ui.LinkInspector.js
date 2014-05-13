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
ve.ui.LinkInspector = function VeUiLinkInspector( config ) {
	// Parent constructor
	ve.ui.AnnotationInspector.call( this, config );

	// Properties
	this.linkNode = null;
};

/* Inheritance */

OO.inheritClass( ve.ui.LinkInspector, ve.ui.AnnotationInspector );

/* Static properties */

ve.ui.LinkInspector.static.name = 'link';

ve.ui.LinkInspector.static.icon = 'link';

ve.ui.LinkInspector.static.title = OO.ui.deferMsg( 'visualeditor-linkinspector-title' );

ve.ui.LinkInspector.static.linkTargetInputWidget = ve.ui.LinkTargetInputWidget;

ve.ui.LinkInspector.static.modelClasses = [ ve.dm.LinkAnnotation ];

/* Methods */

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
 * Get the changes to make to the node that's currently being inspected.
 *
 * This function can either return a plain object with attribute changes to make to the node,
 * or an array with linear model data to replace the node with.
 *
 * This function will only be invoked if this.linkNode is set.
 *
 * @returns {Object|Array} Object with attribute changes, or linear model array
 */
ve.ui.LinkInspector.prototype.getNodeChanges = function () {
	var annotation = this.targetInput.getAnnotation();
	if ( annotation ) {
		return { 'href': this.targetInput.getAnnotation().getAttribute( 'href' ) };
	}
	return {};
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.initialize = function () {
	// Parent method
	ve.ui.LinkInspector.super.prototype.initialize.call( this );

	// Properties
	this.targetInput = new this.constructor.static.linkTargetInputWidget( {
		'$': this.$, '$overlay': this.$contextOverlay || this.$overlay
	} );

	// Initialization
	this.$form.append( this.targetInput.$element );
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.LinkInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			// Disable surface until animation is complete; will be reenabled in ready()
			this.getFragment().getSurface().disable();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkInspector.prototype.getReadyProcess = function () {
	return ve.ui.LinkInspector.super.prototype.getReadyProcess.call( this )
		.next( function () {
			var href;

			// Note: Focus input prior to setting target annotation
			this.targetInput.focus();

			if ( this.linkNode ) {
				href = this.linkNode.getAttribute( 'href' );
				if ( typeof href === 'string' && href.length ) {
					this.targetInput.setValue( href );
				}
			} else {
				this.targetInput.setAnnotation( this.initialAnnotation );
			}
			this.targetInput.select();
			this.getFragment().getSurface().enable();
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.LinkInspector );
