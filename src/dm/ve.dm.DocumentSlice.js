/*!
 * VisualEditor DataModel DocumentSlice class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel document slice
 *
 * @class
 * @extends ve.dm.Document
 * @constructor
 * @param {HTMLDocument|Array|ve.dm.ElementLinearData|ve.dm.FlatLinearData} data
 * @param {HTMLDocument} [htmlDocument]
 * @param {ve.dm.InternalList} [internalList]
 * @param {ve.Range} [originalRange] Range of original data
 * @param {ve.Range} [balancedRange] Range of balanced data
 */
ve.dm.DocumentSlice = function VeDmDocumentSlice( data, htmlDocument, internalList, originalRange, balancedRange ) {
	// Parent constructor
	ve.dm.DocumentSlice.super.call( this, data, htmlDocument, internalList );

	this.originalRange = originalRange;
	this.balancedRange = balancedRange;
};

/* Inheritance */

OO.inheritClass( ve.dm.DocumentSlice, ve.dm.Document );

/* Methods */

ve.dm.DocumentSlice.prototype.getOriginalData = function () {
	return this.getData( this.originalRange );
};

ve.dm.DocumentSlice.prototype.getBalancedData = function () {
	return this.getData( this.balancedRange );
};
