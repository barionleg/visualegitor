/*!
 * VisualEditor ContentEditable FilePlaceholderNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable file placeholder node.
 *
 * @class
 * @extends ve.ce.LeafNode
 * @mixins ve.ce.FocusableNode
 *
 * @constructor
 * @param {ve.dm.FilePlaceholderNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.FilePlaceholderNode = function VeCeFilePlaceholderNode( model, config ) {
	// Parent constructor
	ve.ce.LeafNode.call( this, model, config );

	// Mixin constructors
	ve.ce.FocusableNode.call( this );

	// DOM changes
	this.$element.addClass( 've-ce-filePlaceholderNode' );
};

/* Inheritance */

OO.inheritClass( ve.ce.FilePlaceholderNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.FilePlaceholderNode, ve.ce.FocusableNode );

/* Static Properties */

ve.ce.FilePlaceholderNode.static.name = 'filePlaceholder';

ve.ce.FilePlaceholderNode.static.tagName = 'span';

/* Static Methods */

/**
 * @inheritdoc
 */
ve.ce.FilePlaceholderNode.static.getDescription = function ( model ) {
	return model.getAttribute( 'name' );
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.FilePlaceholderNode );
