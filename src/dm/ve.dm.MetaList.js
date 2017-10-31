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
 * @param {ve.dm.Surface} surface Surface model
 */
ve.dm.MetaList = function VeDmMetaList( surface ) {
	// Mixin constructors
	OO.EventEmitter.call( this );

	this.surface = surface;
	this.document = surface.getDocument();

	// Sorted array of attached ve.dm.MetaItem nodes in document order
	this.items = [];

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
 *
 * @param {ve.dm.Node} node The node that was attached
 */
ve.dm.MetaList.prototype.onNodeAttached = function ( node ) {
	var i,
		offsetPath = node.getOffsetPath();
	if ( node instanceof ve.dm.MetaItem ) {
		i = OO.binarySearch( this.items, function searchFunc( other ) {
			return ve.compareTuples( offsetPath, other.getOffsetPath() );
		}, true );
		this.items.splice( i, 0, node );
		this.emit( 'insert', node );
	}
};

/**
 * If a ve.dm.MetaItem was detached, remove it from items
 *
 * @param {ve.dm.Node} node The node that was detached
 */
ve.dm.MetaList.prototype.onNodeDetached = function ( node ) {
	var i;
	if ( node instanceof ve.dm.MetaItem ) {
		i = this.items.indexOf( node );
		if ( i !== -1 ) {
			this.items.splice( i, 1 );
			this.emit( 'remove', node );
		}
	}
};

ve.dm.MetaList.prototype.indexOf = function ( item, group, forInsertion ) {
	var items = group ? this.getItemsInGroup( group ) : this.items;
	return items.indexOf( item );
};

/**
 * Get all items in a group.
 *
 * This function returns a shallow copy, so the array isn't returned by reference but the items
 * themselves are.
 *
 * @param {string} group Group
 * @return {ve.dm.MetaItem[]} Array of items in the group (shallow copy)
 */
ve.dm.MetaList.prototype.getItemsInGroup = function ( group ) {
	return this.items.filter( function ( item ) { return item.getGroup() === group; } );
};

/**
 * Get all items in the list.
 *
 * This function returns a shallow copy, so the array isn't returned by reference but the items
 * themselves are.
 *
 * @return {ve.dm.MetaItem[]} Array of items in the list
 */
ve.dm.MetaList.prototype.getAllItems = function () {
	return this.items.slice();
};

/**
 * Insert new metadata into the document. This builds and processes a transaction that inserts
 * metadata into the document.
 *
 * Pass a plain object rather than a MetaItem into this function unless you know what you're doing.
 *
 * @param {Object|ve.dm.MetaItem} meta Metadata element (or MetaItem) to insert
 */
ve.dm.MetaList.prototype.insertMeta = function ( meta ) {
	var closeMeta, offset, tx;
	if ( arguments[ 1 ] !== undefined ) {
		throw new Error( 'Old "offset" argument is no longer supported' );
	}
	if ( meta instanceof ve.dm.MetaItem ) {
		meta = meta.getElement();
	}
	closeMeta = { type: '/' + meta.type };
	offset = this.document.getInternalList().getListNode().getOuterRange().start;
	tx = ve.dm.TransactionBuilder.static.newFromInsertion( this.document, offset, [ meta, closeMeta ] );
	this.surface.change( tx );
};
