/*!
 * VisualEditor UserInterface LinkAnnotationInspector class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Inspector for linked content.
 *
 * @class
 * @extends ve.ui.AnnotationInspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.LinkAnnotationInspector = function VeUiLinkAnnotationInspector() {
	// Parent constructor
	ve.ui.LinkAnnotationInspector.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.LinkAnnotationInspector, ve.ui.AnnotationInspector );

/* Static properties */

ve.ui.LinkAnnotationInspector.static.name = 'link';

ve.ui.LinkAnnotationInspector.static.title = OO.ui.deferMsg( 'visualeditor-linkinspector-title' );

ve.ui.LinkAnnotationInspector.static.modelClasses = [ ve.dm.LinkAnnotation ];

/* Methods */

/**
 * Handle annotation input change events
 *
 * @param {ve.dm.LinkAnnotation} annotation New link annotation value
 */
ve.ui.LinkAnnotationInspector.prototype.onAnnotationInputChange = function () {
	var newTarget = this.annotationInput.getHref();
	if ( this.initialTarget === this.initialLabel && this.previousTarget === this.labelInput.getValue() ) {
		this.labelInput.setValue( newTarget );
	}
	this.previousTarget = newTarget;
	this.updateActions();
};

/**
 * Update the actions based on the annotation state
 */
ve.ui.LinkAnnotationInspector.prototype.updateActions = function () {
	var inspector = this,
		annotation = this.annotationInput.getAnnotation();

	this.annotationInput.getTextInputWidget().isValid().done( function ( isValid ) {
		isValid = isValid && !!annotation;
		inspector.actions.forEach( { actions: [ 'done', 'insert' ] }, function ( action ) {
			action.setDisabled( !isValid );
		} );
	} );

};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.shouldRemoveAnnotation = function () {
	return !this.annotationInput.getAnnotation();
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getInsertionText = function () {
	return this.labelInput.getValue().trim() || this.annotationInput.getHref();
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getAnnotation = function () {
	return this.annotationInput.getAnnotation();
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getAnnotationFromFragment = function ( fragment ) {
	var text = fragment.getText();

	return text ? new ve.dm.LinkAnnotation( {
		type: 'link',
		attributes: { href: text }
	} ) : null;
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.initialize = function () {
	// Parent method
	ve.ui.LinkAnnotationInspector.super.prototype.initialize.call( this );

	// Properties
	this.labelInput = this.createLabelInput();
	this.annotationInput = this.createAnnotationInput();

	// Events
	this.annotationInput.connect( this, { change: 'onAnnotationInputChange' } );

	// Initialization
	this.form.$element.append( this.labelInput.$element );
	this.form.$element.append( this.annotationInput.$element );
};

/**
 * Create a link label widget
 *
 * @return {OO.ui.TextInputWidget} Link label widget
 */
ve.ui.LinkAnnotationInspector.prototype.createLabelInput = function () {
	return new OO.ui.TextInputWidget( { label: OO.ui.deferMsg( 'visualeditor-linkinspector-label' ) } );
};

/**
 * Create a link annotation widget
 *
 * @return {ve.ui.LinkAnnotationWidget} Link annotation widget
 */
ve.ui.LinkAnnotationInspector.prototype.createAnnotationInput = function () {
	return new ve.ui.LinkAnnotationWidget();
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.shouldInsertText = function () {
	if ( ve.ui.LinkAnnotationInspector.super.prototype.shouldInsertText.call( this ) ) {
		// This mostly means "was there no initial-text?"
		return true;
	}
	if ( this.labelInput.isDisabled() ) {
		// If it's disabled, we've decided we're not competent to edit the label in this situation
		return false;
	}
	if ( this.labelInput.getValue().trim() === this.initialLabel.trim() ) {
		// Don't touch it if the plaintext value hasn't changed, to preserve internal annotations if possible
		return false;
	}
	return true;
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			var fragment = this.getFragment();
			// Disable surface until animation is complete; will be reenabled in ready()
			fragment.getSurface().disable();
			this.initialLabel = fragment.getText();
			this.labelInput.setDisabled( !fragment.containsOnlyText() );
			this.labelInput.setValue( this.initialLabel );
			this.annotationInput.setAnnotation( this.initialAnnotation );
			this.initialTarget = this.previousTarget = this.annotationInput.getHref();
			this.updateActions();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getReadyProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getReadyProcess.call( this, data )
		.next( function () {
			this.annotationInput.getTextInputWidget().focus().select();
			this.getFragment().getSurface().enable();

			// Clear validation state, so that we don't get "invalid" state immediately on focus
			this.annotationInput.getTextInputWidget().setValidityFlag( true );
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getHoldProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getHoldProcess.call( this, data )
		.next( function () {
			this.annotationInput.getTextInputWidget().blur();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getTeardownProcess.call( this, data )
		.next( function () {
			this.annotationInput.setAnnotation( null );
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.LinkAnnotationInspector );
