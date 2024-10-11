/*!
 * VisualEditor DataModel PasteAnnotation class.
 *
 * @copyright See AUTHORS.txt
 */

/**
 * DataModel paste annotation.
 *
 * @class
 * @extends ve.dm.TextStyleAnnotation
 * @constructor
 * @param {Object} element
 */
ve.dm.PasteAnnotation = function VeDmPasteAnnotation() {
	// Parent constructor
	ve.dm.PasteAnnotation.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.PasteAnnotation, ve.dm.TextStyleAnnotation );

/* Static Properties */

ve.dm.PasteAnnotation.static.name = 'meta/paste';

ve.dm.PasteAnnotation.static.matchTagNames = [];

ve.dm.PasteAnnotation.static.applyToInsertedContent = false;

ve.dm.PasteAnnotation.static.toDomElements = function ( dataElement ) {
	return [];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.PasteAnnotation );
