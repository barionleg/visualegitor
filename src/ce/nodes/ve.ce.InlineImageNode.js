/*!
 * VisualEditor ContentEditable InlineImageNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable inline image node.
 *
 * @class
 * @extends ve.ce.LeafNode
 * @mixins ve.ce.ImageNode
 * @mixins ve.ce.ResizableNode
 *
 * @constructor
 * @param {ve.dm.InlineImageNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.InlineImageNode = function VeCeImageNode( model, config ) {
	config = ve.extendObject( {
		minDimensions: { width: 1, height: 1 }
	}, config );

	// Parent constructor
	ve.ce.LeafNode.call( this, model, config );

	// Mixin constructors
	ve.ce.ImageNode.call( this, this.$element, this.$element, config );

	// Initialization
	this.$element
		.addClass( 've-ce-inlineImageNode' )
		.attr( {
			alt: this.model.getAttribute( 'alt' ),
			src: this.getResolvedAttribute( 'src' )
		} )
		.css( {
			width: this.model.getAttribute( 'width' ),
			height: this.model.getAttribute( 'height' )
		} );
};

/* Inheritance */

OO.inheritClass( ve.ce.InlineImageNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.InlineImageNode, ve.ce.ImageNode );

/* Static Properties */

ve.ce.InlineImageNode.static.name = 'inlineImage';

ve.ce.InlineImageNode.static.tagName = 'img';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.InlineImageNode );
