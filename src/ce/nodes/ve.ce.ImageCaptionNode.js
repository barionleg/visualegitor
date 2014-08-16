/*!
 * VisualEditor ContentEditable ListItemNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable image caption item node.
 *
 * @class
 * @extends ve.ce.BranchNode
 * @constructor
 * @param {ve.dm.ImageCaptionNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.ImageCaptionNode = function VeCeImageCaptionNode( model, config ) {
	// Parent constructor
	ve.ce.BranchNode.call( this, model, config );
};

/* Inheritance */

OO.inheritClass( ve.ce.ImageCaptionNode, ve.ce.BranchNode );

/* Static Properties */

ve.ce.ImageCaptionNode.static.name = 'imageCaption';

ve.ce.ImageCaptionNode.static.tagName = 'figcaption';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.ImageCaptionNode );
