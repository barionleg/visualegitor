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

ve.dm.Selection.static.newFromJSON = function ( doc, json ) {
	var hash = JSON.parse( json ),
		constructor = ve.dm.selectionFactory.lookup( hash.type );

	if ( !constructor ) {
		throw new Error( 'Unknown selection type ' + hash.name );
	}

	return constructor.static.newFromHash( doc, hash );
};

/* Methods */

ve.dm.Selection.prototype.clone = function () {
	throw new Error( 've.dm.Selection subclass must implement clone' );
};

ve.dm.Selection.prototype.getHashObject = function () {
	throw new Error( 've.dm.Selection subclass must implement getHashObject' );
};

ve.dm.Selection.prototype.toJSON = function () {
	return JSON.stringify( this.getHashObject() );
};

ve.dm.Selection.prototype.collapseToStart = function () {
	throw new Error( 've.dm.Selection subclass must implement collapseToStart' );
};

ve.dm.Selection.prototype.collapseToEnd = function () {
	throw new Error( 've.dm.Selection subclass must implement collapseToEnd' );
};

/**
 * Get the content ranges for this selection
 *
 * @return {ve.Range[]} Ranges
 */
ve.dm.Selection.prototype.getRanges = function () {
	throw new Error( 've.dm.Selection subclass must implement getRanges' );
};

ve.dm.Selection.prototype.getDocument = function () {
	return this.documentModel;
};

/**
 * Check if two selections are equal.
 *
 * @param {ve.dm.Selection} other Other selection
 * @return {boolean} Selections are equal
 */
ve.dm.Selection.prototype.equals = function () {
	throw new Error( 've.dm.Selection subclass must implement equals' );
};

ve.dm.Selection.prototype.isEmpty = function () {
	return false;
};

/* Factory */

ve.dm.selectionFactory = new OO.Factory();
