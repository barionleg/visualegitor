/*!
 * VisualEditor ContentEditable CommentNode class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable comment node.
 *
 * @class
 * @extends ve.ce.LeafNode
 * @mixins ve.ce.FocusableNode
 *
 * @constructor
 * @param {ve.dm.CommentNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.CommentNode = function VeCeCommentNode( model, config ) {
	// Parent constructor
	ve.ce.CommentNode.super.call( this, model, config );

	// Mixin constructors
	ve.ce.FocusableNode.call( this, this.$element, config );

	this.$element.data( 'view', this );

	// Events
	this.connect( this, { setup: 'onSetup' } );
	this.model.connect( this, { attributeChange: 'onAttributeChange' } );

	// DOM changes
	this.$text = $( '<span>' ).addClass( 've-ce-commentNode-text' );
	this.$element.append( this.$text );
	this.$element.addClass( 've-ce-commentNode' );
};

/* Inheritance */

OO.inheritClass( ve.ce.CommentNode, ve.ce.LeafNode );
OO.mixinClass( ve.ce.CommentNode, ve.ce.FocusableNode );

/* Static Properties */

ve.ce.CommentNode.static.name = 'comment';

ve.ce.CommentNode.static.primaryCommandName = 'comment';

ve.ce.CommentNode.static.iconWhenInvisible = 'notice';

ve.ce.CommentNode.static.maxCommentLength = 20;

/* Static Methods */

/**
 * @inheritdoc
 */
ve.ce.CommentNode.static.getDescription = function ( model ) {
	return model.getAttribute( 'text' );
};

/**
 * @inheritdoc ve.ce.FocusableNode
 */
// ve.ce.CommentNode.prototype.hasRendering = function () {
// 	return false;
// };

/**
 * Update the rendering of the 'text' attribute
 * when it changes in the model.
 *
 * @method
 * @param {string} key Attribute key
 * @param {string} from Old value
 * @param {string} to New value
 */
ve.ce.CommentNode.prototype.onAttributeChange = function ( key, from, to ) {
	switch ( key ) {
		case 'text':
			this.updateText( to );
			break;
	}
};

/**
 * Handle node setup.
 *
 * @method
 */
ve.ce.CommentNode.prototype.onSetup = function ( ) {
	this.updateText( this.model.getAttribute( 'text' ) );
};

ve.ce.CommentNode.prototype.updateText = function ( text ) {
	// The text preview is a trimmed down version of the actual comment. This
	// means that we strip whitespace, replace newlines, and truncate to a
	// fairly short length. The goal is to provide a fair representation of
	// typical short comments, and enough context for long comments that the
	// user can tell whether they want to see the full view by focusing the
	// node / hovering.
	text = text.trim().replace( /\n+/, ' ' );
	if ( text.length > this.constructor.static.maxCommentLength ) {
		text = ve.graphemeSafeSubstring( text, 0, this.constructor.static.maxCommentLength ) + '...';
	}
	this.$text.text( text );
	this.$text.toggle( text.length > 0 );
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.CommentNode );
