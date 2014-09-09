/*!
 * VisualEditor ContentEditable TableNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Table action.
 *
 * @class
 * @extends ve.ui.Action
 * @constructor
 * @param {ve.ui.Surface} surface Surface to act on
 */
ve.ui.TableAction = function VeUiTableAction( surface ) {
	// Parent constructor
	ve.ui.Action.call( this, surface );
};

/* Inheritance */

OO.inheritClass( ve.ui.TableAction, ve.ui.Action );

/* Static Properties */

ve.ui.TableAction.static.name = 'table';

/**
 * List of allowed methods for the action.
 *
 * @static
 * @property
 */
ve.ui.TableAction.static.methods = [ 'create', 'insert', 'delete' ];

/* Methods */

/**
 * Creates a new table.
 *
 * @param {Object} [options] An object with properties 'rows', the number of rows,
 *   'cols', the number of columns, and 'header', a boolean indicating whether a header section should
 *   be created
 */
ve.ui.TableAction.prototype.create = function ( options ) {
	options = options || {};
	var i,
		surfaceModel = this.surface.getModel(),
		fragment = surfaceModel.getFragment(),
		data = [],
		numberOfCols = options.cols || 4,
		numberOfRows = options.rows || 3;

	data.push( { type: 'table' } );
	if ( options.header ) {
		data.push( { type: 'tableSection', attributes: { style: 'header' } } );
		data = data.concat( ve.dm.TableRowNode.createData( { style: 'header', cellCount: numberOfCols } ) );
		data.push( { type: '/tableSection' } );
	}
	data.push( { type: 'tableSection', attributes: { style: 'body' } } );
	for ( i = 0; i < numberOfRows; i++ ) {
		data = data.concat( ve.dm.TableRowNode.createData( { style: 'data', cellCount: numberOfCols } ) );
	}
	data.push( { type: '/tableSection' } );
	data.push( { type: '/table' } );

	fragment.insertContent( data, false );
	// Skip over table, tableSection, tableRow, tableCell and paragraph to get to content offset
	surfaceModel.setSelection( fragment.adjustRange( 5 ).collapseToStart().getRange() );
};

/**
 * Inserts a new row or column into the currently focused table.
 *
 * @param {String} mode 'row' to insert a new row, and 'col' for a new column
 * @param {String} position 'before' to insert before the current selection,
 *   and 'after' to insert after it
 */
ve.ui.TableAction.prototype.insert = function ( mode, position ) {
	var tableSelection, table, matrix, rect, index,
		surfaceModel = this.surface.getModel();

	tableSelection = ve.dm.TableNode.static.lookupSelection( surfaceModel.documentModel, surfaceModel.selection );
	if ( !tableSelection ) {
		return;
	}
	// Retrieve the bounding rectangle
	table = tableSelection.node;
	matrix = tableSelection.node.matrix;
	rect = matrix.getRectangle( tableSelection.startCell, tableSelection.endCell );
	rect = matrix.getBoundingRectangle( rect );
	// and insert either before or after
	index = (position === 'before') ? rect.start[mode] : rect.end[mode];
	this.insertRowOrCol( table, mode, index, position );
};

/**
 * Deletes selected rows, columns, or the whole table.
 *
 * @param {String} mode 'row' to delete rows, 'col' for columns, and 'table' to remove the whole table
 */
ve.ui.TableAction.prototype.delete = function ( mode ) {
	var tableSelection, table, matrix, rect, minIndex, maxIndex,
		surfaceModel = this.surface.getModel();

	tableSelection = ve.dm.TableNode.static.lookupSelection( surfaceModel.documentModel, surfaceModel.selection );
	if ( !tableSelection ) {
		return;
	}
	// Either delete the table or rows or columns
	table = tableSelection.node;
	matrix = tableSelection.node.matrix;
	if ( mode === 'table' ) {
		this.deleteTable( tableSelection.node );
	} else {
		// Retrieve the bounding rectangle
		rect = matrix.getRectangle( tableSelection.startCell, tableSelection.endCell );
		rect = matrix.getBoundingRectangle( rect );
		minIndex = rect.start[mode];
		maxIndex = rect.end[mode];
		// delete the whole table if all rows or cols get deleted
		if ( minIndex === 0 && maxIndex === table.getSize( mode ) - 1 ) {
			this.deleteTable( table );
		} else {
			this.deleteRowsOrColumns( table, mode, minIndex, maxIndex );
		}
	}
};

