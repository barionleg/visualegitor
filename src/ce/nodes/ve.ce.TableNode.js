/*!
 * VisualEditor ContentEditable TableNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
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
	this.focused = false;
	// A ve.dm.TableMatrix.Rectange instance or null if no valid selection
	this.selectedRectangle = null;
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

	this.$element.addClass( 've-ce-tableNode' );

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

	this.surface.getModel().connect( this, { select: 'onSurfaceModelSelect' } );
	this.surface.getModel().getDocument().connect( this, { transact: 'positionOverlay' } );
	this.surface.connect( this, { position: 'positionOverlay' } );
};

ve.ce.TableNode.prototype.onTeardown = function () {
	// Parent method
	ve.ce.TableNode.super.prototype.onTeardown.call( this );
	this.surface.getModel().disconnect( this, { select: 'onSurfaceModelSelect' } );
	this.surface.getModel().getDocument().disconnect( this, { transact: 'positionOverlay' } );
	this.surface.disconnect( this, { position: 'positionOverlay' } );
	this.$overlay.remove();
};

/**
 * Reacts on selection changes and detects when the selection is fully within
 * the table.
 */
ve.ce.TableNode.prototype.onSurfaceModelSelect = function ( selection ) {
	var isSelected, tableSelection,
		range = this.model.getRange();

	// Consider this table focused when the selection is fully within the range
	isSelected = ( selection && range.containsRange( selection ) );

	// make sure that the selection does really belong to this table not to a nested one
	if ( isSelected ) {
		tableSelection = ve.dm.TableNode.static.lookupSelection( this.surface.getModel().getDocument(), selection );
		isSelected = ( tableSelection && tableSelection.node === this.model );
	}

	this.$element.toggleClass( 've-ce-tableNode-focused', isSelected );
	if ( isSelected ) {
		if ( !this.focused ) {
			this.focused = true;
			this.$overlay.show();
		}
		this.selectedRectangle = this.model.getRectangle( tableSelection.startCell, tableSelection.endCell );
		this.updateOverlay();
	} else if ( !isSelected && this.focused ) {
		this.focused = false;
		this.selectedRectangle = null;
		this.$overlay.hide();
	}
};

/**
 * Recomputes the overlay positions according to the current selection.
 *
 * @method
 */
ve.ce.TableNode.prototype.updateOverlay = function () {
	var i, l, $cells, $cell, cellOffset,
		top, left, bottom, right,
		tableOffset = this.$element[0].getClientRects()[0];

	$cells = this.getElementsForSelectedRectangle();

	top = Infinity;
	bottom = -Infinity;
	left = Infinity;
	right = -Infinity;

	// compute a bounding box for the given cell elements
	for ( i = 0, l = $cells.length; i < l; i++) {
		$cell = $cells[i];
		cellOffset = $cell[0].getClientRects()[0];

		top = Math.min( top, cellOffset.top );
		bottom = Math.max( bottom, cellOffset.bottom );
		left = Math.min( left, cellOffset.left );
		right = Math.max( right, cellOffset.right );
	}

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
	this.positionOverlay();
};

ve.ce.TableNode.prototype.positionOverlay = function () {
	var tableOffset = this.$element[0].getClientRects()[0],
		surfaceOffset = this.surface.getSurface().getBoundingClientRect();

	if ( !tableOffset ) {
		return;
	}

	this.$overlay.css( {
		left: tableOffset.left - surfaceOffset.left,
		top: tableOffset.top - surfaceOffset.top
	} );
};

/**
 * Retrieves DOM elements corresponding to the the cells for the current selection.
 */
ve.ce.TableNode.prototype.getElementsForSelectedRectangle = function () {
	var i, l, cell, cellNode, offset,
		cells = [],
		matrix = this.model.matrix,
		rect = matrix.getBoundingRectangle( this.selectedRectangle ),
		cellModels = matrix.getCellsForRectangle( rect );

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

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableNode );
