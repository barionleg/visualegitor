/*!
 * VisualEditor ContentEditable ResizableNode class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable resizable node.
 *
 * @class
 * @abstract
 *
 * @constructor
 * @param {jQuery} [$resizable=this.$] Resizable DOM element
 * @param {Object} [config] Configuration options
 * @param {number|null} [config.snapToGrid=10] Snap to a grid of size X when the shift key is held. Null disables.
 */
ve.ce.ResizableNode = function VeCeResizableNode( $resizable, config ) {
	// Properties
	this.$resizable = $resizable || this.$;
	this.ratio = this.model.getAttribute( 'width' ) / this.model.getAttribute( 'height' );
	this.resizing = false;
	this.$resizeHandles = this.$$( '<div>' );
	this.snapToGrid = ( config && config.snapToGrid !== undefined ) ? config.snapToGrid : 10;

	// Events
	this.connect( this, {
		'focus': 'onResizableFocus',
		'blur': 'onResizableBlur',
		'live': 'onResizableLive',
		'resizeEnd': 'onResizableFocus'
	} );

	// Initialization
	this.$resizeHandles
		.addClass( 've-ce-resizableNode-handles' )
		.append( this.$$( '<div>' ).addClass( 've-ce-resizableNode-nwHandle' ) )
		.append( this.$$( '<div>' ).addClass( 've-ce-resizableNode-neHandle' ) )
		.append( this.$$( '<div>' ).addClass( 've-ce-resizableNode-seHandle' ) )
		.append( this.$$( '<div>' ).addClass( 've-ce-resizableNode-swHandle' ) );
};

/* Events */

/**
 * @event resizeStart
 */

/**
 * @event resizing
 * @param {Object} dimensions Dimension object containing width & height
 */

/**
 * @event resizeEnd
 */


/* Static Properties */

ve.ce.ResizableNode.static = {};

/* Methods */

/**
 * Handle node focus.
 *
 * @method
 */
ve.ce.ResizableNode.prototype.onResizableFocus = function () {
	this.$resizeHandles.appendTo( this.root.getSurface().getSurface().$localOverlayControls );

	this.setResizableHandlesSizeAndPosition();

	this.$resizeHandles
		.find( '.ve-ce-resizableNode-neHandle' )
			.css( { 'margin-right': -this.$resizable.width() } )
			.end()
		.find( '.ve-ce-resizableNode-swHandle' )
			.css( { 'margin-bottom': -this.$resizable.height() } )
			.end()
		.find( '.ve-ce-resizableNode-seHandle' )
			.css( {
				'margin-right': -this.$resizable.width(),
				'margin-bottom': -this.$resizable.height()
			} );

	this.$resizeHandles.children()
		.off( '.ve-ui-resizableNode' )
		.on(
			'mousedown.ve-ui-resizableNode',
			ve.bind( this.onResizeHandlesCornerMouseDown, this )
		);
};

/**
 * Handle node blur.
 *
 * @method
 */
ve.ce.ResizableNode.prototype.onResizableBlur = function () {
	this.$resizeHandles.detach();
};

/**
 * Handle live event.
 *
 * @method
 */
ve.ce.ResizableNode.prototype.onResizableLive = function () {
	var surfaceModel = this.getRoot().getSurface().getModel();

	if ( this.live ) {
		surfaceModel.connect( this, { 'history': 'setResizableHandlesSizeAndPosition' } );
	} else {
		surfaceModel.disconnect( this, { 'history': 'setResizableHandlesSizeAndPosition' } );
		this.onResizableBlur();
	}
};

/**
 * Handle bounding box handle mousedown.
 *
 * @method
 * @param {jQuery.Event} e Click event
 * @emits resizeStart
 */
ve.ce.ResizableNode.prototype.onResizeHandlesCornerMouseDown = function ( e ) {
	// Hide context menu
	// TODO: Maybe there's a more generic way to handle this sort of thing? For relocation it's
	// handled in ve.ce.Surface
	this.root.getSurface().getSurface().getContext().hide();

	// Set bounding box width and undo the handle margins
	this.$resizeHandles
		.addClass( 've-ui-resizableNode-handles-resizing' )
		.css( {
			'width': this.$resizable.width(),
			'height': this.$resizable.height()
		} );

	this.$resizeHandles.children().css( 'margin', 0 );

	// Values to calculate adjusted bounding box size
	this.resizeInfo = {
		'mouseX': e.screenX,
		'mouseY': e.screenY,
		'top': this.$resizeHandles.position().top,
		'left': this.$resizeHandles.position().left,
		'height': this.$resizeHandles.height(),
		'width': this.$resizeHandles.width(),
		'handle': e.target.className
	};

	// Bind resize events
	this.resizing = true;
	$( this.getElementDocument() ).on( {
		'mousemove.ve-ce-resizableNode': ve.bind( this.onDocumentMouseMove, this ),
		'mouseup.ve-ce-resizableNode': ve.bind( this.onDocumentMouseUp, this )
	} );
	this.emit( 'resizeStart' );

	return false;
};

/**
 * Set the proper size and position for resize handles
 *
 * @method
 */
ve.ce.ResizableNode.prototype.setResizableHandlesSizeAndPosition = function () {
	var width = this.$resizable.width(),
		height = this.$resizable.height();

	this.setResizableHandlesPosition();

	this.$resizeHandles
		.css( {
			'width': 0,
			'height': 0
		} )
		.find( '.ve-ce-resizableNode-neHandle' )
			.css( { 'margin-right': -width } )
			.end()
		.find( '.ve-ce-resizableNode-swHandle' )
			.css( { 'margin-bottom': -height } )
			.end()
		.find( '.ve-ce-resizableNode-seHandle' )
			.css( {
				'margin-right': -width,
				'margin-bottom': -height
			} );
};

