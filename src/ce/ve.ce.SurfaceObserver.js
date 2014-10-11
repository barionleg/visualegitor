/*!
 * VisualEditor ContentEditable Surface class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable surface observer.
 *
 * @class
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {ve.ce.Surface} surface Surface to observe
 */
ve.ce.SurfaceObserver = function VeCeSurfaceObserver( surface ) {
	// Mixin constructors
	OO.EventEmitter.call( this );

	// Properties
	this.surface = surface;
	this.documentView = surface.getDocument();
	this.domDocument = this.documentView.getDocumentNode().getElementDocument();
	this.polling = false;
	this.disabled = false;
	this.timeoutId = null;
	this.pollInterval = 250; // ms

	// Initialization
	this.clear();
};

/* Inheritance */

OO.mixinClass( ve.ce.SurfaceObserver, OO.EventEmitter );

/* Events */

/**
 * When #poll sees a change this event is emitted (before the
 * properties are updated).
 *
 * @event contentChange
 * @param {HTMLElement} node DOM node the change occured in
 * @param {Object} previous Old data
 * @param {Object} previous.text Old plain text content
 * @param {Object} previous.hash Old DOM hash
 * @param {ve.Range} previous.range Old selection
 * @param {Object} next New data
 * @param {Object} next.text New plain text content
 * @param {Object} next.hash New DOM hash
 * @param {ve.Range} next.range New selection
 */

/**
 * When #poll observes a change in the document and the new
 * selection does not equal as the last known selection, this event
 * is emitted (before the properties are updated).
 *
 * @event rangeChange
 * @param {ve.Range|null} oldRange Old range
 * @param {ve.Range|null} newRange New range
 */

/**
 * When #poll observes that the cursor was moved into a block slug
 *
 * @event slugEnter
 */

/* Methods */

/**
 * Clear polling data.
 *
 * @method
 * @param {ve.Range} range Initial range to use
 */
ve.ce.SurfaceObserver.prototype.clear = function ( range ) {
	this.domRange = null;
	this.range = range || null;
	this.node = null;
	this.text = null;
	this.hash = null;
	this.$slugWrapper = null;
};

/**
 * Detach from the document view
 *
 * @method
 */
ve.ce.SurfaceObserver.prototype.detach = function () {
	this.surface = null;
	this.documentView = null;
	this.domDocument = null;
};

/**
 * Start the setTimeout synchronisation loop
 *
 * @method
 */
ve.ce.SurfaceObserver.prototype.startTimerLoop = function () {
	this.polling = true;
	this.timerLoop( true ); // will not sync immediately, because timeoutId should be null
};

/**
 * Loop once with `setTimeout`
 * @method
 * @param {boolean} firstTime Wait before polling
 */
ve.ce.SurfaceObserver.prototype.timerLoop = function ( firstTime ) {
	if ( this.timeoutId ) {
		// in case we're not running from setTimeout
		clearTimeout( this.timeoutId );
		this.timeoutId = null;
	}
	if ( !firstTime ) {
		this.pollOnce();
	}
	// only reach this point if pollOnce does not throw an exception
	if ( this.pollInterval !== null ) {
		this.timeoutId = this.setTimeout(
			this.timerLoop.bind( this ),
			this.pollInterval
		);
	}
};

/**
 * Stop polling
 *
 * @method
 */
ve.ce.SurfaceObserver.prototype.stopTimerLoop = function () {
	if ( this.polling === true ) {
		this.polling = false;
		clearTimeout( this.timeoutId );
		this.timeoutId = null;
	}
};

/**
 * Disable the surface observer
 */
ve.ce.SurfaceObserver.prototype.disable = function () {
	this.disabled = true;
};

/**
 * Enable the surface observer
 */
ve.ce.SurfaceObserver.prototype.enable = function () {
	this.disabled = false;
};

/**
 * Poll for changes.
 *
 * TODO: fixing selection in certain cases, handling selection across multiple nodes in Firefox
 *
 * FIXME: Does not work well (rangeChange is not emitted) when cursor is placed inside a block slug
 * with a mouse.
 *
 * @method
 * @fires contentChange
 * @fires rangeChange
 */
