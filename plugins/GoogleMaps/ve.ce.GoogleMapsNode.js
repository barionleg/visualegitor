/*!
 * VisualEditor ContentEditable GoogleMaps class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable paragraph node.
 *
 * @class
 * @extends ve.ce.LeafNode
 * @mixins ve.ce.FocusableNode
 * @mixins ve.ce.ResizableNode
 * @mixins ve.ce.AlignableNode
 *
 * @constructor
 * @param {ve.dm.GoogleMapsNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.GoogleMapsNode = function VeCeGoogleMaps( model, config ) {
	config = config || {};

	// Parent constructor
	ve.ce.GoogleMapsNode.super.apply( this, arguments );

	// Mixin constructors
	ve.ce.FocusableNode.call( this, this.$element, config );
	ve.ce.ResizableNode.call( this, this.$element, config );
	ve.ce.AlignableNode.call( this, this.$element, config );

	this.$imageLoader = null;

	// Events
	this.model.connect( this, { attributeChange: 'onAttributeChange' } );

	// DOM changes
	this.$element
		.empty()
		.addClass( 've-ce-googleMapsNode' )
		.css( {
			width: this.model.getAttribute( 'width' ),
			height: this.model.getAttribute( 'height' )
		} );
	this.render();
};

/* Inheritance */

OO.inheritClass( ve.ce.GoogleMapsNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.GoogleMapsNode, ve.ce.FocusableNode );

OO.mixinClass( ve.ce.GoogleMapsNode, ve.ce.ResizableNode );

// Mixin Alignable's parent class
OO.mixinClass( ve.ce.GoogleMapsNode, ve.ce.ClassAttributeNode );

OO.mixinClass( ve.ce.GoogleMapsNode, ve.ce.AlignableNode );

/* Static Properties */

ve.ce.GoogleMapsNode.static.name = 'googleMaps';

ve.ce.GoogleMapsNode.static.tagName = 'div';

ve.ce.GoogleMapsNode.static.sizePattern = /size=[0-9]+x[0-9]+/;

/* Methods */

/**
 * Update the rendering of the 'align', src', 'width' and 'height' attributes
 * when they change in the model.
 *
 * @method
 * @param {string} key Attribute key
 * @param {string} from Old value
 * @param {string} to New value
 */
ve.ce.GoogleMapsNode.prototype.onAttributeChange = function ( /*key, from, to */ ) {
	// switch ( key ) {
	// 	case 'width':
	// 	case 'height':
	// 	case 'mapType':
	// 		break;
	// }
	this.render();
};

ve.ce.GoogleMapsNode.prototype.render = function ( attributes ) {
	var url, node = this,
		element = ve.copy( this.model.element );

	if ( this.$imageLoader ) {
		this.$imageLoader.off();
		this.$imageLoader = null;
	}

	element.attributes = ve.extendObject( element.attributes, attributes );
	url = this.model.constructor.static.getUrl( element );

	this.$imageLoader = this.$( '<img>' ).on( 'load', function () {
		node.$element.css( 'backgroundImage', 'url(' + url + ')' );
	} ).attr( 'src', url );
};

ve.ce.GoogleMapsNode.prototype.onResizableResizing = function () {
	ve.ce.ResizableNode.prototype.onResizableResizing.apply( this, arguments );
	this.render( { width: 640, height: 640 } );
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.GoogleMapsNode );
