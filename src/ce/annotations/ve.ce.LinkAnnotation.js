/*!
 * VisualEditor ContentEditable LinkAnnotation class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable link annotation.
 *
 * @class
 * @extends ve.ce.Annotation
 * @constructor
 * @param {ve.dm.LinkAnnotation} model Model to observe
 * @param {ve.ce.ContentBranchNode} [parentNode] Node rendering this annotation
 * @param {Object} [config] Configuration options
 */
ve.ce.LinkAnnotation = function VeCeLinkAnnotation() {
	// Parent constructor
	ve.ce.LinkAnnotation.super.apply( this, arguments );

	// Initialization
	this.contentTextNode = document.createTextNode( '' );
	this.contentTextNode.containerParent = this.$element[0].parentNode;

	this.$anchor = $( '<a>' )
		.prop( {
			href: ve.resolveUrl( this.model.getHref(), this.getModelHtmlDocument() ),
			title: this.constructor.static.getDescription( this.model )
		} )
		.append( this.constructor.static.makePostNail() )
		.append( this.contentTextNode )
		.append( this.constructor.static.makePreNail() );

	this.$element
		.addClass( 've-ce-linkAnnotation' )
		.append( this.constructor.static.makePreNail() )
		.append( this.$anchor )
		.append( this.constructor.static.makePostNail() );
};

/* Inheritance */

OO.inheritClass( ve.ce.LinkAnnotation, ve.ce.Annotation );

/* Static Properties */

ve.ce.LinkAnnotation.static.name = 'link';

ve.ce.LinkAnnotation.static.tagName = 'span';

ve.ce.LinkAnnotation.static.forceContinuation = false;

/* Static Methods */

/**
 * @inheritdoc
 */
ve.ce.LinkAnnotation.static.getDescription = function ( model ) {
	return model.getHref();
};

ve.ce.LinkAnnotation.static.makePreNail = function () {
	return $( '<img>' )
		.prop( 'src', ve.ce.chimeraImgDataUri )
		.addClass( 've-ce-pre-nail' )
		.get( 0 );
};

ve.ce.LinkAnnotation.static.makePostNail = function () {
	return $( '<img>' )
		.prop( 'src', ve.ce.chimeraImgDataUri )
		.addClass( 've-ce-post-nail' )
		.get( 0 );
};

/* Methods */

ve.ce.LinkAnnotation.prototype.getContentNode = function () {
	return this.contentTextNode;
};

/* Registration */

ve.ce.annotationFactory.register( ve.ce.LinkAnnotation );
