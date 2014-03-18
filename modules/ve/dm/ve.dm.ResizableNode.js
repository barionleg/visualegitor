/*!
 * VisualEditor DataModel Resizable node.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * A mixin class for resizable nodes.
 *
 * @class
 * @abstract
 * @constructor
 */
ve.dm.ResizableNode = function VeDmResizableNode( config ) {
	config = config || {};
};

/**
 * Produce a scalable object based on the current object's
 * properties. This should be overriden in the specific instances
 * of resizable nodes; the basic operation assumes at least current
 * width and height.
 * @returns {ve.dm.Scalable} Scalable object
 */
ve.dm.ResizableNode.prototype.getScalable = function() {
	var width = this.getAttribute( 'width' ),
	height = this.getAttribute( 'height' );

	return new ve.dm.Scalable( {
		'currentDimensions': {
			'width': width,
			'height': height,
		}
	} );
};
