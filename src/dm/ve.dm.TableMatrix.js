/**
 * A helper class that allows random access to the table cells
 * and introduces place-holders for fields occupied by spanning cells,
 * making it a non-sparse representation of the sparse HTML model.
 * This is essential for the implementation of table manipulations, such as row insertions or deletions.
 *
 * Example:
 *
 * <table>
 *   <tr><td rowspan=2>1</td><td colspan=2>2</td><td rowspan=2 colspan=2>3</td></tr>
 *   <tr><td>4</td><td>5</td></tr>
 * </table>
 *
 * Visually this table would look like:
 *
 *  -------------------
 * | 1 | 2     | 3     |
 * |   |-------|       |
 * |   | 4 | 5 |       |
 *  -------------------
 *
 * The HTML model is sparse which makes it hard to read but also difficult to work with programmatically.
 * The corresponding TableCellMatrix would look like:
 *
 * | C[1] | C[2] | P[2] | C[3] | P[3] |
 * | P[1] | C[4] | C[5] | P[3] | P[3] |
 *
 * Where C[1] represents a Cell instance wrapping cell 1,
 * and P[1] a PlaceHolder instance owned by that cell.
 *
 * @class
 * @constructor
 * @param {ve.dm.TableNode} [tableNode] Reference to a table instance
 */
ve.dm.TableMatrix = function VeDmTableMatrix( tableNode ) {
	this.tableNode = tableNode;
	// Do not access these directly as they get invalidated on structural changes
	// Use the accessor methods instead.
	this.matrix = null;
	this.rowNodes = null;
};

/**
 * Invalidates the matrix structure.
 *
 * This is called by ve.dm.TableNode on structural changes.
 */
ve.dm.TableMatrix.prototype.invalidate = function () {
	this.matrix = null;
	this.rowNodes = null;
};

/**
 * Recreates the matrix structure.
 */
ve.dm.TableMatrix.prototype.update = function () {
	var cellNode, cell,
		rowSpan, colSpan, i, j, r, c,
		matrix = [],
		rowNodes = [],
		iterator = this.tableNode.getIterator(),
		row = -1, col = -1;

	// hook to react on row transitions
	iterator.onNewRow = function ( rowNode ) {
		row++;
		col = -1;
		// initialize a matrix row
		matrix[row] = matrix[row] || [];
		// store the row node
		rowNodes.push( rowNode );
	};

	// Iterates through all cells and stores the cells as well as
	// so called placeholders into the matrix.
	while ( ( cellNode = iterator.next() ) !== null )  {
		col++;
		// skip placeholders
		while ( matrix[row][col] ) {
			col++;
		}
		cell = new ve.dm.TableMatrixCell( cellNode, row, col );
		// store the cell in the matrix
		matrix[row][col] = cell;
		// add place holders for spanned cells
		rowSpan = cellNode.getRowspan();
		colSpan = cellNode.getColspan();

		if ( rowSpan === 1 && colSpan === 1 ) {
			continue;
		}

		for ( i = 0; i < rowSpan; i++ ) {
			for ( j = 0; j < colSpan; j++ ) {
				if ( i === 0 && j === 0 ) {
					continue;
				}
				r = row + i;
				c = col + j;
				// initialize the cell matrix row if not yet present
				matrix[r] = matrix[r] || [];
				matrix[r][c] = new ve.dm.TableMatrixPlaceholder( cell, r, c );
			}
		}
	}
	this.matrix = matrix;
	this.rowNodes = rowNodes;
};

/**
 * Retrieves a single cell.
 *
 * @param {Number} row Row
 * @param {Number} col Column
 * @returns {ve.dm.TableMatrixCell}
 */
ve.dm.TableMatrix.prototype.getCell = function ( row, col ) {
	var matrix = this.getMatrix();
	return matrix[row][col];
};

/**
 * Retrieves all cells of a column with given index.
 *
 * @param {Number} [col]
 * @returns {ve.dm.TableMatrixCell[]} The cells of a column
 */
