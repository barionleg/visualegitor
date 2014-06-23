/*!
 * VisualEditor DataModel TextStyleAnnotation class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * DataModel text style annotation.
 *
 * @class
 * @abstract
 * @extends ve.dm.Annotation
 * @constructor
 * @param {Object} element
 */
ve.dm.TextStyleAnnotation = function VeDmTextStyleAnnotation( element ) {
	// Parent constructor
	ve.dm.Annotation.call( this, element );
};

/* Inheritance */

OO.inheritClass( ve.dm.TextStyleAnnotation, ve.dm.Annotation );

/* Static Properties */

ve.dm.TextStyleAnnotation.static.name = 'textStyle';

ve.dm.TextStyleAnnotation.static.matchTagNames = [];

ve.dm.TextStyleAnnotation.static.toDataElement = function ( domElements ) {
	return {
		'type': this.name,
		'attributes': {
			'nodeName': domElements[0].nodeName.toLowerCase()
		}
	};
};

ve.dm.TextStyleAnnotation.static.toDomElements = function ( dataElement, doc ) {
	var nodeName = ve.getProp( dataElement, 'attributes', 'nodeName' );

	return [ doc.createElement( nodeName || this.matchTagNames[0] ) ];
};

/* Methods */

/**
 * @returns {Object}
 */
ve.dm.TextStyleAnnotation.prototype.getComparableObject = function () {
	return { 'type': this.getType() };
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.TextStyleAnnotation );