// Low-level API
// -------------
// TODO This API does only depend on DM code, so it would make sense to
// move this into DM world later

/**
 * Deletes a whole table.
 *
 * @param {ve.dm.TableNode} table Table node
 */
ve.ui.TableAction.prototype.deleteTable = function ( table ) {
	var surfaceModel = this.surface.getModel(),
		tx = ve.dm.Transaction.newFromRemoval(
			surfaceModel.getDocument(),
			table.getOuterRange()
		);
	// TODO: maybe a better selection
	surfaceModel.change( tx );
};

/**
 * Inserts a new row or column.
 *
 * Example: a new row can be inserted after the 2nd row using
 *
 *    insertRowOrCol( table, 'row', 1, 'after' );
 *
 * @param {ve.dm.TableNode} table
 * @param {String} mode 'row' or 'col'
 * @param {Number} index row or column index of the base row or column.
 * @param {String} insertMode 'before' or 'after'
 */
ve.ui.TableAction.prototype.insertRowOrCol = function ( table, mode, index, insertMode ) {
	var matrix, refIndex, cells, refCells, before,
		offset, range, i, cell, refCell, data, style,
		txs = [],
		updated = {},
		inserts = [],
		surfaceModel = this.surface.getModel();

	before = insertMode === 'before';
	matrix = table.matrix;

	// Note: when we insert a new row (or column) we might need to increment a span property
	// instead of inserting a new cell.
	// To achieve this we look at the so called base row and a so called reference row.
	// The base row is the one after or before that the new row will be inserted.
	// The reference row is the one which is currently at the place of the new one.
	// E.g., consider to insert a new row after the second: the base row is the second, the
	// reference row is the third.
	// A span must be increased if the base cell and the reference cell have the same 'owner'.
	// E.g.:  C* | P**; C | P* | P**, i.e., one of the two cells might be the owner of the other,
	// or vice versa, or both a placeholders of a common cell.

	// the index of the reference row or column
	refIndex = index + (before ? -1 : 1);
	// cells of the selected row or column
	if ( mode === 'row' ) {
		cells = matrix.getRow( index ) || [];
		refCells = matrix.getRow( refIndex ) || [];
	} else {
		cells = matrix.getColumn( index ) || [];
		refCells = matrix.getColumn( refIndex ) || [];
	}

	for ( i = 0; i < cells.length; i++ ) {
		cell = cells[i];
		refCell = refCells[i];
		// detect if span update is necessary
		if ( refCell && ( cell.type === 'placeholder' || refCell.type === 'placeholder' ) ) {
			if ( cell.node === refCell.node ) {
				cell = cell.owner || cell;
				if ( !updated[cell.key] ) {
					// Note: we can record the span modification, as it will not mess range indexes.
					txs.push( this.incrementSpan( surfaceModel, cell, mode ) );
					updated[cell.key] = true;
				}
				continue;
			}
		}
		// If it is not a span changer, we record the base cell as a reference for insertion
		inserts.push(cell);
	}

	// Inserting a new row differs completely from inserting a new column:
	// For a new row, a new row node is created, and inserted relative to an existing row node.
	// For a new column, new cells are inserted into existing row nodes at appropriate positions,
	// i.e., relative to an existing cell node.
	if ( mode === 'row' ) {
		data = ve.dm.TableRowNode.createData({
			cellCount: inserts.length,
			// taking the style of the first cell of the selected row
			style: cells[0].node.getStyle()
		});
		range = matrix.getRowNode(index).getOuterRange();
		offset = before ? range.start : range.end;
		txs.push( ve.dm.Transaction.newFromInsertion( surfaceModel.getDocument(), offset, data ) );
	} else {
		// making sure that the inserts are in descending order
		// so that the transactions do not interfer with respect to ranges.
		inserts.sort( ve.dm.TableMatrixCell.static.sortDescending );

		// For inserting a new cell we need to find a reference cell node
		// which we can use to get a proper insertion offset.
		for (i = 0; i < inserts.length; i++) {
			cell = inserts[i];
			// if the cell is a placeholder, this will find a close cell node in the same row
			refCell = matrix.findClosestCell( cell );
			if ( refCell ) {
				range = refCell.node.getOuterRange();
				// if the found cell is before the base cell the new cell must be placed after it, in any case,
				// Only if the base cell is not a placeholder we have to consider the insert mode.
				if ( refCell.col < cell.col || ( refCell.col === cell.col && !before ) ) {
					offset = range.end;
				} else {
					offset = range.start;
				}
				style = refCell.node.getStyle();
			} else {
				// if there are only placeholders in the row, we use the row node's inner range
				// for the insertion offset
				range = matrix.getRowNode( cell.row ).getRange();
				offset = before ? range.start : range.end;
				style = cells[0].node.getStyle();
			}
			data = ve.dm.TableCellNode.createData( { style: style } );
			txs.push( ve.dm.Transaction.newFromInsertion( surfaceModel.getDocument(), offset, data ) );
		}
	}
	surfaceModel.change( txs );
};

