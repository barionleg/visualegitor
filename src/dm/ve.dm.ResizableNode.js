/*!
 * VisualEditor DataModel Resizable node.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
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
ve.dm.ResizableNode = function VeDmResizableNode() {
	this.scalable = null;

	this.connect( this, { attributeChange: 'onResizableAttributeChange' } );
};

/* Inheritance */

OO.initClass( ve.dm.ResizableNode );

/**
 * Get a scalable object for this node.
 *
 * #createScalable is called if one doesn't already exist.
 *
 * @returns {ve.dm.Scalable} Scalable object
 */
ve.dm.ResizableNode.prototype.getScalable = function () {
	if ( !this.scalable ) {
		this.scalable = this.createScalable();
	}
	return this.scalable;
};

/**
 * Create a scalable object based on the current object's width and height.
 *
 * @abstract
 * @method
 * @returns {ve.dm.Scalable} Scalable object
 */
ve.dm.ResizableNode.prototype.createScalable = null;

/**
 * Handle attribute change events from the model.
 *
 * @method
 * @param {string} key Attribute key
 * @param {string} from Old value
 * @param {string} to New value
 */
ve.dm.ResizableNode.prototype.onResizableAttributeChange = function ( key ) {
	if ( key === 'width' || key === 'height' ) {
		this.getScalable().setCurrentDimensions( {
			width: this.getAttribute( 'width' ),
			height: this.getAttribute( 'height' )
		} );
	}
};
