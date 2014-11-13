/*!
 * VisualEditor DataModel CommentMetaItem class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @extends ve.dm.MetaItem
 *
 * @constructor
 * @param {Object} element Reference to element in meta-linmod
 */
ve.dm.CommentMetaItem = function VeDmCommentMetaItem() {
	// Parent constructor
	ve.dm.CommentMetaItem.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.CommentMetaItem, ve.dm.MetaItem );

/* Static Properties */

ve.dm.CommentMetaItem.static.name = 'commentMeta';

ve.dm.CommentMetaItem.static.matchTagNames = [];

// mwTransclusionMetaItems are generated by ve.dm.CommentNode#toDataElement
// when comments are encountered outside of content branch nodes

ve.dm.CommentMetaItem.static.storeHtmlAttributes = false;

ve.dm.CommentMetaItem.static.toDomElements = function ( dataElement, doc ) {
	return [ doc.createComment( dataElement.attributes.text ) ];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.CommentMetaItem );
