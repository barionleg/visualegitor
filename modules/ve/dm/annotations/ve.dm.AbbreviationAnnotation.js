/*!
* VisualEditor DataModel AbbreviationAnnotation class.
*
* @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
* @license The MIT License (MIT); see LICENSE.txt
*/

/**
 * DataModel abbreviation annotation.
 *
 * Represents `<abbr>` tags.
 *
 * @class
 * @extends ve.dm.TextStyleAnnotation
 * @constructor
 * @param {Object} element
 */
ve.dm.AbbreviationAnnotation = function VeDmAbbreviationAnnotation( element ) {
	// Parent constructor
	ve.dm.TextStyleAnnotation.call( this, element );
};

/* Inheritance */

OO.inheritClass( ve.dm.AbbreviationAnnotation, ve.dm.TextStyleAnnotation );

/* Static Properties */

ve.dm.AbbreviationAnnotation.static.name = 'textStyle/abbreviation';

ve.dm.AbbreviationAnnotation.static.matchTagNames = [ 'abbr' ];

/* Registration */

ve.dm.modelRegistry.register( ve.dm.AbbreviationAnnotation );
