/*!
 * VisualEditor DataModel Resizable node.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * A mixin class for resizable nodes. This class is mostly a base
 * interface for resizable nodes to be able to produce scalable
 * objects for further calculation.
 *
 * @class
 * @abstract
 * @constructor
 */
ve.dm.ResizableNode = function VeDmResizableNode( config ) {
	config = config || {};
};

/**
 * Produce a scalable object based on the current object's width
 * and height properties. This should be implemented in the
 * specific instances of resizable nodes; the basic operation
 * assumes at least current width and height.
 *
 * @returns {jQuery.Promise} Promise that resolves to a
 *  ve.dm.Scalable object
 */
ve.dm.ResizableNode.prototype.getScalable = function() {
	throw new Error( 've.dm.ResizableNode subclass must implement getScalable' );
};

/**
 * Produce a basic, non asynchronous scalable object based on the
 * current object's width and height properties.
 *
 * This should be implemented in the specific instances of
 * resizable nodes; the basic operation assumes at least current
 * width and height.
 *
 * @returns {ve.dm.Scalable}
 */
ve.dm.ResizableNode.prototype.getBasicScalable = function() {
	throw new Error( 've.dm.ResizableNode subclass must implement getBasicScalable' );
};

