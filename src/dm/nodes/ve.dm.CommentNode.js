/*!
 * VisualEditor DataModel CommentNode class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @abstract
 * @extends ve.dm.LeafNode
 * @mixins ve.dm.FocusableNode
 *
 * @constructor
 * @param {Object} element Reference to element in meta-linmod
 */
ve.dm.CommentNode = function VeDmCommentNode( element ) {
	// Parent constructor
	ve.dm.CommentNode.super.call( this, element );

	// Mixin constructors
	ve.dm.FocusableNode.call( this );
};

/* Inheritance */

OO.inheritClass( ve.dm.CommentNode, ve.dm.LeafNode );

OO.mixinClass( ve.dm.CommentNode, ve.dm.FocusableNode );

/* Static Properties */

ve.dm.CommentNode.static.isContent = true;

ve.dm.CommentNode.static.preserveHtmlAttributes = false;

ve.dm.CommentNode.static.toDataElement = function ( domElements, converter ) {
	var text;
	if ( domElements[ 0 ].nodeType === Node.COMMENT_NODE ) {
		// Decode HTML entities, safely (no elements permitted inside textarea)
		text = $( '<textarea/>' ).html( domElements[ 0 ].data ).text();
	} else {
		text = domElements[ 0 ].getAttribute( 'data-ve-comment' );
	}
	return {
		// Disallows comment nodes between table rows and such
		type: converter.isValidChildNodeType( 'comment' ) && text !== '' ? 'comment' : 'commentMeta',
		attributes: {
			text: text
		}
	};
};

ve.dm.CommentNode.static.toDomElements = function ( dataElement, doc, converter ) {
	var span, data;
	if ( converter.isForClipboard() ) {
		// Fake comment node
		span = doc.createElement( 'span' );
		span.setAttribute( 'rel', 've:Comment' );
		span.setAttribute( 'data-ve-comment', dataElement.attributes.text );
		return [ span ];
	} else {
		// Real comment node
		// Encode '&', and certain '-' and '>' characters (see T95040)
		data = dataElement.attributes.text.replace( /^[->]|--|-$|&/g, function ( m ) {
			return m.slice( 0, m.length - 1 ) +
				'&#' + m.charCodeAt( m.length - 1 ) + ';';
		} );
		return [ doc.createComment( data ) ];
	}
};

/**
 * @class
 * @extends ve.dm.CommentNode
 *
 * @constructor
 * @param {Object} element Reference to element in meta-linmod
 */
ve.dm.RealCommentNode = function VeDmRealCommentNode() {
	ve.dm.RealCommentNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.RealCommentNode, ve.dm.CommentNode );

/* Static Properties */

ve.dm.RealCommentNode.static.name = 'comment';

ve.dm.RealCommentNode.static.matchTagNames = [ '#comment' ];

/**
 * Fake comments generated by the converter for the clipboard
 *
 * `<span rel="ve:Comment">` is used to to preserve
 * comments in the clipboard
 *
 * @class
 * @extends ve.dm.CommentNode
 *
 * @constructor
 * @param {Object} element Reference to element in meta-linmod
 */
ve.dm.FakeCommentNode = function VeDmFakeCommentNode() {
	ve.dm.FakeCommentNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.FakeCommentNode, ve.dm.CommentNode );

/* Static Properties */

ve.dm.FakeCommentNode.static.name = 'fakeComment';

ve.dm.FakeCommentNode.static.matchRdfaTypes = [ 've:Comment' ];

/* Registration */

ve.dm.modelRegistry.register( ve.dm.RealCommentNode );
ve.dm.modelRegistry.register( ve.dm.FakeCommentNode );
