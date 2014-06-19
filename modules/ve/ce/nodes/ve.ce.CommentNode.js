/*!
* VisualEditor ContentEditable CommentNode class.
*
* @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
* @license The MIT License (MIT); see LICENSE.txt
*/

/**
* ContentEditable comment node.
*
* @class
* @extends ve.ce.LeafNode
* @mixins ve.ce.FocusableNode
*
* @constructor
* @param {ve.dm.CommentMetaItem} model Model to observe
* @param {Object} [config] Configuration options
*/
ve.ce.CommentNode = function VeCeCommentNode( model, config ) {
	// Parent constructor
	ve.ce.LeafNode.call( this, model, config );

	// DOM changes
	this.$element
		.addClass( 've-ce-commentNode' )
		.append(
			this.$( '<p>' )
			.text ( $model.dataElement.attributes.text )
			.addClass( 've-ce-commentNode-paragraph' )
		);
};

/* Inheritance */

OO.inheritClass( ve.ce.CommentNode, ve.ce.LeafNode );

/* Static Properties */

ve.ce.MWHieroNode.static.name = 'comment';

ve.ce.MWHieroNode.static.tagName = 'div';

ve.ce.MWHieroNode.static.primaryCommandName = 'comment';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.CommentNode );
