/*!
 * VisualEditor ContentEditable FocusableNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable focusable node.
 *
 * Focusable elements have a special treatment by ve.ce.Surface. When the user selects only a single
 * node, if it is focusable, the surface will set the focusable node's focused state. Other systems,
 * such as the context, may also use a focusable node's $focusable property as a hint of where the
 * primary element in the node is. Typically, and by default, the primary element is the root
 * element, but in some cases it may need to be configured to be a specific child element within the
 * node's DOM rendering.
 *
 * If your focusable node changes size and the highlight must be redrawn, call redrawHighlights().
 * 'resizeEnd' and 'rerender' are already bound to call this.
 *
 * @class
 * @abstract
 *
 * @constructor
 * @param {jQuery} [$focusable=this.$element] Primary element user is focusing on
 */
ve.ce.FocusableNode = function VeCeFocusableNode( $focusable ) {
	// Properties
	this.focused = false;
	this.highlighted = false;
	this.shielded = false;
	this.isSetup = false;
	this.$shields = this.$( [] );
	this.$highlights = this.$( [] );
	this.$focusable = $focusable || this.$element;
	this.surface = null;

	// Events
	this.connect( this, {
		'setup': 'onFocusableSetup',
		'teardown': 'onFocusableTeardown',
		'resizeStart': 'onFocusableResizeStart',
		'resizeEnd': 'onFocusableResizeEnd',
		'resizing': 'onFocusableResizing',
		'rerender': 'onFocusableRerender',
		'live': 'onFocusableLive'
	} );
};

/* Events */

/**
 * @event focus
 */

/**
 * @event blur
 */

/* Static Methods */

ve.ce.FocusableNode.static = {};

ve.ce.FocusableNode.static.isFocusable = true;

/* Methods */

/**
 * Create a shield element.
 *
 * Uses data URI to inject a 1x1 transparent GIF image into the DOM.
 *
 * @returns {jQuery} A shield element
 */
ve.ce.FocusableNode.prototype.createShield = function () {
	return this.$( '<img>' )
		.addClass( 've-ce-focusableNode-shield' )
		.attr( 'src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' );
};

/**
 * Create a highlight element.
 *
 * @returns {jQuery} A highlight element
 */
ve.ce.FocusableNode.prototype.createHighlight = function () {
	return this.$( '<div>' )
		.addClass( 've-ce-focusableNode-highlight' )
		.attr( 'draggable', false );
};

/**
 * Handle setup event.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableSetup = function () {
	// Exit if already setup or not unattached
	if ( this.isSetup || !this.root ) {
		return;
	}

	this.surface = this.getRoot().getSurface();

	// DOM changes
	this.$element
		.addClass( 've-ce-focusableNode' )
		.prop( 'contentEditable', 'false' );

	// Events
	this.$element.on( {
		'mouseenter.ve-ce-focusableNode': ve.bind( this.onFocusableMouseEnter, this ),
		'mousedown.ve-ce-focusableNode': ve.bind( this.onFocusableMouseDown, this )
	} );
};

/**
 * Handle node live.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableLive = function () {
	var surfaceModel = this.root.getSurface().getModel();

	if ( this.live ) {
		surfaceModel.connect( this, { 'history': 'onFocusableHistory' } );
	} else {
		surfaceModel.disconnect( this, { 'history': 'onFocusableHistory' } );
	}
};

/**
 * Attach shields to the node.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.attachShields = function () {
	if ( this.shielded ) {
		return;
	}

	var node = this;

	// Events
	this.surface.connect( this, { 'position': 'positionHighlights' } );

	// Shields
	this.$element.add( this.$element.find( '*' ) ).each( function () {
		if ( this.nodeType === Node.ELEMENT_NODE ) {
			var cssFloat, $this = node.$( this );
			if (
				// Always shield the root
				!$this.hasClass( 've-ce-focusableNode' ) &&
				// Highlights are built off shields, so make sure $focusable has a shield
				!$this.is( node.$focusable )
			) {
				// .css( 'float' ) is *very* expensive so compute at
				// last possible opportunity
				cssFloat = $this.css( 'float' );
				if ( cssFloat === 'none' || cssFloat === '' ) {
					return;
				}
			}
			node.$shields = node.$shields.add( node.createShield().appendTo( $this ) );
			$this.addClass( 've-ce-focusableNode-shielded' );
		}
	} );

	this.shielded = true;
};

/**
 * Handle history event.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableHistory = function () {
	if ( this.focused ) {
		this.redrawHighlights();
	}
};

/**
 * Handle teardown events.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableTeardown = function () {
	// Exit if not setup or not attached
	if ( !this.isSetup || !this.root ) {
		return;
	}

	// Events
	this.$element.off( '.ve-ce-focusableNode' );
	this.surface.disconnect( this, { 'position': 'positionHighlights' } );

	// Shields
	this.$shields.remove();
	this.$shields = this.$( [] );
	this.$element.add( this.$element.find( '.ve-ce-focusableNode-shielded' ) )
		.removeClass( 've-ce-focusableNode-shielded' );

	// Highlights
	this.clearHighlights();

	// DOM changes
	this.$element
		.removeClass( 've-ce-focusableNode' )
		.removeProp( 'contentEditable' );

	this.isSetup = false;
	this.shielded = false;
};

/**
 * Handle highlight mouse down events.
 *
 * @method
 * @param {jQuery.Event} e Mouse down event
 */
