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

	// Events
	this.model.connect( this, { attributeChange: 'onAttributeChange' } );

	// DOM changes
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

ve.ce.CommentNode.static.getTextPreview = function ( text ) {
	// The text preview is a trimmed down version of the actual comment. This
	// means that we strip whitespace, replace newlines, and truncate to a
	// fairly short length. The goal is to provide a fair representation of
	// typical short comments, and enough context for long comments that the
	// user can tell whether they want to see the full view by focusing the
	// node / hovering.
	text = text.trim().replace( /\n+/, ' ' );
	if ( text.length > this.maxCommentLength ) {
		text = ve.graphemeSafeSubstring( text, 0, this.maxCommentLength ) + '...';
	}
	return text;
};

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
			this.icon.setLabel( this.constructor.static.getTextPreview( to ) );
			break;
	}
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ce.CommentNode.prototype.createInvisibleIcon = function () {
	var icon = new OO.ui.ButtonWidget( {
		classes: [ 've-ce-focusableNode-invisibleIcon' ],
		framed: false,
		icon: this.constructor.static.iconWhenInvisible,
		label: this.constructor.static.getTextPreview( this.getModel().getAttribute( 'text' ) )
	} );
	this.icon = icon;
	return icon.$element;
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.CommentNode );
