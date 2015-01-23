/*!
 * VisualEditor DataModel GoogleMaps class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel Google Maps node.
 *
 * @class
 * @extends ve.dm.LeafNode
 * @mixins ve.dm.FocusableNode
 * @mixins ve.dm.ResizableNode
 * @mixins ve.dm.AlignableNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 * @param {ve.dm.Node[]} [children]
 */
ve.dm.GoogleMapsNode = function VeDmGoogleMaps() {
	// Parent constructor
	ve.dm.GoogleMapsNode.super.apply( this, arguments );

	// Mixin constructors
	ve.dm.FocusableNode.call( this );
	ve.dm.ResizableNode.call( this );
	ve.dm.AlignableNode.call( this );
};

/* Inheritance */

OO.inheritClass( ve.dm.GoogleMapsNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.GoogleMapsNode, ve.dm.FocusableNode );

OO.mixinClass( ve.dm.GoogleMapsNode, ve.dm.ResizableNode );

// Mixin Alignable's parent class
OO.mixinClass( ve.dm.GoogleMapsNode, ve.dm.ClassAttributeNode );

OO.mixinClass( ve.dm.GoogleMapsNode, ve.dm.AlignableNode );

/* Static Properties */

ve.dm.GoogleMapsNode.static.name = 'googleMaps';

ve.dm.GoogleMapsNode.static.matchTagNames = [ 'div' ];

ve.dm.GoogleMapsNode.static.matchRdfaTypes = [ 've:GoogleMaps' ];

ve.dm.GoogleMapsNode.static.urlPattern = /^(https?:)?\/\/maps.googleapis.com/i;

ve.dm.GoogleMapsNode.static.matchFunction = function ( domElement ) {
	return domElement.children[ 0 ].getAttribute( 'src' ).match( this.urlPattern );
};

ve.dm.GoogleMapsNode.static.toDataElement = function ( domElements ) {
	var base, sizes, coords, attributes,
		params = {},
		parser = document.createElement( 'a' ),
		classAttr = domElements[ 0 ].getAttribute( 'class' );

	parser.href = domElements[ 0 ].children[ 0 ].getAttribute( 'src' );
	base = parser.protocol + '//' + parser.host + parser.pathname;

	parser.search.slice( 1 ).split( '&' ).map( function ( keyVal ) {
		var parts = keyVal.split( '=' );
		params[ decodeURIComponent( parts[ 0 ] ) ] =
			decodeURIComponent( parts[ 1 ] );
	} );

	sizes = params.size.split( 'x' );
	coords = params.center.split( ',' );

	attributes = {
		base: base,
		originalParams: params,
		width: +sizes[ 0 ],
		height: +sizes[ 1 ],
		latitude: +coords[ 0 ],
		longitude: +coords[ 1 ],
		zoom: +params.zoom,
		mapType: params.maptype || 'roadmap'
	};

	this.setClassAttributes( attributes, classAttr );

	return {
		type: this.name,
		attributes: attributes
	};
};

ve.dm.GoogleMapsNode.static.toDomElements = function ( dataElement, doc ) {
	var div = doc.createElement( 'div' ),
		img = doc.createElement( 'img' ),
		classAttr = this.getClassAttrFromAttributes( dataElement.attributes );

	div.setAttribute( 'rel', 've:GoogleMaps' );
	div.appendChild( img );
	if ( classAttr ) {
		div.className = classAttr;
	}
	img.setAttribute( 'src', this.getUrl( dataElement ) );
	img.setAttribute( 'width', dataElement.attributes.width );
	img.setAttribute( 'height', dataElement.attributes.height );

	return [ div ];
};

ve.dm.GoogleMapsNode.static.getUrl = function ( dataElement ) {
	return dataElement.attributes.base + '?' +
		$.param(
			ve.extendObject( dataElement.attributes.originalParams, {
				center: dataElement.attributes.latitude + ',' + dataElement.attributes.longitude,
				size: dataElement.attributes.width + 'x' + dataElement.attributes.height,
				maptype: dataElement.attributes.mapType,
				zoom: dataElement.attributes.zoom
			} )
		);
};

/* Methods */

ve.dm.GoogleMapsNode.prototype.getUrl = function () {
	return this.constructor.static.getUrl( this.element );
};

ve.dm.GoogleMapsNode.static.createScalable = function ( width, height ) {
	return new ve.dm.Scalable( {
		fixedRatio: false,
		currentDimensions: {
			width: width,
			height: height
		},
		minDimensions: {
			width: 10,
			height: 10
		},
		maxDimensions: {
			width: 640,
			height: 640
		}
	} );
};

/**
 * @inheritdoc
 */
ve.dm.GoogleMapsNode.prototype.createScalable = function () {
	return this.constructor.static.createScalable( this.getAttribute( 'width' ), this.getAttribute( 'height' ) );
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.GoogleMapsNode );
