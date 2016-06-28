/*!
 * VisualEditor ContentEditable MetaItem class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable meta item node.
 *
 * @class
 * @extends ve.ce.LeafNode
 * @constructor
 * @param {ve.dm.MetaItem} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.MetaItem = function VeCeMetaItem() {
	// Parent constructor
	ve.ce.MetaItem.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ce.MetaItem, ve.ce.LeafNode );

/* Static properties */

ve.ce.MetaItem.static.tagName = 'div';
