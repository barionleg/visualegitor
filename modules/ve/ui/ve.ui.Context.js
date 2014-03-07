/*!
 * VisualEditor UserInterface Context class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * UserInterface context.
 *
 * @class
 * @abstract
 * @extends OO.ui.Element
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Configuration options
 */
ve.ui.Context = function VeUiContext( surface, config ) {
	// Parent constructor
	OO.ui.Element.call( this, config );

	// Properties
	this.surface = surface;
	this.inspectors = new ve.ui.WindowSet( surface, ve.ui.inspectorFactory );
<<<<<<< HEAD
=======

	// Initialization
	this.$element.addClass( 've-ui-context' ).append( this.popup.$element );
	this.inspectors.$element.addClass( 've-ui-context-inspectors' );
	this.popup.$body.append(
		this.$menu.addClass( 've-ui-context-menu' ),
		this.inspectors.$element.addClass( 've-ui-context-inspectors' )
	);

	// Events
	this.surface.getModel().connect( this, { 'select': 'onModelSelect' } );
	this.surface.getView().connect( this, {
		'selectionStart': 'onSelectionStart',
		'selectionEnd': 'onSelectionEnd',
		'relocationStart': 'onRelocationStart',
		'relocationEnd': 'onRelocationEnd',
		'focus': 'onSurfaceFocus',
		'blur': 'onSurfaceBlur'
	} );
	this.inspectors.connect( this, {
		'opening': 'onInspectorOpening',
		'open': 'onInspectorOpen',
		'closing': 'onInspectorClosing',
		'close': 'onInspectorClose'
	} );

	this.$( this.getElementWindow() ).on( {
		'resize': ve.bind( this.update, this )
	} );
	this.$element.add( this.$menu )
		.on( 'mousedown', false );
>>>>>>> WIP Disable certains tools when surface loses focus
};

/* Inheritance */

OO.inheritClass( ve.ui.Context, OO.ui.Element );

/* Methods */

/**
<<<<<<< HEAD
 * Get the surface the context is being used in.
=======
 * Handle selection changes in the model.
 *
 * Changes are ignored while the user is selecting text or relocating content, apart from closing
 * the popup if it's open. While an inspector is opening or closing, all changes are ignored so as
 * to prevent inspectors that change the selection from within their open/close handlers from
 * causing issues.
 *
 * The response to selection changes is deferred to prevent close handlers that process
 * changes from causing this function to recurse. These responses are also batched for efficiency,
 * so that if there are three selection changes in the same tick, afterModelSelect() only runs once.
 *
 * @method
 * @see #afterModelSelect
 */
ve.ui.Context.prototype.onModelSelect = function () {
	if ( this.showing || this.hiding || this.inspectorOpening || this.inspectorClosing ) {
		clearTimeout( this.afterModelSelectTimeout );
	} else {
		if ( this.afterModelSelectTimeout === null ) {
			this.afterModelSelectTimeout = setTimeout( ve.bind( this.afterModelSelect, this ) );
		}
	}
};

/**
 * Deferred response to one or more select events.
 *
 * Update the context menu for the new selection, except if the user is selecting or relocating
 * content. If the popup is open, close it, even while selecting or relocating.
 */
ve.ui.Context.prototype.afterModelSelect = function () {
	this.afterModelSelectTimeout = null;
	if ( this.popup.isVisible() ) {
		this.hide();
	}
	// Bypass while dragging
	if ( this.selecting || this.relocating ) {
		return;
	}
	this.update();
};

/**
 * Respond to focus events on the surfaceView by hiding the context.
 *
 * If there's an inspector open and the user manages to drop the cursor in the surface such that
 * the selection doesn't change (i.e. the resulting model selection is equal to the previous model
 * selection), then #onModelSelect won't cause the inspector to be closed, so we do that here.
 *
 * Hiding the context immediately on focus also avoids flickering phenomena where the inspector
 * remains open or the context remains visible in the wrong place while the selection is visually
 * already moving somewhere else. We deliberately don't call #update to avoid drawing the context
 * in a place that the selection is about to move away from.
 *
 * However, we only do this when clicking out of an inspector. Hiding the context when the document
 * is focused through other means than closing an inspector is actually harmful.
 *
 * We don't have to defer the response to this event because there is no danger that inspectors'
 * close handlers will end up invoking this handler again.
 */
