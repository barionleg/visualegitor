/*!
 * VisualEditor DataModel MetaList class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel meta item.
 *
 * @class
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {ve.dm.Document} document Document model
 */
ve.dm.MetaList = function VeDmMetaList( document ) {
	// Mixin constructors
	OO.EventEmitter.call( this );

	this.document = document;

	// Sorted array of attached ve.dm.MetaItem nodes in document order
	this.items = [];
	*** TODO: group-related stuff ***

	this.document.connect( this, {
		nodeAttached: 'onNodeAttached',
		nodeDetached: 'onNodeDetached'
	} );
};

/* Inheritance */

OO.mixinClass( ve.dm.MetaList, OO.EventEmitter );

/* Events */

/**
 * @event insert
 * @param {ve.dm.MetaItem} item Item that was inserted
 */

/**
 * @event remove
 * @param {ve.dm.MetaItem} item Item that was removed
 */

/* Methods */

/**
 * If a ve.dm.MetaItem was attached, insert it into items in document order
 */
ve.dm.MetaList.prototype.onNodeAttached = function ( node ) {
	var i,
		offsetPath = node.getOffsetPath();
	if ( node instanceof ve.dm.MetaItem ) {
		i = OO.binarySearch( this.items, function searchFunc( other ) {
			return ve.compareTuples(
			offsetPath,
			other.getOffsetPath()
		}, true );
		this.items.splice( i, 0, node );
		*** TODO: emit an event ***
	}
};

/**
 * If a ve.dm.MetaItem was detached, remove it from items
 */
ve.dm.MetaList.prototype.onNodeDetached = function ( node ) {
	var i;
	if ( node instanceof ve.dm.MetaItem ) {
		i = this.items.indexOf( node );
		if ( i !== -1 ) {
			this.items.splice( i, 1 );
			*** TODO: emit an event ***
		}
	}
};
