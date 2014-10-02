/*!
 * VisualEditor Table Selection class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @extends ve.dm.Selection
 * @constructor
 * @param {ve.dm.Document} doc Document model
 * @param {ve.Range} tableRange Table range
 * @param {number} fromCol Starting column
 * @param {number} fromRow Starting row
 * @param {number} [toCol] End column
 * @param {number} [toRow] End row
 */
ve.dm.TableSelection = function VeDmTableSelection( doc, tableRange, fromCol, fromRow, toCol, toRow ) {
	// Parent constructor
	ve.dm.TableSelection.super.call( this, doc );

	this.tableRange = tableRange;

	this.fromCol = fromCol;
	this.fromRow = fromRow;
	this.toCol = toCol === undefined ? this.fromCol : toCol;
	this.toRow = toRow === undefined ? this.fromRow : toRow;
	this.startCol = fromCol < toCol ? fromCol : toCol;
	this.startRow = fromRow < toRow ? fromRow : toRow;
	this.endCol = fromCol < toCol ? toCol : fromCol;
	this.endRow = fromRow < toRow ? toRow : fromRow;

	this.expand();
};

/* Inheritance */

OO.inheritClass( ve.dm.TableSelection, ve.dm.Selection );

/* Static Properties */

ve.dm.TableSelection.static.name = 'table';

/* Static Methods */

/**
 * @inheritdoc
 */
ve.dm.TableSelection.static.newFromHash = function ( doc, hash ) {
	return new ve.dm.LinearSelection(
		doc,
		ve.Range.static.newFromHash( hash.tableRange ),
		hash.fromCol,
		hash.fromRow,
		hash.toCol,
		hash.toRow
	);
};

/* Methods */

/**
 * Expand the selection to cover all merged cells
 *
 * @private
 */
ve.dm.TableSelection.prototype.expand = function () {
	var cell, i,
		lastCellCount = 1,
		startCol = Infinity,
		startRow = Infinity,
		endCol = -Infinity,
		endRow = -Infinity,
		colBackwards = this.fromCol > this.toCol,
		rowBackwards = this.fromRow > this.toRow,
		cells = this.getMatrixCells();

	while ( cells.length > lastCellCount ) {
		for ( i = 0; i < cells.length; i++ ) {
			cell = cells[i];
			startCol = Math.min( startCol, cell.col );
			startRow = Math.min( startRow, cell.row );
			endCol = Math.max( endCol, cell.col + cell.node.getColspan() - 1 );
			endRow = Math.max( endRow, cell.row + cell.node.getRowspan() - 1 );
		}
		this.startCol = startCol;
		this.startRow = startRow;
		this.endCol = endCol;
		this.endRow = endRow;
		this.fromCol = colBackwards ? endCol : startCol;
		this.fromRow = rowBackwards ? endRow : startRow;
		this.toCol = colBackwards ? startCol : endCol;
		this.toRow = rowBackwards ? startRow : endRow;

		lastCellCount = cells.length;
		cells = this.getMatrixCells();
	}
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.clone = function () {
	return new this.constructor( this.getDocument(), this.tableRange, this.fromCol, this.fromRow, this.toCol, this.toRow );
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.getHashObject = function () {
	return {
		type: this.constructor.static.name,
		tableRange: this.tableRange.getHashObject(),
		fromCol: this.fromCol,
		fromRow: this.fromRow,
		toCol: this.toCol,
		toRow: this.toRow
	};
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.collapseToStart = function () {
	return new this.constructor( this.getDocument(), this.tableRange, this.startCol, this.startRow, this.startCol, this.startRow );
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.collapseToEnd = function () {
	return new this.constructor( this.getDocument(), this.tableRange, this.endCol, this.endRow, this.endCol, this.endRow );
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.collapseToFrom = function () {
	return new this.constructor( this.getDocument(), this.tableRange, this.fromCol, this.fromRow, this.fromCol, this.fromRow );
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.collapseToTo = function () {
	return new this.constructor( this.getDocument(), this.tableRange, this.toCol, this.toRow, this.toCol, this.toRow );
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.getRanges = function () {
	var i, l, ranges = [],
		cells = this.getMatrixCells();
	for ( i = 0, l = cells.length; i < l; i++ ) {
		ranges.push( cells[i].node.getRange() );
	}
	return ranges;
};

/**
 * Get outer ranges of the selected cells
 *
 * @return {ve.Range[]} Outer ranges
 */
ve.dm.TableSelection.prototype.getOuterRanges = function () {
	var i, l, ranges = [],
		cells = this.getMatrixCells();
	for ( i = 0, l = cells.length; i < l; i++ ) {
		ranges.push( cells[i].node.getOuterRange() );
	}
	return ranges;
};

/**
 * Retrieves all cells (no placeholders) within a given selection.
 *
 * @returns {ve.dm.TableMatrixCell[]} List of table cells
 */
ve.dm.TableSelection.prototype.getMatrixCells = function () {
	var row, col, cell,
		matrix = this.getTableNode().getMatrix(),
		cells = [],
		visited = {};

	for ( row = this.startRow; row <= this.endRow; row++ ) {
		for ( col = this.startCol; col <= this.endCol; col++ ) {
			cell = matrix.getCell( row, col );
			if ( cell.isPlaceholder() ) {
				cell = cell.owner;
			}
			if ( !visited[cell.key] ) {
				cells.push( cell );
				visited[cell.key] = true;
			}
		}
	}
	return cells;
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.isCollapsed = function () {
	return false;
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.translateByTransaction = function ( tx, excludeInsertion ) {
	return new this.constructor(
		this.getDocument(), tx.translateRange( this.tableRange, excludeInsertion ),
		this.fromCol, this.fromRow, this.toCol, this.toRow
	);
};

/**
 * Check if the selection spans a single cell
 * @return {boolean} The selection spans a single cell
 */
ve.dm.TableSelection.prototype.isSingleCell = function () {
	return this.fromRow === this.toRow && this.fromCol === this.toCol;
};

/**
 * Get the selection's table node
 *
 * @return {ve.dm.TableNode} Table node
 */
ve.dm.TableSelection.prototype.getTableNode = function () {
	return this.getDocument().getBranchNodeFromOffset( this.tableRange.start + 1 );
};

/**
 * Clone this selection with adjust row and column positions
 *
 * @param {number} fromColOffset Starting column offset
 * @param {number} fromRowOffset Starting row offset
 * @param {number} toColOffset End column offset
 * @param {number} toRowOffset End row offset
 * @return {ve.dm.TableSelection} Adjusted selection
 */
ve.dm.TableSelection.prototype.newFromAdjustment = function ( fromColOffset, fromRowOffset, toColOffset, toRowOffset ) {
	return new this.constructor(
		this.getDocument(),
		this.tableRange,
		this.fromCol + fromColOffset,
		this.fromRow + fromRowOffset,
		this.toCol + ( toColOffset !== undefined ? toColOffset : fromColOffset ),
		this.toRow + ( toRowOffset !== undefined ? toRowOffset : fromRowOffset )
	);
};

/**
 * @inheritdoc
 */
ve.dm.TableSelection.prototype.equals = function ( other ) {
	return other instanceof ve.dm.TableSelection &&
		this.getDocument() === other.getDocument() &&
		this.tableRange.equals( other.tableRange ) &&
		this.fromCol === other.fromCol &&
		this.fromRow === other.fromRow &&
		this.toCol === other.toCol &&
		this.toRow === other.toRow;
};

/* Registration */

ve.dm.selectionFactory.register( ve.dm.TableSelection );