ve.ce.SurfaceObserver.prototype.pollOnce = function () {
	this.pollOnceInternal( true );
};

/**
 * Poll to update SurfaceObserver, but don't emit change events
 *
 * @method
 */
ve.ce.SurfaceObserver.prototype.pollOnceNoEmit = function () {
	this.pollOnceInternal( false );
};

/**
 * Poll to update SurfaceObserver, but only check for selection changes
 *
 * Used as an optimisation when you know the content hasn't changed
 *
 * @method
 */
ve.ce.SurfaceObserver.prototype.pollOnceSelection = function () {
	this.pollOnceInternal( true, true );
};

/**
 * Poll for changes.
 *
 * TODO: fixing selection in certain cases, handling selection across multiple nodes in Firefox
 *
 * FIXME: Does not work well (rangeChange is not emitted) when cursor is placed inside a block slug
 * with a mouse.
 *
 * @method
 * @private
 * @param {boolean} emitChanges Emit change events if selection changed
 * @param {boolean} selectionOnly Check for selection changes only
 * @fires contentChange
 * @fires rangeChange
 * @fires slugEnter
 */
ve.ce.SurfaceObserver.prototype.pollOnceInternal = function ( emitChanges, selectionOnly ) {
	var oldState, newState,
		observer = this;

	if ( !this.domDocument || this.disabled ) {
		return;
	}

	oldState = this.rangeState;
	newState = this.constructor.static.getUpdatedRangeState(
		oldState,
		this.documentView.getDocumentNode()
	);

	if ( newState.leftBlockSlug ) {
		oldState.$slugWrapper
			.addClass( 've-ce-branchNode-blockSlugWrapper-unfocused' )
			.removeClass( 've-ce-branceNode-blockSlugWrapper-focused' );
	}

	if ( newState.enteredBlockSlug ) {
		newState.$slugWrapper
			.addClass( 've-ce-branchNode-blockSlugWrapper-focused' )
			.removeClass( 've-ce-branchNode-blockSlugWrapper-unfocused' );
	}

	this.rangeState = newState;

	if ( newState.enteredBlockSlug || newState.leftBlockSlug ) {
		// Emit 'position' on the surface view after the animation completes
		this.setTimeout( function () {
			if ( observer.surface ) {
				observer.surface.emit( 'position' );
			}
		}, 200 );
	}

	if ( !selectionOnly && newState.node !== null && newState.contentChanged && emitChanges ) {
		this.emit(
			'contentChange',
			newState.node,
			{ text: oldState.text, hash: oldState.hash, range: oldState.veRange },
			{ text: newState.text, hash: newState.hash, range: newState.veRange }
		);
	}

	if ( newState.domRangeChanged && emitChanges ) {
		this.emit( 'rangeChange', oldState.veRange, newState.veRange );
	}

	if ( newState.enteredBlockSlug ) {
		this.emit( 'slugEnter' );
	}
};

/**
 * Wrapper for setTimeout, for ease of debugging
 *
 * @param {Function} callback Callback
 * @param {number} timeout Timeout ms
 */
ve.ce.SurfaceObserver.prototype.setTimeout = function ( callback, timeout ) {
	return setTimeout( callback, timeout );
};

/**
 * Get the range last observed.
 *
 * Used when you have just polled, but don't want to wait for a 'rangeChange' event.
 *
 * @return {ve.Range} Range
 */
ve.ce.SurfaceObserver.prototype.getRange = function () {
	return this.range;
};

/* Static Methods */

/**
 * Gets DOM range state and compares to previous state
 * @param {Object} oldState Result of previous call to this method
 * @param {ve.ce.DocumentNode} docNode The current document node
 * @returns {Object} DOM range state
 * @returns.domRangeChanged {boolean} Whether the DOM range changed
 * @returns.contentChanged {boolean} Whether the content changed
 * @returns.leftBlockSlug {boolean} Whether the range left a block slug
 * @returns.enteredBlockSlug {boolean} Whether the range entered a block slug
 * @returns.veRange {ve.Range} The current selection range
 * @returns.node {ve.ce.BranchNode|null} The current branch node
 * @returns.$slugWrapper {jQuery|null} The current slug wrapper
 * @returns.text {string} Plain text of current node
 * @returns.hash {string} DOM hash of current node
 * @returns.isDomRangeChanged {Function} Closure function to test future ranges
 * @returns.isAnchorNodeChanged {Function} Closure function to test future ranges
 */
ve.ce.SurfaceObserver.static.getUpdatedRangeState = function ( oldState, docNode ) {
	var $nodeOrSlug, selection,
		newState = {};

	selection = ( function ( selection ) {
		// freeze selection out of live object
		return {
			focusNode: selection.focusNode,
			focusOffset: selection.focusOffset,
			anchorNode: selection.anchorNode,
			anchorOffset: selection.anchorOffset
		};
	} ( docNode.getElementDocument().getSelection() ) );

	// Get new range information
	if ( oldState && !oldState.isDomRangeChanged( selection ) ) {
		// No change; use old values for speed
		newState.domRangeChanged = false;
		newState.veRange = oldState.veRange;
		newState.$slugWrapper = oldState.$slugWrapper;
		newState.leftBlockSlug = false;
		newState.enteredBlockSlug = false;
	} else {
		newState.domRangeChanged = true;
		try {
			newState.veRange = new ve.Range(
				ve.ce.getOffset( selection.anchorNode, selection.anchorOffset ),
				ve.ce.getOffset( selection.focusNode, selection.focusOffset )
			);
		} catch ( e ) {
			newState.veRange = null;
		}
	}

	if ( oldState && !oldState.isAnchorNodeChanged( selection ) ) {
		newState.node = oldState.node;
		newState.$slugWrapper = oldState.$slugWrapper;
	} else {
		$nodeOrSlug = $( selection.anchorNode ).closest(
			'.ve-ce-branchNode, .ve-ce-branchNode-blockSlugWrapper'
		);
		if ( $nodeOrSlug.length === 0 ) {
			newState.node = null;
			newState.$slugWrapper = null;
		} else if ( $nodeOrSlug.hasClass( 've-ce-branchNode-blockSlugWrapper' ) ) {
			newState.node = null;
			newState.$slugWrapper = $nodeOrSlug;
		} else {
			newState.node = $nodeOrSlug.data( 'view' );
			newState.$slugWrapper = null;
			// Check this node belongs to our document
			if ( newState.node && newState.node.root !== docNode ) {
				newState.node = null;
				newState.veRange = null;
			}
		}
	}

	if ( newState.node === null ) {
		newState.text = null;
		newState.hash = null;
	} else {
		newState.text = ve.ce.getDomText( newState.node.$element[0] );
		newState.hash = ve.ce.getDomHash( newState.node.$element[0] );
	}

	newState.leftBlockSlug = (
		oldState &&
		oldState.$slugWrapper &&
		!oldState.$slugWrapper.is( newState.$slugWrapper )
	);
	newState.enteredBlockSlug = (
		oldState &&
		newState.$slugWrapper &&
		newState.$slugWrapper.length > 0 &&
		!newState.$slugWrapper.is( oldState.$slugWrapper )
	);

	// Only set contentChanged if we're still in the same branch node/block slug
	newState.contentChanged = (
		oldState &&
		oldState.node === newState.node && (
			oldState.hash !== newState.hash ||
			oldState.text !== newState.text
		)
	);

	// Don't store exposed selection attributes (the nodes are misleadingly live).
	// But do allow DOM range / anchor node comparisons via function closure.
	newState.isDomRangeChanged = function ( futureSelection ) {
		return (
			futureSelection.focusNode !== selection.focusNode ||
			futureSelection.focusOffset !== selection.focusOffset ||
			futureSelection.anchorNode !== selection.anchorNode ||
			futureSelection.anchorOffset !== selection.anchorOffset
		);
	};
	newState.isAnchorNodeChanged = function ( futureSelection ) {
		return futureSelection.anchorNode !== selection.anchorNode;
	};
	return newState;
};
