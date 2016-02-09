/*!
 * VisualEditor ContentEditable LinkAnnotation class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
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
		.addClass( 've-ce-linkAnnotation' )
		.prop( {
			href: ve.resolveUrl( this.model.getHref(), this.getModelHtmlDocument() ),
			title: this.constructor.static.getDescription( this.model )
		} )
		.data( 'view', this );
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

/**
 * Create a nail (a zero-width image) to add extra cursor positions around links
 *
 * @param {string} type Nail type, one of 'pre-open', 'pre-close', 'post-open' and 'post-close'
 * @return {HTMLElement} The new nail
 */
ve.ce.LinkAnnotation.static.makeNail = function ( type ) {
	var nail = document.createElement( 'img' );
	nail.src = ve.inputDebug ? ve.ce.nailImgDataUri : ve.ce.minImgDataUri;
	// The following classes can be used here:
	// ve-ce-nail-pre-open
	// ve-ce-nail-pre-close
	// ve-ce-nail-post-open
	// ve-ce-nail-post-close
	nail.className = 've-ce-nail ve-ce-nail-' + type + ( ve.inputDebug ? ' ve-ce-nail-debug' : '' );
	return nail;
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ce.LinkAnnotation.prototype.getContentContainer = function () {
	return this.contentFragment;
};

/**
 * Attach contents to the annotation as descendent nodes, if not already attached
 */
ve.ce.LinkAnnotation.prototype.attachContents = function () {
	this.$anchor[ 0 ]
		.appendChild( this.constructor.static.makeNail( 'post-open' ) )
		.appendChild( this.contentFragment )
		.appendChild( this.constructor.static.makeNail( 'pre-close' ) );
};

/**
 * @param {Node} node Parent node
 */
ve.ce.LinkAnnotation.prototype.appendTo = function ( node ) {
	node.appendChild( this.constructor.static.makeNail( 'pre-open' ) );
	node.appendChild( this.$anchor[ 0 ] );
	node.appendChild( this.constructor.static.makeNail( 'post-close' ) );
};

/* Registration */

ve.ce.annotationFactory.register( ve.ce.LinkAnnotation );