ve.dm.TableMatrix.prototype.getColumn = function ( col ) {
	var cells, row,
		matrix = this.getMatrix();
	cells = [];
	for ( row = 0; row < matrix.length; row++ ) {
		cells.push( matrix[row][col] );
	}
	return cells;
};

/**
 * Retrieves all cells of a row with given index.
 *
 * @param {Number} [row]
 * @returns {ve.dm.TableMatrixCell[]} The cells of a row
 */
ve.dm.TableMatrix.prototype.getRow = function ( row ) {
	var matrix = this.getMatrix();
	return matrix[row];
};

/**
 * Retrieves the row node of a row with given index.
 *
 * @param {Number} [row]
 * @returns {ve.dm.TableRowNode}
 */
ve.dm.TableMatrix.prototype.getRowNode = function ( row ) {
	var rowNodes = this.getRowNodes();
	return rowNodes[row];
};

/**
 * Provides a reference to the internal cell matrix.
 *
 * Note: this is primarily for internal use. Do not change the delivered matrix
 * and do not store as it may be invalidated.
 *
 * @returns {ve.dm.TableMatrixCell[]}
 */
ve.dm.TableMatrix.prototype.getMatrix = function () {
	if ( !this.matrix ) {
		this.update();
	}
	return this.matrix;
};

/**
 * Provides a reference to the internal array of row nodes.
 *
 * Note: this is primarily for internal use. Do not change the delivered array
 * and do not store it as it may be invalidated.
 *
 * @returns {ve.dm.TableRowNode[]}
 */
ve.dm.TableMatrix.prototype.getRowNodes = function () {
	if ( !this.rowNodes ) {
		this.update();
	}
	return this.rowNodes;
};

/**
 * Retrieves all cells (no placeholders) within a given selection.
 *
 * @param {ve.dm.TableSelection} selection Table selection
 * @returns {ve.dm.TableMatrixCell[]} List of table cells
 */