ve.ui.Context.prototype.onSurfaceFocus = function () {
	if ( this.inspectors.getCurrentWindow() ) {
		this.hide();
	}
};

ve.ui.Context.prototype.onSurfaceBlur = function () {
	if ( !this.inspectors.getCurrentWindow() ) {
		this.hide();
	}
};

/**
 * Handle selection start events on the view.
 *
 * @method
 */
ve.ui.Context.prototype.onSelectionStart = function () {
	this.selecting = true;
	this.hide();
};

/**
 * Handle selection end events on the view.
 *
 * @method
 */
ve.ui.Context.prototype.onSelectionEnd = function () {
	this.selecting = false;
	if ( !this.relocating ) {
		this.update();
	}
};

/**
 * Handle selection start events on the view.
 *
 * @method
 */
ve.ui.Context.prototype.onRelocationStart = function () {
	this.relocating = true;
	this.hide();
};

/**
 * Handle selection end events on the view.
 *
 * @method
 */
ve.ui.Context.prototype.onRelocationEnd = function () {
	this.relocating = false;
	this.update();
};

/**
 * Handle an inspector that's being opened.
 *
 * @method
 * @param {ve.ui.Inspector} inspector Inspector that's being opened
 * @param {Object} [config] Inspector opening information
 */
ve.ui.Context.prototype.onInspectorOpening = function () {
	this.selection = this.surface.getModel().getSelection();
	this.inspectorOpening = true;
};

/**
 * Handle an inspector that's been opened.
 *
 * @method
 * @param {ve.ui.Inspector} inspector Inspector that's been opened
 * @param {Object} [config] Inspector opening information
 */
ve.ui.Context.prototype.onInspectorOpen = function () {
	this.inspectorOpening = false;
	this.show( true );
};

/**
 * Handle an inspector that's being closed.
 *
 * @method
 * @param {ve.ui.Inspector} inspector Inspector that's being closed
 * @param {Object} [config] Inspector closing information
 */
ve.ui.Context.prototype.onInspectorClosing = function () {
	this.inspectorClosing = true;
};

/**
 * Handle an inspector that's been closed.
 *
 * @method
 * @param {ve.ui.Inspector} inspector Inspector that's been closed
 * @param {Object} [config] Inspector closing information
 */
ve.ui.Context.prototype.onInspectorClose = function () {
	this.inspectorClosing = false;
	this.update();
};

/**
 * Gets the surface the context is being used in.
>>>>>>> WIP Disable certains tools when surface loses focus
 *
 * @method
 * @returns {ve.ui.Surface} Surface of context
 */
ve.ui.Context.prototype.getSurface = function () {
	return this.surface;
};

/**
 * Get an inspector.
 *
 * @method
 * @param {string} Symbolic name of inspector
 * @returns {ve.ui.Inspector|undefined} Inspector or undefined if none exists by that name
 */
ve.ui.Context.prototype.getInspector = function ( name ) {
	return this.inspectors.getWindow( name );
};

/**
 * Destroy the context, removing all DOM elements.
 *
 * @method
 * @returns {ve.ui.Context} Context UserInterface
 * @chainable
 */
ve.ui.Context.prototype.destroy = function () {
	this.$element.remove();
	return this;
};

/**
 * Hide the context.
 *
 * @method
 * @abstract
 * @chainable
 * @throws {Error} If this method is not overridden in a concrete subclass
 */
ve.ui.Context.prototype.hide = function () {
	throw new Error( 've.ui.Context.hide must be overridden in subclass' );
};
