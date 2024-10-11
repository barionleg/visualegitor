/*!
 * VisualEditor ContentEditable PasteAnnotation class.
 *
 * @copyright See AUTHORS.txt
 */

/**
 * ContentEditable paste annotation.
 *
 * @class
 * @extends ve.ce.TextStyleAnnotation
 * @constructor
 * @param {ve.dm.PasteAnnotation} model Model to observe
 * @param {ve.ce.ContentBranchNode} [parentNode] Node rendering this annotation
 * @param {Object} [config] Configuration options
 */
ve.ce.PasteAnnotation = function VeCePasteAnnotation() {
	// Parent constructor
	ve.ce.PasteAnnotation.super.apply( this, arguments );

	// DOM changes
	this.$element.addClass( 've-ce-pasteAnnotation' );
};

/* Inheritance */

OO.inheritClass( ve.ce.PasteAnnotation, ve.ce.TextStyleAnnotation );

/* Static Properties */

ve.ce.PasteAnnotation.static.name = 'meta/paste';

ve.ce.PasteAnnotation.static.tagName = 'span';

/* Static Methods */

/* Registration */

ve.ce.annotationFactory.register( ve.ce.PasteAnnotation );
