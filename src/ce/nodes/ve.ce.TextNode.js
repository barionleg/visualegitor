/*!
 * VisualEditor ContentEditable TextNode class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable text node.
 *
 * @class
 * @extends ve.ce.LeafNode
 * @constructor
 * @param {ve.dm.TextNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TextNode = function VeCeTextNode() {
	// Parent constructor
	ve.ce.TextNode.super.apply( this, arguments );

	this.$element = $( [] );
};

/* Inheritance */

OO.inheritClass( ve.ce.TextNode, ve.ce.LeafNode );

/* Static Properties */

ve.ce.TextNode.static.name = 'text';

ve.ce.TextNode.static.splitOnEnter = true;

ve.ce.TextNode.static.whitespaceHtmlCharacters = {
	'\n': '\u21b5', // &crarr; / ↵
	'\t': '\u279e' // &#10142; / ➞
};

/* Methods */

/**
 * @return {string|null} Surface mode, or null when not attached to a surface
 */
ve.ce.TextNode.prototype.getSurfaceMode = function () {
	var
		// When running unit tests, these functions may return nothing
		rootNode = this.getRoot(),
		ceSurface = rootNode && rootNode.getSurface(),
		uiSurface = ceSurface && ceSurface.getSurface(),
		mode = uiSurface && uiSurface.getMode();
	return mode || null;
}

/**
 * Get an HTML rendering of the text.
 *
 * @method
 * @return {Array} Array of rendered HTML fragments with annotations
 */
ve.ce.TextNode.prototype.getAnnotatedHtml = function () {
	var i, chr, spaceBefore,
		data = this.model.getDocument().getDataFromNode( this.model ),
		sourceMode = this.getSurfaceMode() === 'source',
		whitespaceHtmlChars = this.constructor.static.whitespaceHtmlCharacters,
		significantWhitespace = this.getModel().getParent().hasSignificantWhitespace();

	function setChar( chr, index, data ) {
		if ( Array.isArray( data[ index ] ) ) {
			// Don't modify the original array, clone it first
			data[ index ] = data[ index ].slice( 0 );
			data[ index ][ 0 ] = chr;
		} else {
			data[ index ] = chr;
		}
	}

	function getChar( index, data ) {
		if ( Array.isArray( data[ index ] ) ) {
			return data[ index ][ 0 ];
		} else {
			return data[ index ];
		}
	}

	if ( !significantWhitespace ) {
		for ( i = 0; i < data.length; i++ ) {
			chr = getChar( i, data );
			// Show meaningful whitespace characters
			if ( Object.prototype.hasOwnProperty.call( whitespaceHtmlChars, chr ) ) {
				setChar( whitespaceHtmlChars[ chr ], i, data );
			}
		}
	}

	if ( sourceMode ) {
		// Change some spaces to NBSP to prevent the browser from collapsing trailing spaces
		// at the end of a line when rendering text. This uses the same algorithm as CodeMirror
		// (in function splitSpaces()) for compatibility with syntax highlighting overlay. (T188839)
		spaceBefore = false;
		for ( i = 0; i < data.length; i++ ) {
			chr = getChar( i, data );
			if ( chr === ' ' && spaceBefore && ( i === data.length - 1 || getChar( i + 1, data ) === ' ' ) ) {
				setChar( '\u00a0', i, data );
				spaceBefore = false;
			} else {
				spaceBefore = ( chr === ' ' );
			}
		}
	}

	return data;
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TextNode );
