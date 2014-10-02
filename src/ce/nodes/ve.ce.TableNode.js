/*!
 * VisualEditor ContentEditable TableNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable table node.
 *
 * @class
 * @extends ve.ce.BranchNode
 * @constructor
 * @param {ve.dm.TableNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TableNode = function VeCeTableNode( model, config ) {
	// Parent constructor
	ve.ce.BranchNode.call( this, model, config );

	this.surface = null;
	this.active = false;
	this.startCell = null;
	this.editingSelection = null;
};

/* Inheritance */

OO.inheritClass( ve.ce.TableNode, ve.ce.BranchNode );

/* Prototype */

/**
 * @inheritdoc
 */
ve.ce.TableNode.prototype.onSetup = function () {
	// Parent method
	ve.ce.TableNode.super.prototype.onSetup.call( this );

	// Exit if already setup or not attached
	if ( this.isSetup || !this.root ) {
		return;
	}
	this.surface = this.getRoot().getSurface();

	// DOM changes
	this.$element
		.addClass( 've-ce-tableNode' )
		.prop( 'contentEditable', 'false' );

	// Overlay
	this.$selectionBox = this.$( '<div>' ).addClass( 've-ce-tableNodeOverlay-selection-box' );
	this.$selectionBoxAnchor = this.$( '<div>' ).addClass( 've-ce-tableNodeOverlay-selection-box-anchor' );
	this.$rowBracket = this.$( '<div>' ).addClass( 've-ce-tableNodeOverlay-row-bracket' );
	this.$colBracket = this.$( '<div>' ).addClass( 've-ce-tableNodeOverlay-column-bracket' );

	this.$overlay = $( '<div>' )
		.hide()
		.addClass( 've-ce-tableNodeOverlay' )
		.append( [
			this.$selectionBox,
			this.$selectionBoxAnchor,
			this.$rowBracket,
			this.$colBracket
		] );
	this.surface.surface.$blockers.append( this.$overlay );

	// Events
	this.$element.on( {
		'mousedown.ve-ce-tableNode': ve.bind( this.onTableMouseDown, this ),
		'dblclick.ve-ce-tableNode': ve.bind( this.onTableDblClick, this )
	} );
	this.onTableMouseUpHandler = ve.bind( this.onTableMouseUp, this );
	this.onTableMouseMoveHandler = ve.bind( this.onTableMouseMove, this );
	// Select and position events both fire updateOverlay, so debounce. Also makes
	// sure that this.selectedRectangle is up to date before redrawing.
	this.updateOverlayDebounced = ve.debounce( ve.bind( this.updateOverlay, this ) );
	this.surface.getModel().connect( this, { select: 'onSurfaceModelSelect' } );
	this.surface.connect( this, { position: this.updateOverlayDebounced } );
};

/**
 * @inheritdoc
 */
ve.ce.TableNode.prototype.onTeardown = function () {
	// Parent method
	ve.ce.TableNode.super.prototype.onTeardown.call( this );
	// Events
	this.$element.off( '.ve-ce-tableNode' );
	this.surface.getModel().disconnect( this, { select: 'onSurfaceModelSelect' } );
	this.surface.disconnect( this, { position: this.updateOverlayDebounced } );
	this.$overlay.remove();
};

/**
 * Handle table double click events
 *
 * @param {jQuery.Event} e Double click event
 */
ve.ce.TableNode.prototype.onTableDblClick = function ( e ) {
	var tableNode = $( e.target ).closest( 'table' ).data( 'view' );
	if ( tableNode === this ) {
		this.setEditing( true );
	}
};

/**
 * Handle mouse down or touch start events
 *
 * @param {jQuery.Event} e Mouse down or touch start event
 */
