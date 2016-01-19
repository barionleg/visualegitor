/*!
 * VisualEditor DataModel TableSlice class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel document slice
 *
 * @class
 * @extends ve.dm.Document
 * @constructor
 * @param {HTMLDocument|Array|ve.dm.ElementLinearData|ve.dm.FlatLinearData} data
 * @param {HTMLDocument} [htmlDocument]
 * @param {ve.dm.Document} [parentDocument]
 * @param {ve.dm.InternalList} [internalList]
 * @param {ve.Range} [tableRange] Table range
 */
ve.dm.TableSlice = function VeDmTableSlice( data, htmlDocument, parentDocument, internalList, tableRange ) {
	// Parent constructor
	ve.dm.TableSlice.super.call( this, data, htmlDocument, parentDocument, internalList, tableRange, tableRange );
};

/* Inheritance */

OO.inheritClass( ve.dm.TableSlice, ve.dm.DocumentSlice );

/* Methods */

ve.dm.TableSlice.prototype.getTableNode = function () {
	if ( !this.documentNode.length ) {
		this.rebuildTree();
	}
	return this.documentNode.children[ 0 ];
};
