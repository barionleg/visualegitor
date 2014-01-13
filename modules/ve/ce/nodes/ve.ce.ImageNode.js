/*!
 * VisualEditor ContentEditable ImageNode class.
 *
 * @copyright 2011–2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable image node.
 *
 * @class
 * @extends ve.ce.LeafNode
 * @mixins ve.ce.FocusableNode
 * @mixins ve.ce.RelocatableNode
 * @mixins ve.ce.ResizableNode
 *
 * @constructor
 * @param {ve.dm.ImageNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.ImageNode = function VeCeImageNode( model, config ) {
	// Parent constructor
	ve.ce.LeafNode.call( this, model, config );

	// Mixin constructors
	ve.ce.FocusableNode.call( this );
	ve.ce.RelocatableNode.call( this );
	ve.ce.ResizableNode.call( this );

	// Properties
	this.$image = this.$element;

	// Events
	this.$element.on( 'click', ve.bind( this.onClick, this ) );
	this.model.connect( this, { 'attributeChange': 'onAttributeChange' } );

	// Initialization
	this.$image
		.addClass( 've-ce-imageNode' )
		.attr( {
			'alt': this.model.getAttribute( 'alt' ),
			'src': this.getResolvedAttribute( 'src' )
		} )
		.css( {
			'width': this.model.getAttribute( 'width' ),
			'height': this.model.getAttribute( 'height' )
		} );
};

/* Inheritance */

OO.inheritClass( ve.ce.ImageNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.ImageNode, ve.ce.FocusableNode );
OO.mixinClass( ve.ce.ImageNode, ve.ce.RelocatableNode );
OO.mixinClass( ve.ce.ImageNode, ve.ce.ResizableNode );

/* Static Properties */

ve.ce.ImageNode.static.name = 'image';

ve.ce.ImageNode.static.tagName = 'img';

/* Methods */

/**
 * Update the rendering of the 'src', 'width' and 'height' attributes when they change in the model.
 *
 * @method
 * @param {string} key Attribute key
 * @param {string} from Old value
 * @param {string} to New value
 */
ve.ce.ImageNode.prototype.onAttributeChange = function ( key, from, to ) {
	if ( from !== to ) {
		if ( key === 'src' ) {
			this.$image.attr( 'src', this.getResolvedAttribute( 'src' ) );
		}
		if ( key === 'width' || key === 'height' ) {
			this.$image.css( key, to );
		}
	}
};

/**
 * Handle the mouse click.
 *
 * @method
 * @param {jQuery.Event} e Click event
 */
ve.ce.ImageNode.prototype.onClick = function ( e ) {
	var surfaceModel = this.getRoot().getSurface().getModel(),
		selectionRange = surfaceModel.getSelection(),
		nodeRange = this.model.getOuterRange();

	surfaceModel.getFragment(
		e.shiftKey ?
			ve.Range.newCoveringRange(
				[ selectionRange, nodeRange ], selectionRange.from > nodeRange.from
			) :
			nodeRange
	).select();
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.ImageNode );