/**
 * Increase the span of a cell by one.
 *
 * @param {ve.dm.TableMatrixCell} cell
 * @param {String} mode 'row' or 'col'
 */
ve.ui.TableAction.prototype.incrementSpan = function ( cell, mode ) {
	var data,
		surfaceModel = this.surface.getModel();

	if ( mode === 'row' ) {
		data = { rowspan: cell.node.getRowspan() + 1 };
	} else {
		data = { colspan: cell.node.getColspan() + 1 };
	}

	return ve.dm.Transaction.newFromAttributeChanges( surfaceModel.getDocument(), cell.node.getOuterRange().start, data );
};

/**
 * Decreases the span of a cell so that the given interval is removed.
 *
 * @param {ve.dm.TableMatrix.Cell} cell
 * @param {String} mode 'row' or 'col'
 * @param {Number} minIndex smallest row or column index
 * @param {Number} maxIndex largest row or column index
 */
ve.ui.TableAction.prototype.decrementSpan = function ( cell, mode, minIndex, maxIndex ) {
	var span, data,
		surfaceModel = this.surface.getModel();

	span = ( minIndex - cell[mode] ) + Math.max( 0, cell[mode] + cell.node.getSpans()[mode] - 1 - maxIndex );
	if ( mode === 'row' ) {
		data = { rowspan: span };
	} else {
		data = { colspan: span };
	}

	return ve.dm.Transaction.newFromAttributeChanges( surfaceModel.getDocument(), cell.node.getOuterRange().start, data );
};

/**
 * Deletes currently rows or columns within a given range.
 *
 * E.g., the rows 2-4 can be deleted using
 *
 *    ve.ui.TableAction.deleteRowsOrColumns( table, 'row', 1, 3 );
 *
 * @param {ve.dm.TableNode} table
 * @param {String} mode 'row' or 'col'
 * @param {Number} minIndex smallest row or column index to be deleted
 * @param {Number} maxIndex largest row or column index to be deleted (inclusive)
 */
