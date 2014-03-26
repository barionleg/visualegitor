var MIN_GIF_URI = 'data:image/gif;base64,R0lGODdhAQABAAD/ACwAAAAAAQABAAA',
	OO = {ui: {Keys: {LEFT: 37, RIGHT: 39}}};

/**
 * Return abbreviated innerHTML (without attributes) as split by selection
 * @method
 * @param {HTMLElement} containerElement The DOM element
 * @param {rangy.WrappedRange} range The selection range, which must lie inside containerElement
 * @returns {string[]} A length-3 array (respectively, before/inside/after the range)
 */
function getParts ( containerElement, range ) {
	var node = range.commonAncestorContainer;
	while ( node !== null && node !== containerElement ) {
		node = node.parentNode;
	}
	if ( node !== containerElement ) {
		// Range is not inside container element
		return [ '', '', '' ];
	}
	return thride( containerElement, range ).split( /\0/ );
}

/**
 * Return innerHTML, with range boundaries marked with U+0000
 *
 * One or both range boundaries may lie outside the node, and therefore not be marked.
 * @private
 * @param {HTMLElement|HTMLTextNode} node The HTML node
 * @param {rangy.WrappedRange} range The selection range
 * @returns {string} innerHTML string, with range boundaries deliminated by U+0000
 */
function thride ( node, range ) {
	var offset, i, len, childNode,
		html = '';
	if ( node.nodeType === node.TEXT_NODE ) {
		offset = 0;
		if ( node === range.startContainer ) {
			html += node.textContent.substring( offset, range.startOffset );
			html += '\0';
			offset = range.startOffset;
		}
		if ( node === range.endContainer ) {
			html += node.textContent.substring( offset, range.endOffset );
			html += '\0';
			offset = range.endOffset;
		}
		html += node.textContent.substring( offset, node.textContent.length );
	} else if ( node.nodeType === node.ELEMENT_NODE ) {
		html += getOpenTag( node );
		for( i = 0, len = node.childNodes.length; i < len; i++ ) {
			childNode = node.childNodes[i];
			if ( node === range.startContainer && i === range.startOffset ) {
				html += '\0';
			}
			if ( node === range.endContainer && i === range.endOffset ) {
				html += '\0';
			}
			html += thride( childNode, range );
		}
		if ( node === range.startContainer && len === range.startOffset ) {
			html += '\0';
		}
		if ( node === range.endContainer && len === range.endOffset ) {
			html += '\0';
		}
		html += getCloseTag( node );
	} else {
		console.log( 'Unsupported node type:', node );
		throw new Error( 'Unsupported node type: ' + node );
	}
	return html;
}

function getOpenTag ( elementNode ) {
	// Don't care about attributes for now
	var ellipsis = ( elementNode.attributes.length > 0 ? '…' : '' );
	return '<' + elementNode.nodeName.toLowerCase() + ellipsis + '>';
}

function getCloseTag ( elementNode ) {
	return '</' + elementNode.nodeName.toLowerCase() + '>';
}

function escHigh ( s ) {
	return s.replace(
		/[^\u0000-\u007f…]/g,
		function ( ch ) {
			return '&#x' + ch.charCodeAt( 0 ).toString( 16 ) + ';';
		}
	);
}
	
function setup ( elts ) {
	var bNode = null,
		startRange = null;

	elts.content.focus();
	var showParts = function () {
		var sel, range, parts;
		sel = rangy.getSelection( document );
		if ( sel.rangeCount === 0 ) {
			parts = [ '', '', '' ];
		} else {
			range = sel.getRangeAt( 0 );
			parts = getParts( elts.content, range );
		}
		elts.before.textContent = escHigh( parts[0] );
		elts.inside.textContent = escHigh( parts[1] );
		elts.after.textContent = escHigh( parts[2] );
	};
	var onChange = function () {
		elts.html.textContent = escHigh( elts.content.innerHTML );
		showParts();
	};
	elts.boldButton.addEventListener( 'mousedown', function ( ev ) {
		ev.preventDefault();
		if ( bNode !== null ) {
			return;
		}
		bNode = addBold();
		if ( bNode !== null ) {
			onChange();
		}
	} );
	var tryFix = function () {
		var sel, range, node, elt,
			needFix = false;
		if ( bNode !== null ) {
			needFix = true;
			sel = rangy.getSelection( document );
			if ( sel.rangeCount !== 0 ) {
				range = sel.getRangeAt( 0 );
				node = range.commonAncestorContainer;
				elt = node.nodeType === node.TEXT_NODE ? node.parentNode : node;
				if ( elt === bNode || elt.parentNode === bNode ) {
					needFix = false;
				}
			}
		}
		if ( needFix ) {
			fixAnnotation();
		}
	};
	var fixAnnotation = function () {
		if ( bNode === null ) {
			return;
		}
		while ( bNode.getElementsByTagName( 'img' ).length > 0 ) {
			bNode.removeChild( bNode.getElementsByTagName( 'img' )[0] );
		}
		if ( bNode.childNodes.length === 0 ) {
			bNode.parentNode.removeChild( bNode );
		}
		bNode = null;
	};
	var refresh = function () {
		tryFix();
		elts.html.textContent = elts.content.innerHTML;
		showParts();
	};
	elts.content.addEventListener( 'mouseup', refresh );
	elts.content.addEventListener( 'mousemove', refresh );
	elts.content.addEventListener( 'keyup', refresh );
}

function addBold () {
	var sel, range, elt, textNode, text, pos, preText, postText, bNode, imgNode;
	sel = rangy.getSelection( document );
	if ( sel.rangeCount === 0 ) {
		return null;
	}
	range = sel.getRangeAt( 0 );
	if ( range.startContainer !== range.endContainer ) {
		return null;
	}
	if ( range.startContainer.nodeType !== range.startContainer.TEXT_NODE ) {
		return null;
	}
	textNode = range.startContainer;
	if ( range.startOffset !== range.endOffset ) {
		return null;
	}
	pos = range.startOffset;
	text = textNode.textContent;
	preText = text.substring( 0, pos );
	postText = text.substring( pos, text.length );
	elt = textNode.parentNode;
	elt.insertBefore( document.createTextNode( preText ), textNode );
	bNode = document.createElement( 'b' );
	bNode.className = 'pt-pre-annotation';
	imgNode = document.createElement( 'img' );
	imgNode.src = MIN_GIF_URI;
	bNode.appendChild( imgNode );
	elt.insertBefore( bNode, textNode );
	textNode.textContent = postText;
	range = rangy.createRange();
	range.setStart( bNode, 1 );
	range.setEnd( bNode, 1 );
	sel.removeAllRanges();
	sel.addRange( range );
	return bNode;
}