ve.ce.FocusableNode.prototype.onFocusableMouseDown = function ( e ) {
	var surfaceModel = this.surface.getModel(),
		selectionRange = surfaceModel.getSelection(),
		nodeRange = this.model.getOuterRange();

	surfaceModel.getFragment(
		e.shiftKey ?
			ve.Range.newCoveringRange(
				[ selectionRange, nodeRange ], selectionRange.from > nodeRange.from
			) :
			nodeRange
	).select();

	e.preventDefault();
	// Abort mousedown events otherwise the surface will go into
	// dragging mode on touch devices
	e.stopPropagation();
};

/**
 * Handle mouse enter events.
 *
 * @method
 * @param {jQuery.Event} e Mouse enter event
 */
ve.ce.FocusableNode.prototype.onFocusableMouseEnter = function () {
	this.attachShields();
	if ( !this.root.getSurface().dragging && !this.root.getSurface().resizing ) {
		this.createHighlights();
	}
};

/**
 * Handle surface mouse move events.
 *
 * @method
 * @param {jQuery.Event} e Mouse move event
 */
ve.ce.FocusableNode.prototype.onSurfaceMouseMove = function ( e ) {
	var $target = this.$( e.target );
	if (
		!$target.hasClass( 've-ce-focusableNode-phantom' ) &&
		$target.closest( '.ve-ce-focusableNode' ).length === 0
	) {
		this.clearHighlights();
	}
};

/**
 * Handle surface mouse out events.
 *
 * @method
 * @param {jQuery.Event} e
 */
ve.ce.FocusableNode.prototype.onSurfaceMouseOut = function ( e ) {
	if ( e.toElement === null ) {
		this.clearHighlights();
	}
};

/**
 * Handle resize start events.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableResizeStart = function () {
	this.clearHighlights();
};

/**
 * Handle resize end event.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableResizeEnd = function () {
	this.redrawHighlights();
};

/**
 * Handle resizing event.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableResizing = function () {
	if ( this.focused && !this.outline ) {
		this.redrawHighlights();
	}
};

/**
 * Handle rerender event.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.onFocusableRerender = function () {
	if ( this.focused ) {
		this.redrawHighlights();
		// reposition menu
		this.surface.getSurface().getContext().update( true, true );
	}
};

/**
 * Check if node is focused.
 *
 * @method
 * @returns {boolean} Node is focused
 */
ve.ce.FocusableNode.prototype.isFocused = function () {
	return this.focused;
};

/**
 * Set the selected state of the node.
 *
 * @method
 * @param {boolean} value Node is focused
 * @fires focus
 * @fires blur
 */
ve.ce.FocusableNode.prototype.setFocused = function ( value ) {
	value = !!value;
	if ( this.focused !== value ) {
		this.focused = value;
		if ( this.focused ) {
			this.emit( 'focus' );
			this.$focusable.addClass( 've-ce-node-focused' );
			this.createHighlights();
			this.surface.appendHighlights( this.$highlights, true );
			this.surface.$element.unbind( '.ve-ce-focusableNode' );
		} else {
			this.emit( 'blur' );
			this.$focusable.removeClass( 've-ce-node-focused' );
			this.clearHighlights();
		}
	}
};

/**
 * Creates highlights.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.createHighlights = function () {
	if ( this.highlighted ) {
		return;
	}

	var node = this;

	this.attachShields();

	this.$focusable.find( '.ve-ce-focusableNode-shield:visible' ).each(
		ve.bind( function () {
			this.$highlights = this.$highlights.add(
				this.createHighlight()
					.on( 'mousedown', ve.bind( this.onFocusableMouseDown, this ) )
					.on( 'dblclick', function () {
						node.emit( 'dblclick' );
					} )
			);
		}, this )
	);

	this.positionHighlights();

	this.surface.appendHighlights( this.$highlights );

	this.surface.$element.on( {
		'mousemove.ve-ce-focusableNode': ve.bind( this.onSurfaceMouseMove, this ),
		'mouseout.ve-ce-focusableNode': ve.bind( this.onSurfaceMouseOut, this )
	} );
	this.surface.getModel().getDocument().connect( this, { 'transact': 'positionHighlights' } );

	this.highlighted = true;
};

/**
 * Clears highlight.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.clearHighlights = function () {
	this.$highlights.remove();
	this.$highlights = this.$( [] );
	this.surface.$element.unbind( '.ve-ce-focusableNode' );
	this.surface.getModel().getDocument().disconnect( this, { 'transact': 'positionHighlights' } );
	this.highlighted = false;
};

/**
 * Redraws highlight.
 *
 * @method
 */
ve.ce.FocusableNode.prototype.redrawHighlights = function () {
	this.clearHighlights();
	this.createHighlights();
};

/**
 * Positions highlights
 *
 * @method
 */
ve.ce.FocusableNode.prototype.positionHighlights = function () {
	this.$focusable.find( '.ve-ce-focusableNode-shield:visible' ).each(
		ve.bind( function ( i, element ) {
			var $shield = this.$( element ),
				offset = OO.ui.Element.getRelativePosition(
					$shield, this.surface.getSurface().$element
				);
			this.$highlights.eq( i ).css( {
				'top': offset.top,
				'left': offset.left,
				'height': $shield.height(),
				'width': $shield.width(),
				'background-position': -offset.left + 'px ' + -offset.top + 'px'
			} );
		}, this )
	);
};