ve.ui.TableAction.prototype.deleteRowsOrColumns = function ( table, mode, minIndex, maxIndex ) {
	var row, col, i, l, cell, key,
		span, startRow, startCol, endRow, endCol, rowNode,
		cells = [],
		txs = [],
		adapted = {},
		actions = [],
		matrix = table.matrix,
		surfaceModel = this.surface.getModel();

	// Deleting cells can have two additional consequences:
	// 1. The cell is a Placeholder. The owner's span might be decreased.
	// 2. The cell is owner of placeholders which get orphaned by the deletion.
	//    New, empty cells much be inserted to replace the placeholders and keep the
	//    table in proper shape.
	// Insertions and deletions of cells must be done in an appropriate order, so that the transactions
	// do not interfer with each other. To achieve that, we record insertions and deletions and
	// sort them by the position of the cell (row, column) in the table matrix.

	if ( mode === 'row' ) {
		for ( row = minIndex; row <= maxIndex; row++ ) {
			cells = cells.concat( matrix.getRow( row ) );
		}
	} else {
		for ( col = minIndex; col <= maxIndex; col++ ) {
			cells = cells.concat( matrix.getColumn( col ) );
		}
	}

	for ( i = 0, l = cells.length; i < l; i++) {
		cell = cells[i];

		if ( cell.type === 'placeholder' ) {
			key = cell.owner.key;
			if ( !adapted[key] ) {
				// Note: we can record this transaction already, as it does not have an effect on the
				// node range
				txs.push( this.decrementSpan( cell.owner, mode, minIndex, maxIndex ) );
				adapted[key] = true;
			}
			continue;
		}

		// Detect if the owner of a spanning cell gets deleted and
		// leaves orpaned placeholders
		span = cell.node.getSpans()[mode];
		if ( cell[mode] + span - 1  > maxIndex ) {
			// add inserts for orphaned place holders
			if ( mode === 'col' ) {
				startRow = cell.row;
				startCol = maxIndex + 1;
			} else {
				startRow = maxIndex + 1;
				startCol = cell.col;
			}
			endRow = cell.row + cell.node.getRowspan() - 1;
			endCol = cell.col + cell.node.getColspan() - 1;

			// Record the insertion to apply it later
			for ( row = startRow; row <= endRow; row++ ) {
				for ( col = startCol; col <= endCol; col++ ) {
					actions.push( { action: 'insert', cell: matrix.getCell( row, col ) } );
				}
			}
		}

		// Cell nodes only get deleted when deleting columns (otherwise row nodes)
		if ( mode === 'col' ) {
			actions.push( { action: 'delete', cell: cell });
		}
	}

	// Sort recorded actions to make sure the transactions will not interfer with respect to offsets
	actions.sort( function ( a, b ) {
		// Sorts first by row, then by column (corresponding to HTML flow in tables)
		return ve.dm.TableMatrixCell.static.sortDescending( a.cell, b.cell );
	} );

	if ( mode === 'row' ) {
		// First replace orphaned placeholders which are below the last deleted row,
		// thus, this works with regard to transaction offsets
		for ( i = 0; i < actions.length; i++ ) {
			txs.push( this.replacePlaceholder( table, actions[i].cell ) );
		}
		// remove rows in reverse order to have valid transaction offsets
		for ( row = maxIndex; row >= minIndex; row-- ) {
			rowNode = matrix.getRowNode( row );
			txs.push( ve.dm.Transaction.newFromRemoval( surfaceModel.getDocument(), rowNode.getOuterRange() ) );
		}
	} else {
		for ( i = 0; i < actions.length; i++ ) {
			if ( actions[i].action === 'insert' ) {
				txs.push( this.replacePlaceholder( table, actions[i].cell ) );
			} else {
				txs.push( ve.dm.Transaction.newFromRemoval( surfaceModel.getDocument(), actions[i].cell.node.getOuterRange() ) );
			}
		}
	}
	surfaceModel.change( txs );
};

/**
 * Inserts a new cell for an orphaned placeholder.
 *
 * @param {ve.dm.TableNode} table
 * @param {ve.dm.TableMatrixPlaceholder} placeholder
 */
ve.ui.TableAction.prototype.replacePlaceholder = function ( table, placeholder ) {
	var range, offset, data, style,
		matrix = table.matrix,
		// For inserting the new cell a reference cell node
		// which is used to get an insertion offset.
		refCell = matrix.findClosestCell( placeholder ),
		surfaceModel = this.surface.getModel();

	if ( refCell ) {
		range = refCell.node.getOuterRange();
		offset = ( placeholder.col < refCell.col ) ? range.start : range.end;
		style = refCell.node.getStyle();
	} else {
		// if there are only placeholders in the row, the row node's inner range is used
		range = matrix.getRowNode( placeholder.row ).getRange();
		offset = range.start;
		style = placeholder.node.getStyle();
	}
	data = ve.dm.TableCellNode.createData( { style: style } );
	return ve.dm.Transaction.newFromInsertion( surfaceModel.getDocument(), offset, data );
};

/* Registration */

ve.ui.actionFactory.register( ve.ui.TableAction );
