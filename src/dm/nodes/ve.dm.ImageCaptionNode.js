/*!
 * VisualEditor DataModel ImageCaptionNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * DataModel image caption node.
 *
 * @class
 * @extends ve.dm.BranchNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 * @param {ve.dm.Node[]} [children]
 */
ve.dm.ImageCaptionNode = function VeDmImageCaptionNode() {
	// Parent constructor
	ve.dm.BranchNode.apply( this, arguments );
};

OO.inheritClass( ve.dm.ImageCaptionNode, ve.dm.BranchNode );

ve.dm.ImageCaptionNode.static.name = 'imageCaption';

ve.dm.ImageCaptionNode.static.matchTagNames = [];

ve.dm.ImageCaptionNode.static.parentNodeTypes = [ 'blockImage' ];

ve.dm.ImageCaptionNode.static.toDomElements = function ( dataElement, doc ) {
	return [ doc.createElement( 'figcaption' ) ];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.ImageCaptionNode );