ve.dm.TableMatrix.prototype.getCellsForSelection = function ( selection ) {
	var row, col, cell,
		cells = [],
		visited = {};

	for ( row = selection.startRow; row <= selection.endRow; row++ ) {
		for ( col = selection.startCol; col <= selection.endCol; col++ ) {
			cell = this.getCell( row, col );
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
 * Retrieves a bounding rectangle for all cells described by a given rectangle.
 * This takes spanning cells into account.
 *
 * @param {ve.dm.TableSelection} selection Selection
 * @returns {ve.dm.TableSelection} Bounding selection
 */
ve.dm.TableMatrix.prototype.getBoundingSelection = function ( selection ) {
	var cells, cell, i,
		startCol = Infinity,
		startRow = Infinity,
		endCol = -Infinity,
		endRow = -Infinity;

	cells = this.getCellsForSelection( selection );

	if ( !cells || cells.length === 0 ) {
		return null;
	}
	for ( i = 0; i < cells.length; i++ ) {
		cell = cells[i];
		startCol = Math.min( startCol, cell.col );
		startRow = Math.min( startRow, cell.row );
		endCol = Math.max( endCol, cell.col + cell.node.getColspan() - 1 );
		endRow = Math.max( endRow, cell.row + cell.node.getRowspan() - 1 );
	}
	return new ve.dm.TableSelection(
		selection.getDocument(),
		selection.tableRange,
		startCol,
		startRow,
		endCol,
		endRow
	);
};

/**
 * Provides a tuple with number of rows and columns.
 *
 * @returns {Number[]} Tuple: row count, column count
 */
ve.dm.TableMatrix.prototype.getSize = function () {
	var matrix = this.getMatrix();
	if ( matrix.length === 0 ) {
		return [0, 0];
	} else {
		return [matrix.length, matrix[0].length];
	}
};

/**
 * Looks up the cell for a given cell node.
 *
 * @returns {ve.dm.TableMatrixCell|null} The cell or null if not found
 */
ve.dm.TableMatrix.prototype.lookupCell = function ( cellNode ) {
	var row, col, cols, rowCells,
		matrix = this.getMatrix(),
		rowNodes = this.getRowNodes();

	row = ve.indexOf( cellNode.parent, rowNodes );
	if ( row < 0 ) {
		return null;
	}
	rowCells = matrix[row];
	for ( col = 0, cols = rowCells.length; col < cols; col++ ) {
		if ( rowCells[col].node === cellNode ) {
			return rowCells[col];
		}
	}
	return null;
};

/**
 * Finds the closest cell not being a placeholder for a given cell.
 *
 * @returns {ve.dm.TableMatrixCell} Table cell
 */
ve.dm.TableMatrix.prototype.findClosestCell = function ( cell ) {
	var col, cols, rowCells,
		matrix = this.getMatrix();

	rowCells = matrix[cell.row];
	for ( col = cell.col; col >= 0; col-- ) {
		if ( !rowCells[col].isPlaceholder() ) {
			return rowCells[col];
		}
	}
	for ( col = cell.col + 1, cols = rowCells.length; col < cols; col++) {
		if ( !rowCells[col].isPlaceholder() ) {
			return rowCells[col];
		}
	}
	return null;
};

/**
 * An object wrapping a table cell node, augmenting it with row and column indexes.
 *
 * @class
 * @constructor
 * @param {ve.dm.TableCellNode} node DM Node
 * @param {Number} row Row index
 * @param {Number} col Column index
 */
ve.dm.TableMatrixCell = function VeDmTableMatrixCell( node, row, col ) {
	this.node = node;
	this.row = row;
	this.col = col;
	this.key = row + '_' + col;
};

/* Inheritance */

OO.initClass( ve.dm.TableMatrixCell );

/* Methods */

ve.dm.TableMatrixCell.prototype.isPlaceholder = function () {
	return false;
};

/* Static Methods */

ve.dm.TableMatrixCell.static.sortDescending = function ( a, b ) {
	if ( a.row !== b.row ) {
		return b.row - a.row;
	}
	return b.col - a.col;
};

/**
 * An object representing a cell which is occupied by another cell with 'rowspan' or 'colspan' attribute.
 * Placeholders are used to create a dense representation of the sparse HTML table model.
 *
 * @class
 * @constructor
 * @param {ve.dm.TableMatrixCell} owner Owner cell
 * @param {Number} row Row index
 * @param {Number} col Column index
 */
ve.dm.TableMatrixPlaceholder = function VeDmTableMatrixPlaceHolder( owner, row, col ) {
	ve.dm.TableMatrixPlaceholder.super.call( this, owner.node, row, col );
	this.owner = owner;
};

/* Inheritance */

OO.inheritClass( ve.dm.TableMatrixPlaceholder, ve.dm.TableMatrixCell );

/* Methods */

ve.dm.TableMatrixPlaceholder.prototype.isPlaceholder = function () {
	return true;
};

/**
 * An object describing a rectangular selection in a table matrix.
 * It has two properties, 'start' and 'end', which both are objects with
 * properties 'row' and 'col'. 'start' describes the upper-left, and
 * 'end' the lower-right corner of the rectangle.
 *
 * @class
 * @constructor
 * @param {Number} minRow row Index of upper-left corner
 * @param {Number} minCol column Index of upper-left corner
 * @param {Number} maxRow row Index of lower-left corner
 * @param {Number} maxCol column Index of lower-left corner
 */
ve.dm.TableMatrixRectangle = function ( minRow, minCol, maxRow, maxCol ) {
	this.start = { row: minRow, col: minCol };
	this.end = { row: maxRow, col: maxCol };
};

/* Methods */

ve.dm.TableMatrixRectangle.prototype.clone = function () {
	return new this.constructor( this.start.row, this.start.col, this.end.row, this.end.col );
};
