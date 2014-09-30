/*!
 * VisualEditor Selection class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @abstract
 * @constructor
 * @param {ve.dm.Document} doc Document
 */
ve.dm.Selection = function VeDmSelection( doc ) {
	this.documentModel = doc;
};

/* Inheritance */

OO.initClass( ve.dm.Selection );

/* Static Properties */

ve.dm.Selection.static.type = null;

/* Static Methods */

/**
 * Create a new selection from a JSON serialization
 *
 * @param {ve.dm.Document} doc Document to create the selection on
 * @param {string} json JSON serialization
 * @returns {ve.dm.Selection} New selection
 * @throws {Error} Unknown selection type
 */
ve.dm.Selection.static.newFromJSON = function ( doc, json ) {
	var hash = JSON.parse( json ),
		constructor = ve.dm.selectionFactory.lookup( hash.type );

	if ( !constructor ) {
		throw new Error( 'Unknown selection type ' + hash.name );
	}

	return constructor.static.newFromHash( doc, hash );
};

/**
 * Create a new selection from a hash object
 *
 * @param {ve.dm.Document} doc Document to create the selection on
 * @param {string} hash Hash object
 * @returns {ve.dm.Selection} New selection
 */
ve.dm.Selection.static.newFromHash = function () {
	throw new Error( 've.dm.Selection subclass must implement newFromHash' );
};

/* Methods */

/**
 * Get a hash object summarizing this selection
 *
 * @returns {Object} Hash object
 */
ve.dm.Selection.prototype.getHashObject = function () {
	throw new Error( 've.dm.Selection subclass must implement getHashObject' );
};

/**
 * Get a JSON serialization of this selection
 *
 * @returns {string} JSON serialization
 */
ve.dm.Selection.prototype.toJSON = function () {
	return JSON.stringify( this.getHashObject() );
};

/**
 * Create a copy of this selection
 *
 * @returns {ve.dm.Selection} Cloned selection
 */
ve.dm.Selection.prototype.clone = function () {
	throw new Error( 've.dm.Selection subclass must implement clone' );
};

/**
 * Get a new selection at the start of this one
 *
 * @returns {ve.dm.Selection} Collapsed selection
 */
ve.dm.Selection.prototype.collapseToStart = function () {
	throw new Error( 've.dm.Selection subclass must implement collapseToStart' );
};

/**
 * Get a new selection at the end of this one
 *
 * @returns {ve.dm.Selection} Collapsed selection
 */
ve.dm.Selection.prototype.collapseToEnd = function () {
	throw new Error( 've.dm.Selection subclass must implement collapseToEnd' );
};

/**
 * Check if a selection is collapsed
 *
 * @returns {boolean} Selection is collapsed
 */
ve.dm.Selection.prototype.isCollapsed = function () {
	throw new Error( 've.dm.Selection subclass must implement isCollapsed' );
};

/**
 * Apply translations from a transaction
 *
 * @param {ve.dm.Transaction} tx Transaction
 * @param {boolean} [excludeInsertion] Do not grow to cover insertions at boundaries
 * @return {ve.dm.Selection} A new translated selection
 */
ve.dm.Selection.prototype.translateByTransaction = function () {
	throw new Error( 've.dm.Selection subclass must implement translateByTransaction' );
};

/**
 * Apply translations from a set of transactions
 *
 * @param {ve.dm.Transaction[]} txs Transactions
 * @param {boolean} [excludeInsertion] Do not grow to cover insertions at boundaries
 * @return {ve.dm.Selection} A new translated selection
 */
ve.dm.Selection.prototype.translateByTransactions = function ( txs, excludeInsertion ) {
	var i, l, selection = this;
	for ( i = 0, l = txs.length; i < l; i++ ) {
		selection = selection.translateByTransaction( txs[i], excludeInsertion );
	}
	return selection;
};

/**
 * Check if this selection is null
 *
 * @returns {boolean} The selection is null
 */
ve.dm.Selection.prototype.isNull = function () {
	return false;
};

/**
 * Get the content ranges for this selection
 *
 * @returns {ve.Range[]} Ranges
 */
ve.dm.Selection.prototype.getRanges = function () {
	throw new Error( 've.dm.Selection subclass must implement getRanges' );
};

/**
 * Get the document model this selection applies to
 *
 * @returns {ve.dm.Document} Document model
 */
ve.dm.Selection.prototype.getDocument = function () {
	return this.documentModel;
};

/**
 * Check if two selections are equal
 *
 * @param {ve.dm.Selection} other Other selection
 * @returns {boolean} Selections are equal
 */
ve.dm.Selection.prototype.equals = function () {
	throw new Error( 've.dm.Selection subclass must implement equals' );
};

/* Factory */

ve.dm.selectionFactory = new OO.Factory();