ve.ce.TableNode.prototype.onTableMouseDown = function ( e ) {
	var cellNode, startCell, endCell, selection, newSelection, tableNode;

	if ( e.type === 'touchstart' && e.originalEvent.touches.length > 1 ) {
		// Ignore multi-touch
		return;
	}

	tableNode = $( e.target ).closest( 'table' ).data( 'view' );

	if ( tableNode !== this ) {
		// Nested table, ignore event
		return;
	}

	cellNode = $( e.target ).closest( 'td, th' ).data( 'view' );
	if ( !cellNode ) {
		e.preventDefault();
		return;
	}
	endCell = this.getModel().getMatrix().lookupCell( cellNode.getModel() );
	if ( !endCell ) {
		e.preventDefault();
		return;
	}
	selection = this.surface.getModel().getSelection();
	startCell = e.shiftKey ? { col: selection.fromCol, row: selection.fromRow } : endCell;
	newSelection = new ve.dm.TableSelection(
		this.getModel().getDocument(),
		this.getModel().getOuterRange(),
		startCell.col,
		startCell.row,
		endCell.col,
		endCell.row
	);
	if ( this.editingSelection ) {
		if ( newSelection.equals( this.editingSelection ) ) {
			// Clicking on the editing cell, don't prevent default
			return;
		} else {
			this.setEditing( false );
		}
	}
	this.surface.getModel().setSelection( newSelection );
	this.startCell = startCell;
	this.surface.$document.on( {
		'mouseup touchend': this.onTableMouseUpHandler,
		'mousemove touchmove': this.onTableMouseMoveHandler
	} );
	e.preventDefault();
};

/**
 * Handle mouse/touch move events
 *
 * @param {jQuery.Event} e Mouse/touch move event
 */
ve.ce.TableNode.prototype.onTableMouseMove = function ( e ) {
	var cell, selection, touch, target, node;

	// 'touchmove' doesn't give a correct e.target, so calculate it from coordinates
	if ( e.type === 'touchmove' ) {
		if ( e.originalEvent.touches.length > 1 ) {
			// Ignore multi-touch
			return;
		}
		touch = e.originalEvent.touches[0];
		target = this.surface.getElementDocument().elementFromPoint( touch.clientX, touch.clientY );
	} else {
		target = e.target;
	}

	node = $( target ).closest( 'td, th' ).data( 'view' );
	if ( !node ) {
		return;
	}

	cell = this.getModel().matrix.lookupCell( node.getModel() );
	if ( !cell ) {
		return;
	}

	selection = new ve.dm.TableSelection(
		this.getModel().getDocument(),
		this.getModel().getOuterRange(),
		this.startCell.col, this.startCell.row, cell.col, cell.row
	);
	this.surface.getModel().setSelection( selection );
};

/**
 * Handle mouse up or touch end events
 *
 * @param {jQuery.Event} e Mouse up or touch end event
 */
ve.ce.TableNode.prototype.onTableMouseUp = function () {
	this.startCell = null;
	this.surface.$document.off( {
		'mouseup touchend': this.onTableMouseUpHandler,
		'mousemove touchmove': this.onTableMouseMoveHandler
	} );
};

/**
 * Set the editing state of the table
 *
 * @param {boolean} isEditing The table is being edited
 */
ve.ce.TableNode.prototype.setEditing = function ( isEditing ) {
	if ( isEditing ) {
		var cell, selection = this.surface.getModel().getSelection();
		if ( !selection.isSingleCell() ) {
			selection = selection.collapseToFrom();
			this.surface.getModel().setSelection( selection );
		}
		this.editingSelection = selection;
		cell = this.getCellNodesFromSelection( selection )[0];
		cell.setEditing( true );
		// TODO: Find content offset/slug offset within cell
		this.surface.getModel().setLinearSelection( new ve.Range( cell.getModel().getRange().end - 1 ) );
	} else if ( this.editingSelection ) {
		this.getCellNodesFromSelection( this.editingSelection )[0].setEditing( false );
		this.editingSelection = null;
	}
	this.$element.toggleClass( 've-ce-tableNode-editing', isEditing );
	this.$overlay.toggleClass( 've-ce-tableNodeOverlay-editing', isEditing );
	this.surface.setTableEditingFragment( this.editingSelection );
};

/**
 * Handle select events from the surface model.
 *
 * @param {ve.dm.Selection} selection Selection
 */
