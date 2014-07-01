/*!
 * VisualEditor UserInterface DesktopContext class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Context menu and inspectors.
 *
 * @class
 * @extends ve.ui.Context
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Configuration options
 */
ve.ui.DesktopContext = function VeUiDesktopContext( surface, config ) {
	// Parent constructor
	ve.ui.Context.call( this, surface, config );

	// Properites
	this.menu = new ve.ui.ContextMenuWidget( { '$': this.$ } );
	this.popup = new OO.ui.PopupWidget( { '$': this.$, '$container': this.surface.$element } );
	this.transitioning = null;
	this.inspector = null;
	this.suppressed = false;
	this.afterModelChangeTimeout = null;
	this.afterModelChangeRange = null;
	this.onWindowResizeHandler = ve.bind( this.onWindowResize, this );
	this.afterModelChangeHandler = ve.bind( this.afterModelChange, this );
	this.$window = this.$( this.getElementWindow() );

	// Events
	this.surface.getModel().connect( this, {
		'documentUpdate': 'onModelChange',
		'select': 'onModelChange'
	} );
	this.surface.getView().connect( this, {
		'selectionStart': 'onSuppress',
		'selectionEnd': 'onUnsuppress',
		'relocationStart': 'onSuppress',
		'relocationEnd': 'onUnsuppress',
		'blur': 'onSuppress',
		'focus': 'onUnsuppress',
		'position': 'onSurfacePosition'
	} );
	this.inspectors.connect( this, { 'opening': 'onInspectorOpening' } );
	this.menu.connect( this, { 'choose': 'onContextItemChoose' } );
	this.$window.on( 'resize', this.onWindowResizeHandler );
	this.$element.on( 'mousedown', false );

	// Initialization
	this.$element
		.addClass( 've-ui-desktopContext' )
		.append( this.popup.$element );
	this.menu.$element.addClass( 've-ui-desktopContext-menu' );
	this.inspectors.$element.addClass( 've-ui-desktopContext-inspectors' );
	this.popup.$body.append( this.menu.$element, this.inspectors.$element );
};

/* Inheritance */

OO.inheritClass( ve.ui.DesktopContext, ve.ui.Context );

/* Methods */

/**
 * Handle model change event.
 *
 * While an inspector is opening or closing, all changes are ignored so as to prevent inspectors
 * that change the selection from within their setup or teardown processes changing context state.
 *
 * The response to selection changes is deferred to prevent teardown processes handlers that change
 * the selection from causing this function to recurse. These responses are also debounced for
 * efficiency, so that if there are three selection changes in the same tick, #afterModelChange only
 * runs once.
 *
 * @method
 * @param {ve.Range} range Range if triggered by selection change, null otherwise
 * @see #afterModelChange
 */
ve.ui.DesktopContext.prototype.onModelChange = function ( range ) {
	if ( this.inspector && ( this.inspector.isOpening() || this.inspector.isClosing() ) ) {
		// Cancel debounced change handler
		clearTimeout( this.afterModelChangeTimeout );
		this.afterModelChangeTimeout = null;
		this.afterModelChangeRange = null;
	} else {
		if ( this.afterModelChangeTimeout === null ) {
			// Ensure change is handled on next cycle
			this.afterModelChangeTimeout = setTimeout( this.afterModelChangeHandler );
		}
		if ( range instanceof ve.Range ) {
			// Store the latest range
			this.afterModelChangeRange = range;
		}
	}
	// Purge available tools cache
	this.availableTools = null;
};

/**
 * Deferred response to one or more select event.
 *
 * Update the context menu for the new selection, except if the user is selecting or relocating
 * content. If the popup is open, close it, even while selecting or relocating.
 */
ve.ui.DesktopContext.prototype.afterModelChange = function () {
	var selection, inspectable;

	// Reset debouncing state
	this.afterModelChangeTimeout = null;
	this.afterModelChangeRange = null;

	// Bypass while dragging
	if ( this.suppressed ) {
		return;
	}

	inspectable = this.isInspectable();
	if ( this.isVisible() ) {
		selection = this.surface.getModel().getSelection();
		if ( this.menu.isVisible() ) {
			if ( inspectable ) {
				// Change state: menu -> menu
				this.populateMenu();
				this.updateDimensions();
			} else {
				// Change state: menu -> closed
				this.menu.toggle( false );
				this.toggle( false );
			}
		} else if ( this.inspector ) {
			// Change state: inspector -> (closed|menu)
			this.inspector.close();
		}
	} else {
		if ( inspectable ) {
			// Change state: closed -> menu
			this.toggle( true );
			this.menu.toggle( true );
			this.populateMenu();
			this.updateDimensions();
		}
	}
};

