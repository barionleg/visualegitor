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
ve.dm.TableSelection.prototype.getRanges = function () {
	var i, l, ranges = [],
		cells = this.getTableNode().matrix.getCellsForSelection( this );
	for ( i = 0, l = cells.length; i < l; i++ ) {
		ranges.push( cells[i].node.getRange() );
	}
	return ranges;
};

ve.dm.TableSelection.prototype.getOuterRanges = function () {
	var i, l, ranges = [],
		cells = this.getTableNode().matrix.getCellsForSelection( this );
	for ( i = 0, l = cells.length; i < l; i++ ) {
		ranges.push( cells[i].node.getOuterRange() );
	}
	return ranges;
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

ve.dm.TableSelection.prototype.isSingleCell = function () {
	return this.fromRow === this.toRow && this.fromCol === this.toCol;
};

ve.dm.TableSelection.prototype.getTableNode = function () {
	return this.getDocument().getBranchNodeFromOffset( this.tableRange.start + 1 );
};

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
