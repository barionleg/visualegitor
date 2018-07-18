/*!
 * VisualEditor ContentEditable CommentAnnotation class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable comment annotation.
 *
 * @class
 * @extends ve.ce.Annotation
 * @mixins ve.ce.NailedAnnotation
 * @constructor
 * @param {ve.dm.CommentAnnotation} model Model to observe
 * @param {ve.ce.ContentBranchNode} [parentNode] Node rendering this annotation
 * @param {Object} [config] Configuration options
 */
ve.ce.CommentAnnotation = function VeCeCommentAnnotation() {
	// Parent constructor
	ve.ce.CommentAnnotation.super.apply( this, arguments );

	// Mixin constructor
	ve.ce.NailedAnnotation.call( this );

	// DOM changes
	this.$element.addClass( 've-ce-commentAnnotation' );
};

/* Inheritance */

OO.inheritClass( ve.ce.CommentAnnotation, ve.ce.Annotation );

OO.mixinClass( ve.ce.CommentAnnotation, ve.ce.NailedAnnotation );

/* Static Properties */

ve.ce.CommentAnnotation.static.name = 'commentAnnotation';

ve.ce.CommentAnnotation.static.tagName = 'span';

/* Static Methods */

/**
 * @inheritdoc
 */
ve.ce.CommentAnnotation.static.getDescription = function ( model ) {
	return model.getAttribute( 'text' );
};

/* Registration */

ve.ce.annotationFactory.register( ve.ce.CommentAnnotation );