/**
 * Handle context supression event.
 */
ve.ui.DesktopContext.prototype.onSuppress = function () {
	this.suppressed = true;

	if ( this.isVisible() ) {
		if ( this.menu.isVisible() ) {
			// Change state: menu -> closed
			this.menu.toggle( false );
			this.toggle( false );
		} else if ( this.inspector ) {
			// Change state: inspector -> closed
			this.inspector.close();
		}
	}
};

/**
 * Handle context unsupression event.
 */
ve.ui.DesktopContext.prototype.onUnsuppress = function () {
	var inspectable = !!this.getAvailableTools().length;

	this.suppressed = false;

	if ( inspectable ) {
		// Change state: closed -> menu
		this.toggle( true );
		this.menu.toggle( true );
		this.populateMenu();
		this.updateDimensions();
	}
};

/**
 * Handle surface position event.
 */
ve.ui.DesktopContext.prototype.onSurfacePosition = function () {
	this.updateDimensions( true );
};

/**
 * Handle an inspector opening event.
 *
 * @method
 * @param {OO.ui.Window} win Window that's being opened
 * @param {jQuery.Promise} opening Promise resolved when window is opened; when the promise is
 *   resolved the first argument will be a promise which will be resolved when the window begins
 *   closing, the second argument will be the opening data
 * @param {Object} data Window opening data
 */
ve.ui.DesktopContext.prototype.onInspectorOpening = function ( win, opening ) {
	this.inspector = win;

	if ( this.menu.isVisible() ) {
		// Change state: menu -> inspector
		this.menu.toggle( false );
	} else if ( !this.isVisible() ) {
		// Change state: closed -> inspector
		this.toggle( true );
	}

	opening
		.progress( ve.bind( function ( data ) {
			if ( data.state === 'setup' || data.state === 'ready' ) {
				this.updateDimensions( true );
			}
		}, this ) )
		.always( ve.bind( function ( opened ) {
			opened.always( ve.bind( function ( closed ) {
				closed.always( ve.bind( function () {
					var inspectable = !!this.getAvailableTools().length;

					this.inspector = null;

					if ( inspectable ) {
						// Change state: inspector -> menu
						this.menu.toggle( true );
						this.populateMenu();
						this.updateDimensions();
					} else {
						// Change state: inspector -> closed
						this.toggle( false );
					}

					// Restore selection
					if ( this.getSurface().getModel().getSelection() ) {
						this.getSurface().getView().focus();
					}
				}, this ) );
			}, this ) );
		}, this ) );
};

/**
 * Handle window resize events.
 */
ve.ui.DesktopContext.prototype.onWindowResize = function () {
	if ( this.isVisible() ) {
		this.updateDimensions();
	}
};

/**
 * Handle context item choose events.
 *
 * @param {ve.ui.ContextItemWidget} item Chosen item
 */
ve.ui.DesktopContext.prototype.onContextItemChoose = function ( item ) {
	if ( item ) {
		item.getCommand().execute( this.surface );
	}
};

/**
 * Check if context can be embedded onto the currently focused node.
 *
 * @return {boolean} Context can be embedded
 */
ve.ui.DesktopContext.prototype.isEmbeddable = function () {
	var dim,
		node = this.surface.getView().getFocusedNode();

	if ( node instanceof ve.ce.FocusableNode ) {
		dim = node.getDimensions();
		return (
			// HACK: `5` and `10` are estimates of what `0.25em` and `0.5em` (the margins of the
			// menu when embedded) are in pixels, what needs to actually be done is to take
			// measurements to find the margins and use those value instead
			dim.height > this.menu.$element.outerHeight() + 5 &&
			dim.width > this.menu.$element.outerWidth() + 10
		);
	}
	return false;
};

/**
 * Get context menu.
 *
 * @return {ve.ui.ContextMenu}
 */
ve.ui.DesktopContext.prototype.getMenu = function () {
	return this.menu;
};

/**
 * Get available tools.
 *
 * Result is cached, and cleared when the model or selection changes.
 *
 * @returns {Object[]} List of objects containing `tool` and `model` properties, representing each
 *   compatible tool and the node or annotation it is compatible with
 */
ve.ui.DesktopContext.prototype.getAvailableTools = function () {
	if ( !this.availableTools ) {
		this.availableTools = ve.ui.toolFactory.getToolsForFragment(
			this.surface.getModel().getFragment( null, false )
		);
	}
	return this.availableTools;
};

/**
 * Check if current content is inspectable.
 *
 * @return {boolean} Content is inspectable
 */
