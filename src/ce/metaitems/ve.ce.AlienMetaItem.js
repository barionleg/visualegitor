/*!
 * VisualEditor ContentEditable AlienMetaItem class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable alien meta item node.
 *
 * @class
 * @extends ve.ce.MetaItem
 * @constructor
 * @param {ve.dm.AlienMetaItem} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.AlienMetaItem = function VeCeAlienMetaItem() {
	// Parent constructor
	ve.ce.AlienMetaItem.super.apply( this, arguments );

	// DOM changes
	this.$element
                .addClass( 've-ce-alienMetaItem' )
                .prop( 'contentEditable', 'false' )
		.append( ve.copyDomElements( this.model.getOriginalDomElements(
			this.model.getDocument().getStore() ),
			document
		) );

	// Mixin constructors
	ve.ce.FocusableNode.call( this, this.$element, {
		classes: [ 've-ce-alienMetaItem-highlights' ]
	} );
	ve.ce.TableCellableNode.call( this );
};

/* Inheritance */

OO.inheritClass( ve.ce.AlienMetaItem, ve.ce.MetaItem );
OO.mixinClass( ve.ce.AlienMetaItem, ve.ce.FocusableNode );
OO.mixinClass( ve.ce.AlienMetaItem, ve.ce.TableCellableNode );

/* Static Properties */

ve.ce.AlienMetaItem.static.name = 'alienMeta';

ve.ce.AlienMetaItem.static.iconWhenInvisible = 'puzzle';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.AlienMetaItem );
