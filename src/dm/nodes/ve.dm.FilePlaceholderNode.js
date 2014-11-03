/*!
 * VisualEditor DataModel FilePlaceholderNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel file placeholder node.
 *
 * @class
 * @extends ve.dm.LeafNode
 * @mixins ve.dm.FocusableNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.FilePlaceholderNode = function VeDmFilePlaceholderNode() {
	// Parent constructor
	ve.dm.LeafNode.apply( this, arguments );

	// Mixin constructors
	ve.dm.FocusableNode.call( this );
};

/* Inheritance */

OO.inheritClass( ve.dm.FilePlaceholderNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.FilePlaceholderNode, ve.dm.FocusableNode );

/* Static Properties */

ve.dm.FilePlaceholderNode.static.name = 'filePlaceholder';

ve.dm.FilePlaceholderNode.static.isContent = true;

/* Static Methods */

ve.dm.FilePlaceholderNode.static.toDomElements = function () {
	return [];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.FilePlaceholderNode );
