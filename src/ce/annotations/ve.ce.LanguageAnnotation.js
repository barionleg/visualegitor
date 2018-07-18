/*!
 * VisualEditor ContentEditable LanguageAnnotation class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable language annotation.
 *
 * @class
 * @extends ve.ce.Annotation
 * @mixins ve.ce.NailedAnnotation
 * @constructor
 * @param {ve.dm.LanguageAnnotation} model Model to observe
 * @param {ve.ce.ContentBranchNode} [parentNode] Node rendering this annotation
 * @param {Object} [config] Configuration options
 */
ve.ce.LanguageAnnotation = function VeCeLanguageAnnotation() {
	// Parent constructor
	ve.ce.LanguageAnnotation.super.apply( this, arguments );

	// Mixin constructor
	ve.ce.NailedAnnotation.call( this );

	// DOM changes
	this.$element
		.addClass( 've-ce-languageAnnotation' )
		.addClass( 've-ce-bidi-isolate' )
		.prop( {
			lang: this.model.getAttribute( 'lang' ) || undefined,
			dir: this.model.getAttribute( 'dir' ) || undefined,
			title: this.constructor.static.getDescription( this.model )
		} );
};

/* Inheritance */

OO.inheritClass( ve.ce.LanguageAnnotation, ve.ce.Annotation );

OO.mixinClass( ve.ce.LanguageAnnotation, ve.ce.NailedAnnotation );

/* Static Properties */

ve.ce.LanguageAnnotation.static.name = 'meta/language';

ve.ce.LanguageAnnotation.static.tagName = 'span';

/* Static Methods */

/**
 * @inheritdoc
 */
ve.ce.LanguageAnnotation.static.getDescription = function ( model ) {
	var lang = ( model.getAttribute( 'lang' ) || '' ).toLowerCase(),
		name = ve.init.platform.getLanguageName( lang ),
		dir = ( model.getAttribute( 'dir' ) || '' ).toUpperCase();

	if ( !dir || dir === ve.init.platform.getLanguageDirection( lang ).toUpperCase() ) {
		return ve.msg( 'visualeditor-languageannotation-description', name );
	}

	return ve.msg( 'visualeditor-languageannotation-description-with-dir', name, dir );
};

/* Registration */

ve.ce.annotationFactory.register( ve.ce.LanguageAnnotation );