/**
 * Set the proper position for resize handles
 *
 * @method
 */
ve.ce.ResizableNode.prototype.setResizableHandlesPosition = function () {
	var offset = ve.Element.getRelativePosition(
			this.$resizable, this.getRoot().getSurface().getSurface().$
		);

	this.$resizeHandles.css( {
		'top': offset.top,
		'left': offset.left
	} );
};

/**
 * Handle body mousemove.
 *
 * @method
 * @param {jQuery.Event} e Click event
 * @emits resizing
 */
ve.ce.ResizableNode.prototype.onDocumentMouseMove = function ( e ) {
	var newWidth, newHeight, newRatio, snapMin, snapMax, snap,
		// TODO: Make these configurable
		min = 1,
		max = 1000,
		diff = {},
		dimensions = {
			'width': 0,
			'height': 0,
			'top': this.resizeInfo.top,
			'left': this.resizeInfo.left
		};

	if ( this.resizing ) {
		// X and Y diff
		switch ( this.resizeInfo.handle ) {
			case 've-ce-resizableNode-seHandle':
				diff.x = e.screenX - this.resizeInfo.mouseX;
				diff.y = e.screenY - this.resizeInfo.mouseY;
				break;
			case 've-ce-resizableNode-nwHandle':
				diff.x = this.resizeInfo.mouseX - e.screenX;
				diff.y = this.resizeInfo.mouseY - e.screenY;
				break;
			case 've-ce-resizableNode-neHandle':
				diff.x = e.screenX - this.resizeInfo.mouseX;
				diff.y = this.resizeInfo.mouseY - e.screenY;
				break;
			case 've-ce-resizableNode-swHandle':
				diff.x = this.resizeInfo.mouseX - e.screenX;
				diff.y = e.screenY - this.resizeInfo.mouseY;
				break;
		}

		// Unconstrained dimensions and ratio
		newWidth = Math.max( Math.min( this.resizeInfo.width + diff.x, max ), min );
		newHeight = Math.max( Math.min( this.resizeInfo.height + diff.y, max ), min );
		newRatio = newWidth / newHeight;

		// Fix the ratio
		if ( this.ratio > newRatio ) {
			dimensions.width = newWidth;
			dimensions.height = this.resizeInfo.height +
				( newWidth - this.resizeInfo.width ) / this.ratio;
		} else {
			dimensions.width = this.resizeInfo.width +
				( newHeight - this.resizeInfo.height ) * this.ratio;
			dimensions.height = newHeight;
		}

		if ( this.snapToGrid && e.shiftKey ) {
			snapMin = Math.ceil( min / this.snapToGrid );
			snapMax = Math.floor( max / this.snapToGrid );
			snap = Math.round( dimensions.width / this.snapToGrid );
			dimensions.width = Math.max( Math.min( snap, snapMax ), snapMin ) * this.snapToGrid;
			dimensions.height = dimensions.width / this.ratio;
		}

		// Fix the position
		switch ( this.resizeInfo.handle ) {
			case 've-ce-resizableNode-neHandle':
				dimensions.top = this.resizeInfo.top +
					( this.resizeInfo.height - dimensions.height );
				break;
			case 've-ce-resizableNode-swHandle':
				dimensions.left = this.resizeInfo.left +
					( this.resizeInfo.width - dimensions.width );
				break;
			case 've-ce-resizableNode-nwHandle':
				dimensions.top = this.resizeInfo.top +
					( this.resizeInfo.height - dimensions.height );
				dimensions.left = this.resizeInfo.left +
					( this.resizeInfo.width - dimensions.width );
				break;
		}

		// Update bounding box
		this.$resizeHandles.css( dimensions );
		this.emit( 'resizing', dimensions );
	}
};

/**
 * Handle body mouseup.
 *
 * @method
 * @emits resizeEnd
 */
ve.ce.ResizableNode.prototype.onDocumentMouseUp = function () {
	var attrChanges,
		offset = this.model.getOffset(),
		width = this.$resizeHandles.outerWidth(),
		height = this.$resizeHandles.outerHeight(),
		surfaceModel = this.getRoot().getSurface().getModel(),
		documentModel = surfaceModel.getDocument(),
		selection = surfaceModel.getSelection();

	this.$resizeHandles.removeClass( 've-ui-resizableNode-handles-resizing' );
	$( this.getElementDocument() ).off( '.ve-ce-resizableNode' );
	this.resizing = false;

	// Apply changes to the model
	attrChanges = this.getAttributeChanges( width, height );
	if ( !ve.isEmptyObject( attrChanges ) ) {
		surfaceModel.change(
			ve.dm.Transaction.newFromAttributeChanges( documentModel, offset, attrChanges ),
			selection
		);
	}

	// Update the context menu. This usually happens with the redraw, but not if the
	// user doesn't perform a drag
	this.root.getSurface().getSurface().getContext().update();

	this.emit( 'resizeEnd' );
};

/**
 * Generate an object of attributes changes from the new width and height.
 *
 * @param {number} width New image width
 * @param {number} height New image height
 * @returns {Object} Attribute changes
 */
ve.ce.ResizableNode.prototype.getAttributeChanges = function ( width, height ) {
	var attrChanges = {};
	if ( this.model.getAttribute( 'width' ) !== width ) {
		attrChanges.width = width;
	}
	if ( this.model.getAttribute( 'height' ) !== height ) {
		attrChanges.height = height;
	}
	return attrChanges;
};
