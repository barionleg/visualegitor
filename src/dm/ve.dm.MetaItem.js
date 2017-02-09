/*!
 * VisualEditor DataModel MetaItem class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel meta item.
 *
 * @class
 * @abstract
 * @extends ve.dm.LeafNode
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {Object} element Reference to element in meta-linmod
 */
ve.dm.MetaItem = function VeDmMetaItem() {
	// Parent constructor
	ve.dm.MetaItem.super.apply( this, arguments );
	// Mixin
	OO.EventEmitter.call( this );
};

/* Inheritance */

OO.inheritClass( ve.dm.MetaItem, ve.dm.LeafNode );

OO.mixinClass( ve.dm.MetaItem, OO.EventEmitter );

/* Static members */

ve.dm.MetaItem.static.isContent = false;

ve.dm.MetaItem.static.canSerializeAsContent = true;
