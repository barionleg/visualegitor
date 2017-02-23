/*!
 * VisualEditor DataModel ImageNode class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel image node.
 *
 * @class
 * @abstract
 * @mixins ve.dm.FocusableNode
 * @mixins ve.dm.ResizableNode
 *
 * @constructor
 */
ve.dm.ImageNode = function VeDmImageNode() {
	// Mixin constructors
	ve.dm.FocusableNode.call( this );
	ve.dm.ResizableNode.call( this );
};

/* Inheritance */

OO.mixinClass( ve.dm.ImageNode, ve.dm.FocusableNode );

OO.mixinClass( ve.dm.ImageNode, ve.dm.ResizableNode );

/* Static Methods */

/**
 * @inheritdoc
 */
ve.dm.ImageNode.static.describeChanges = function ( attributeChanges ) {
	var key, descriptions = [];
	if ( 'width' in attributeChanges || 'height' in attributeChanges ) {
		descriptions.push(
			'Size changed from ' +
			attributeChanges.width.from + '×' + attributeChanges.height.from + ' to ' +
			attributeChanges.width.to + '×' + attributeChanges.height.to
		);
	}
	for ( key in attributeChanges ) {
		if ( key !== 'width' && key !== 'height' ) {
			descriptions.push( this.describeChange( key, attributeChanges[ key ] ) );
		}
	}
	return descriptions;
};

/* Methods */

/**
 * @inheritdoc
 */
ve.dm.ImageNode.prototype.createScalable = function () {
	return new ve.dm.Scalable( {
		currentDimensions: {
			width: this.getAttribute( 'width' ),
			height: this.getAttribute( 'height' )
		},
		minDimensions: {
			width: 1,
			height: 1
		}
	} );
};
