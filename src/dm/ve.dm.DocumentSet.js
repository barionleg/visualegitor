/*!
 * VisualEditor DataModel DocumentSet class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel document set.
 *
 * @class
 * @constructor
 * @param {string} [lang='en'] Language code
 * @param {string} [dir='ltr'] Direction ('ltr' or 'rtl')
 */
ve.dm.DocumentSet = function VeDmDocumentSet( lang, dir ) {
	// SUBDOCUMENT TODO:
	// Shared IVStore
	// History aggregation of some kind?
	// Group management / tracking (for references)
	// Move some of the converter state (like HTMLDocument) here?
	this.documents = [ null ]; // Placeholder for main document at index 0
	this.lang = lang || 'en';
	this.dir = dir || 'ltr';
};

OO.initClass( ve.dm.DocumentSet );

/* Methods */

/**
 * Get the document at a given index.
 * @param {number} index Index of document
 * @return {ve.dm.Document|null} Document at given index
 */
ve.dm.DocumentSet.prototype.getDocument = function ( index ) {
	return this.documents[index] || null;
};

ve.dm.DocumentSet.prototype.getMainDocument = function () {
	return this.documents[0];
};

ve.dm.DocumentSet.prototype.setMainDocument = function ( doc ) {
	// SUBDOCUMENT TODO: urgghhh
	if ( this.documents[0] ) {
		throw new Error( 'Cannot overwrite main document' );
	}
	this.documents[0] = doc;
	doc.attachToSet( this );
};

/**
 * Add a document to the set.
 * @param {ve.dm.Document} doc Document to add
 * @return {number} Index of the newly added document
 */
ve.dm.DocumentSet.prototype.addDocument = function ( doc ) {
	var index = this.documents.push( doc ) - 1;
	doc.attachToSet( this ); // SUBDOCUMENT TODO should the document know its index? For efficient reverse lookup
	return index;
};

/**
 * Get the content language
 * @return {string} Language code
 */
ve.dm.DocumentSet.prototype.getLang = function () {
	return this.lang;
};

/**
 * Get the content directionality
 * @return {string} Direction ('ltr' or 'rtl')
 */
ve.dm.DocumentSet.prototype.getDir = function () {
	return this.dir;
};

ve.dm.DocumentSet.prototype.clone = function () {
	var i, len, docClone, clone = new this.constructor( this.lang, this.dir );
	for ( i = 0, len = this.documents.length; i < len; i++ ) {
		docClone = this.documents[i].clone();
		clone.documents[i] = docClone;
		docClone.attachToSet( clone );
	}
	return clone;
};
