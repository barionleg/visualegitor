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

/**
 * Symbolic name for the group this meta item type will be grouped in in ve.dm.MetaList.
 *
 * @static
 * @property
 * @inheritable
 */
ve.dm.MetaItem.static.group = 'misc';

/* Methods */

/**
 * Remove item from the meta list
 */
ve.dm.MetaItem.prototype.remove = function () {
	XXXXXXXXX apply a TX

	var index,
		parent = this.getParent();
	if ( !parent ) {
		throw new Error( 'Cannot remove parentless item' );
	}
	index = parent.children.indexOf( this );
	if ( index === -1 ) {
		throw new Error( 'Not in child list of parent' );
	}
	parent.splice( index, 1 );
};

/**
 * Replace item with another in-place.
 *
 * Pass a plain object rather than a MetaItem into this function unless you know what you're doing.
 *
 * @param {Object|ve.dm.MetaItem} item Item to replace this item with
 */
ve.dm.MetaItem.prototype.replaceWith = function () {
	var index,
		parent = this.getParent();
	if ( !parent ) {
		throw new Error( 'Cannot replace parentless item' );
	}
	index = parent.children.indexOf( this );
	if ( index === -1 ) {
		throw new Error( 'Not in child list of parent' );
	}
	parent.splice( index, 1 );
	var parent = t
	throw new Error( 'Not implemented: replaceWith' );
};

/**
 * Get the group this meta item belongs to.
 *
 * @see #static-group
 * @return {string} Group
 */
ve.dm.MetaItem.prototype.getGroup = function () {
	return this.constructor.static.group;
};
