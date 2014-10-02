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
	this.$rowBracket = this.$( '<div>' ).addClass( 've-ce-tableNodeOverlay-row-bracket' );
	this.$colBracket = this.$( '<div>' ).addClass( 've-ce-tableNodeOverlay-column-bracket' );

	this.$overlay = $( '<div>' )
		.hide()
		.addClass( 've-ce-tableNodeOverlay' )
		.append( [
			this.$selectionBox,
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

ve.ce.TableNode.prototype.onTeardown = function () {
	// Parent method
	ve.ce.TableNode.super.prototype.onTeardown.call( this );
	// Events
	this.$element.off( '.ve-ce-tableNode' );
	this.surface.getModel().disconnect( this, { select: 'onSurfaceModelSelect' } );
	this.surface.disconnect( this, { position: this.updateOverlayDebounced } );
	this.$overlay.remove();
};

ve.ce.TableNode.prototype.onTableDblClick = function ( e ) {
	var tableNode = $( e.target ).closest( 'table' ).data( 'view' );
	if ( tableNode === this ) {
		this.setEditing( true );
	}
};

ve.ce.TableNode.prototype.onTableMouseDown = function ( e ) {
	var cellNode, cell, selection,
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
	cell = this.getModel().matrix.lookupCell( cellNode.getModel() );
	if ( !cell ) {
		e.preventDefault();
		return;
	}
	selection = new ve.dm.TableSelection(
		this.getModel().getDocument(),
		this.getModel().getOuterRange(),
		cell.col, cell.row, cell.col, cell.row
	);
	if ( this.editingSelection ) {
		if ( selection.equals( this.editingSelection ) ) {
			// Clicking on the editing cell, don't prevent default
			return;
		} else {
			this.setEditing( false );
		}
	}
	this.surface.getModel().setSelection( selection );
	this.startCell = cell;
	this.surface.$document.on( {
		mouseup: this.onTableMouseUpHandler,
		mousemove: this.onTableMouseMoveHandler
	} );
	e.preventDefault();
};

ve.ce.TableNode.prototype.onTableMouseMove = function ( e ) {
	var cell, selection, node = $( e.target ).closest( 'td, th' ).data( 'view' );
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

ve.ce.TableNode.prototype.onTableMouseUp = function () {
	this.startCell = null;
	this.surface.$document.off( {
		mouseup: this.onTableMouseUpHandler,
		mousemove: this.onTableMouseMoveHandler
	} );
};

ve.ce.TableNode.prototype.setEditing = function ( editing ) {
	if ( editing ) {
		var cell, selection = this.surface.getModel().getSelection();
		if ( !selection.isSingleCell() ) {
			selection = selection.collapseToStart();
			this.surface.getModel().setSelection( selection );
		}
		this.editingSelection = selection;
		cell = this.getCellFromSelection( selection );
		cell.setEditing( true );
		// TODO: Find content offset/slug offset within cell
		this.surface.getModel().setLinearSelection( new ve.Range( cell.getModel().getRange().end - 1 ) );
	} else if ( this.editingSelection ) {
		this.getCellFromSelection( this.editingSelection ).setEditing( false );
		this.editingSelection = null;
	}
	this.$element.toggleClass( 've-ce-tableNode-editing', editing );
	this.$overlay.toggleClass( 've-ce-tableNodeOverlay-editing', editing );
	this.surface.setTableEditingSelection( this.editingSelection );
};

ve.ce.TableNode.prototype.getCellFromSelection = function ( selection ) {
	var cellModel = this.getModel().matrix.getCellsForSelection( selection )[0].node;
	return this.surface.getDocument().getBranchNodeFromOffset( cellModel.getRange().start );
};

/**
 * Reacts on selection changes and detects when the selection is fully within
 * the table.
 */
ve.ce.TableNode.prototype.onSurfaceModelSelect = function ( selection ) {
	var isActive = (
			this.editingSelection !== null &&
			selection instanceof ve.dm.LinearSelection &&
			this.getModel().getOuterRange().containsRange( selection.getRange() )
		) ||
		(
			selection instanceof ve.dm.TableSelection &&
			selection.tableRange.equals( this.getModel().getOuterRange() )
		);

	this.$element.toggleClass( 've-ce-tableNode-active', isActive );
	if ( isActive ) {
		if ( !this.active ) {
			this.active = true;
			this.$overlay.show();
		}
		this.updateOverlayDebounced();
	} else if ( !isActive && this.active ) {
		this.active = false;
		this.$overlay.hide();
		if ( this.editingSelection ) {
			this.setEditing( false );
		}
	}
};

/**
 * Update the overlay positions
 */
ve.ce.TableNode.prototype.updateOverlay = function () {
	if ( !this.active ) {
		return;
	}

	var i, l, $cells, $cell, cellOffset,
		top, left, bottom, right,
		tableOffset = this.$element[0].getClientRects()[0],
		surfaceOffset = this.surface.getSurface().getBoundingClientRect();

	if ( !tableOffset ) {
		return;
	}

	$cells = this.getElementsForSelection();

	top = Infinity;
	bottom = -Infinity;
	left = Infinity;
	right = -Infinity;

	// Compute a bounding box for the given cell elements
	for ( i = 0, l = $cells.length; i < l; i++) {
		$cell = $cells[i];
		cellOffset = $cell[0].getClientRects()[0];

		top = Math.min( top, cellOffset.top );
		bottom = Math.max( bottom, cellOffset.bottom );
		left = Math.min( left, cellOffset.left );
		right = Math.max( right, cellOffset.right );
	}

	// Resize controls
	this.$selectionBox.css( {
		left: left - tableOffset.left,
		top: top - tableOffset.top,
		height: bottom - top,
		width: right - left
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
 * Retrieves DOM elements corresponding to the the cells for the current selection.
 */
ve.ce.TableNode.prototype.getElementsForSelection = function () {
	var i, l, cell, cellNode, offset,
		cells = [],
		matrix = this.model.matrix,
		selection = this.editingSelection || this.surface.getModel().getSelection(),
		boundingSelection = matrix.getBoundingSelection( selection ),
		cellModels = matrix.getCellsForSelection( boundingSelection );

	for ( i = 0, l = cellModels.length; i < l; i++ ) {
		cell = cellModels[i];
		offset = cell.node.getRange().start - this.model.getRange().start;
		cellNode = this.getNodeFromOffset( offset );
		cells.push( cellNode.$element );
	}
	return $( cells );
};

/* Static Properties */

ve.ce.TableNode.static.name = 'table';

ve.ce.TableNode.static.tagName = 'table';

ve.ce.TableNode.static.mergeOnDelete = false;

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