ve.ce.TableNode.prototype.onSurfaceModelSelect = function ( selection ) {
	// The table is active if it is a linear selection inside a cell being edited
	// or a table selection matching this table.
	var active = (
			this.editingSelection !== null &&
			selection instanceof ve.dm.LinearSelection &&
			this.getModel().getOuterRange().containsRange( selection.getRange() )
		) ||
		(
			selection instanceof ve.dm.TableSelection &&
			selection.tableRange.equals( this.getModel().getOuterRange() )
		);

	if ( active ) {
		if ( !this.active ) {
			this.active = true;
			this.$overlay.show();
			// Only register touchstart event after table has become active to prevent
			// accidental focusing of the table while scrolling
			this.$element.on( 'touchstart.ve-ce-tableNode', ve.bind( this.onTableMouseDown, this ) );
		}
		this.updateOverlayDebounced();
	} else if ( !active && this.active ) {
		this.$overlay.hide();
		if ( this.editingSelection ) {
			this.setEditing( false );
		}
		this.$element.off( 'touchstart.ve-ce-tableNode', ve.bind( this.onTableMouseDown, this ) );
	}
	this.$element.toggleClass( 've-ce-tableNode-active', active );
	this.active = active;
};

/**
 * Update the overlay positions
 */
ve.ce.TableNode.prototype.updateOverlay = function () {
	if ( !this.active ) {
		return;
	}

	var i, l, nodes, cellOffset, anchorNode, anchorOffset,
		top, left, bottom, right,
		selection = this.editingSelection || this.surface.getModel().getSelection(),
		tableOffset = this.$element[0].getClientRects()[0],
		surfaceOffset = this.surface.getSurface().getBoundingClientRect();

	if ( !tableOffset ) {
		return;
	}

	nodes = this.getCellNodesFromSelection( selection );
	anchorNode = this.getCellNodesFromSelection( selection.collapseToFrom() )[0];
	anchorOffset = anchorNode.$element[0].getClientRects()[0];

	top = Infinity;
	bottom = -Infinity;
	left = Infinity;
	right = -Infinity;

	// Compute a bounding box for the given cell elements
	for ( i = 0, l = nodes.length; i < l; i++) {
		cellOffset = nodes[i].$element[0].getClientRects()[0];

		top = Math.min( top, cellOffset.top );
		bottom = Math.max( bottom, cellOffset.bottom );
		left = Math.min( left, cellOffset.left );
		right = Math.max( right, cellOffset.right );
	}

	// Resize controls
	this.$selectionBox.css( {
		left: left - tableOffset.left,
		top: top - tableOffset.top,
		width: right - left,
		height: bottom - top
	} );
	this.$selectionBoxAnchor.css( {
		left: anchorOffset.left - tableOffset.left,
		top: anchorOffset.top - tableOffset.top,
		width: anchorOffset.width,
		height: anchorOffset.height
	} );
	this.$rowBracket.css( {
		top: top - tableOffset.top,
		height: bottom - top
	} );
	this.$colBracket.css( {
		left: left - tableOffset.left,
		width: right - left
	} );

	// Position controls
	this.$overlay.css( {
		left: tableOffset.left - surfaceOffset.left,
		top: tableOffset.top - surfaceOffset.top
	} );
};

/**
 * Get a cell node from a single cell selection
 *
 * @param {ve.dm.TableSelection} selection Single cell table selection
 * @return {ve.ce.TableCellNode[]} Cell nodes
 */
ve.ce.TableNode.prototype.getCellNodesFromSelection = function ( selection ) {
	var i, l, cellModel, cellView,
		cells = selection.getMatrixCells(),
		nodes = [];

	for ( i = 0, l = cells.length; i < l; i++ ) {
		cellModel = cells[i].node;
		cellView = this.getNodeFromOffset( cellModel.getRange().start - this.model.getRange().start );
		nodes.push( cellView );
	}
	return nodes;
};

/* Static Properties */

ve.ce.TableNode.static.name = 'table';

ve.ce.TableNode.static.tagName = 'table';

ve.ce.TableNode.static.mergeOnDelete = false;

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