ve.ui.DesktopContext.prototype.isInspectable = function () {
	return !!this.getAvailableTools().length;
};

/**
 * Update the contents of the menu.
 *
 * @chainable
 */
ve.ui.DesktopContext.prototype.populateMenu = function () {
	var i, len, tool,
		items = [],
		tools = this.getAvailableTools();

	this.menu.clearItems();
	if ( tools.length ) {
		for ( i = 0, len = tools.length; i < len; i++ ) {
			tool = tools[i];
			items.push( new ve.ui.ContextItemWidget(
				tool.tool.static.name, tool.tool, tool.model, { '$': this.$ }
			) );
		}
		this.menu.addItems( items );
	}

	return this;
};

/**
 * Update the size and position of the context.
 *
 * @param {boolean} [transition] Smoothly transition from previous size and position
 */
ve.ui.DesktopContext.prototype.updateDimensions = function ( transition ) {
	var $container, focusedOffset, focusedDimensions, cursorPosition, position,
		surface = this.surface.getView(),
		focusedNode = surface.getFocusedNode(),
		surfaceOffset = surface.$element.offset(),
		rtl = this.surface.getModel().getDocument().getDir() === 'rtl',
		embeddable = this.isEmbeddable();

	$container = this.inspector ? this.inspector.$frame : this.menu.$element;
	if ( focusedNode ) {
		this.popup.toggleAnchor( !embeddable );
		// Get the position relative to the surface it is embedded in
		focusedOffset = focusedNode.getRelativeOffset();
		focusedDimensions = focusedNode.getDimensions();
		if ( embeddable ) {
			position = { 'y': focusedOffset.top };
			// When context is embedded in RTL, it requires adjustments to the relative
			// positioning (pop up on the other side):
			if ( rtl ) {
				position.x = focusedOffset.left;
				this.popup.align = 'left';
			} else {
				position.x = focusedOffset.left + focusedDimensions.width;
				this.popup.align = 'right';
			}
		} else {
			// Get the position of the focusedNode:
			position = {
				'x': focusedOffset.left + focusedDimensions.width / 2,
				'y': focusedOffset.top + focusedDimensions.height
			};
			this.popup.align = 'center';
		}
	} else {
		// We're on top of a selected text
		// Get the position of the cursor
		cursorPosition = surface.getSelectionRect();
		if ( cursorPosition ) {
			// Correct for surface offset:
			position = {
				'x': cursorPosition.end.x - surfaceOffset.left,
				'y': cursorPosition.end.y - surfaceOffset.top
			};
		}
		// If !cursorPosition, the surface apparently isn't selected, so getSelectionRect()
		// returned null. This shouldn't happen because the context is only supposed to be
		// displayed in response to a selection, but for some reason this does happen when opening
		// an inspector without changing the selection.
		// Skip updating the cursor position, but still update the width and height.

		this.popup.align = 'center';
	}

	if ( position ) {
		this.$element.css( { 'left': position.x, 'top': position.y } );
	}

	this.popup.display(
		$container.outerWidth( true ),
		$container.outerHeight( true ),
		false && transition
	);

	return this;
};

/**
 * @inheritdoc
 */
ve.ui.DesktopContext.prototype.toggle = function ( show ) {
	var promise;

	if ( this.transitioning ) {
		return this.transitioning;
	}
	show = show === undefined ? !this.visible : !!show;
	if ( show === this.visible ) {
		return $.Deferred().resolve().promise();
	}

	this.visible = show;
	this.transitioning = $.Deferred();
	promise = this.transitioning.promise();

	// HACK: make the context and popup visibility: hidden; instead of display: none; because
	// they contain inspector iframes, and applying display: none; to those causes them to
	// not load in Firefox
	this.$element.add( this.popup.$element ).css( 'visibility', show ? '' : 'hidden' );
	this.popup.$element.toggle( show );
	this.popup.toggle( show );
	this.popup.setClipping( show );

	this.transitioning.resolve();
	this.transitioning = null;
	this.visible = show;

	if ( show ) {
		this.updateDimensions();
	} else if ( this.inspector ) {
		this.inspector.close();
	}

	return promise;
};

/**
 * @inheritdoc
 */
ve.ui.DesktopContext.prototype.destroy = function () {
	// Disconnect
	this.surface.getModel().disconnect( this );
	this.surface.getView().disconnect( this );
	this.inspectors.disconnect( this );
	this.menu.disconnect( this );
	this.$window.off( 'resize', this.onWindowResizeHandler );

	// Stop timers
	clearTimeout( this.afterModelChangeTimeout );

	// Parent method
	return ve.ui.DesktopContext.super.prototype.destroy.call( this );
};
