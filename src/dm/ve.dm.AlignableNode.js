/*!
 * VisualEditor DataModel Alignable node.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * A mixin class for Alignable nodes.
 *
 * @class
 * @abstract
 * @constructor
 */
ve.dm.AlignableNode = function VeDmAlignableNode() {
};

/* Inheritance */

OO.initClass( ve.dm.AlignableNode );

ve.dm.AlignableNode.static.toDataElementAttributes = function ( domElements ) {
	var matches = domElements[0].className.match( /ve-align-([A-Za-z]+)/ );

	if ( matches ) {
		return {
			align: matches[1],
			originalAlign: matches[1]
		};
	} else {
		return {};
	}
};

ve.dm.AlignableNode.static.toDomElementAttributes = function ( domElement, dataElement ) {
	if ( dataElement.attributes.align !== dataElement.attributes.originalAlign ) {
		if ( dataElement.attributes.originalAlign ) {
			$( domElement ).removeClass( 've-align-' + dataElement.attributes.originalAlign );
		}
		if ( dataElement.attributes.align ) {
			$( domElement ).addClass( 've-align-' + dataElement.attributes.align );
		}
	}
};
