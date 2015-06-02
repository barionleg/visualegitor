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
	this.contentFragment = document.createDocumentFragment();

	this.$anchor = $( '<a>' )
		.prop( {
			href: ve.resolveUrl( this.model.getHref(), this.getModelHtmlDocument() ),
			title: this.constructor.static.getDescription( this.model )
		} );

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
		.addClass( 've-ce-nail' )
		.addClass( 've-ce-pre-nail' )
		.get( 0 );
};

ve.ce.LinkAnnotation.static.makePostNail = function () {
	return $( '<img>' )
		.prop( 'src', ve.ce.chimeraImgDataUri )
		.addClass( 've-ce-nail' )
		.addClass( 've-ce-post-nail' )
		.get( 0 );
};

/* Methods */

ve.ce.LinkAnnotation.prototype.getContentContainer = function () {
	return this.contentFragment;
};

/**
 * Attach contents to the annotation as descendent nodes, if not already attached
 */
ve.ce.LinkAnnotation.prototype.attachContents = function () {
	this.$anchor
		.append( this.constructor.static.makePostNail() )
		.append( this.contentFragment )
		.append( this.constructor.static.makePreNail() );
};

/* Registration */

ve.ce.annotationFactory.register( ve.ce.LinkAnnotation );
