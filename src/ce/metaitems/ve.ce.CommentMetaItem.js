/*!
 * VisualEditor ContentEditable CommentMetaItem class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable comment meta item node.
 *
 * @class
 * @extends ve.ce.MetaItem
 * @constructor
 * @param {ve.dm.CommentMetaItem} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.CommentMetaItem = function VeCeCommentMetaItem() {
	// Parent constructor
	ve.ce.CommentMetaItem.super.apply( this, arguments );

	// DOM changes
	this.$element
                .addClass( 've-ce-commentMetaItem' )
                .prop( 'contentEditable', 'false' )
		.append( ve.copyDomElements( this.model.getOriginalDomElements(
			this.model.getDocument().getStore() ),
			document
		) );

	// Mixin constructors
	ve.ce.FocusableNode.call( this, this.$element, {
		classes: [ 've-ce-commentMetaItem-highlights' ]
	} );
	ve.ce.TableCellableNode.call( this );
};

/* Inheritance */

OO.inheritClass( ve.ce.CommentMetaItem, ve.ce.MetaItem );
OO.mixinClass( ve.ce.CommentMetaItem, ve.ce.FocusableNode );
OO.mixinClass( ve.ce.CommentMetaItem, ve.ce.TableCellableNode );

/* Static Properties */

ve.ce.CommentMetaItem.static.name = 'commentMeta';

ve.ce.CommentMetaItem.static.iconWhenInvisible = 'puzzle';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.CommentMetaItem );
