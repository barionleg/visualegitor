/*!
 * VisualEditor ContentEditable namespace.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Namespace for all VisualEditor ContentEditable classes, static methods and static properties.
 * @class
 * @singleton
 */
ve.ce = {
	//'nodeFactory': Initialized in ve.ce.NodeFactory.js
};

/* Static Properties */

/**
 * RegExp pattern for matching all whitespaces in HTML text.
 *
 * \u0020 (32) space
 * \u00A0 (160) non-breaking space
 *
 * @property
 */
ve.ce.whitespacePattern = /[\u0020\u00A0]/g;

/* Static Methods */

/**
 * Gets the plain text of a DOM element (that is a node canContainContent === true)
 *
 * In the returned string only the contents of text nodes are included, and the contents of
 * non-editable elements are excluded (but replaced with the appropriate number of characters
 * so the offsets match up with the linear model).
 *
 * @method
 * @param {HTMLElement} element DOM element to get text of
 * @returns {string} Plain text of DOM element
 */
ve.ce.getDomText = function ( element ) {
	// Inspired by jQuery.text / Sizzle.getText
	var func = function ( element ) {
		var nodeType = element.nodeType,
			text = '',
			numChars,
			$element = $( element );

		// Node.ELEMENT_NODE = 1
		// Node.DOCUMENT_NODE = 9
		// Node.DOCUMENT_FRAGMENT_NODE = 11
		if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			if ( $element.hasClass( 've-ce-branchNode-slug' ) ) {
				// Slugs are not represented in the model at all, but they do
				// contain a single nbsp/FEFF character in the DOM, so make sure
				// that character isn't counted
				return '';
			} else if ( $element.hasClass( 've-ce-leafNode' ) ) {
				// For leaf nodes, don't return the content, but return
				// the right amount of characters so the offsets match up
				numChars = $element.data( 'view' ).getOuterLength();
				return new Array( numChars + 1 ).join( '\u2603' );
			} else {
				// Traverse its children
				for ( element = element.firstChild; element; element = element.nextSibling ) {
					text += func( element );
				}
			}
		// Node.TEXT_NODE = 3
		// Node.CDATA_SECTION_NODE = 4 (historical, unused in HTML5)
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return element.data;
		}
		return text;
	};
	// Return the text, replacing spaces and non-breaking spaces with spaces?
	// TODO: Why are we replacing spaces (\u0020) with spaces (' ')
	return func( element ).replace( ve.ce.whitespacePattern, ' ' );
};

/**
 * Gets a hash of a DOM element's structure.
 *
 * In the returned string text nodes are represented as "#" and elements are represented as "<type>"
 * and "</type>" where "type" is their element name. This effectively generates an HTML
 * serialization without any attributes or text contents. This can be used to observe structural
 * changes.
 *
 * @method
 * @param {HTMLElement} element DOM element to get hash of
 * @returns {string} Hash of DOM element
 */
ve.ce.getDomHash = function ( element ) {
	var nodeType = element.nodeType,
		nodeName = element.nodeName,
		hash = '';

	if ( nodeType === 3 || nodeType === 4 ) {
		return '#';
	} else if ( nodeType === 1 || nodeType === 9 ) {
		hash += '<' + nodeName + '>';
		// Traverse its children
		for ( element = element.firstChild; element; element = element.nextSibling ) {
			hash += ve.ce.getDomHash( element );
		}
		hash += '</' + nodeName + '>';
	}
	return hash;
};

/**
 * Gets the linear offset from a given DOM node and offset within it.
 *
 * @method
 * @param {HTMLElement} domNode DOM node
 * @param {number} domOffset DOM offset within the DOM node
 * @returns {number} Linear model offset
 */
ve.ce.getOffset = function ( domNode, domOffset ) {
	// TODO think about slugs and shields
	var node, view, offset, startNode, lengthSum = 0;

	function traverse( n ) {
		while ( !n.previousSibling ) {
			n = n.parentNode;
			if ( $( n ).data( 'view' ) instanceof ve.ce.Node ) {
				return n;
			}
		}
		n = n.previousSibling;
		if ( $( n ).data( 'view' ) instanceof ve.ce.Node ) {
			return n;
		}
		while ( n.lastChild ) {
			n = n.lastChild;
			if ( $( n ).data( 'view' ) instanceof ve.ce.Node ) {
				return n;
			}
		}
		return n;
	}

	if ( domNode.nodeType === Node.ELEMENT_NODE ) {
		if ( domNode.childNodes.length === 0 ) {
			startNode = domNode;
			view = $( startNode ).data( 'view' );
			if ( view instanceof ve.ce.Node ) {
				return view.getOffset() + ( view.isWrapped() ? 1 : 0 );
			}
			node = startNode;
		} else if ( domOffset === domNode.childNodes.length ) {
			startNode = domNode.childNodes[domNode.childNodes.length - 1];

			view = $( startNode ).data( 'view' );
			if ( view instanceof ve.ce.Node ) {
				return view.getOffset() + view.getOuterLength();
			}
			while ( startNode.lastChild ) {
				startNode = startNode.lastChild;
				view = $( startNode ).data( 'view' );
				if ( view instanceof ve.ce.Node ) {
					return view.getOffset() + view.getOuterLength();
				}
			}
			node = startNode;
		} else {
			startNode = domNode.childNodes[domOffset];
			node = traverse( startNode );
		}
	} else {
		lengthSum += domOffset;
		startNode = domNode;
		node = traverse( startNode );
	}

	// Traverse (left || up) until we encounter a node that has a CE node
	// Populate path with nodes we encounter while moving left (but not while moving up)
	while ( true ) {
		// First node that has a ve.ce.Node, stop
		// Note that annotations have a .data( 'view' ) too, but that's a ve.ce.Annotation,
		// not a ve.ce.Node
		view = $( node ).data( 'view' );
		if ( view instanceof ve.ce.Node ) {
			break;
		}

		if ( node.nodeType === Node.TEXT_NODE ) {
			lengthSum += node.data.length;
		}
		// else: non-text nodes that don't have a .data( 'view' ) don't exist in the DM
		node = traverse( node );
	}

	offset = view.getOffset();

	if ( $.contains( node, startNode ) ) {
		// node is an ancestor of startNode
		// Add 1 to take the opening into account
		offset += view.getModel().isWrapped ? 1 : 0;
		if ( view.getModel().canContainContent() ) {
			offset += lengthSum;
		}
	} else {
		// node is not an ancestor of startNode
		// startNode comes after node, so add node's length
		offset += view.getOuterLength();
		if ( node.isContent() ) {
			offset += lengthSum;
		}
	}

	return offset;
};

/**
 * Gets the linear offset of a given slug
 *
 * @method
 * @param {jQuery} $node jQuery slug selection
 * @returns {number} Linear model offset
 * @throws {Error}
 */
ve.ce.getOffsetOfSlug = function ( $node ) {
	var model;
	if ( $node.index() === 0 ) {
		model = $node.parent().data( 'view' ).getModel();
		return model.getOffset() + ( model.isWrapped() ? 1 : 0 );
	} else if ( $node.prev().length ) {
		model = $node.prev().data( 'view' ).getModel();
		return model.getOffset() + model.getOuterLength();
	} else {
		throw new Error( 'Incorrect slug location' );
	}
};

/**
 * Check if the key code represents a left or right arrow key
 * @param {number} keyCode Key code
 * @returns {boolean} Key code represents a left or right arrow key
 */
ve.ce.isLeftOrRightArrowKey = function ( keyCode ) {
	return keyCode === OO.ui.Keys.LEFT || keyCode === OO.ui.Keys.RIGHT;
};

/**
 * Check if the key code represents an up or down arrow key
 * @param {number} keyCode Key code
 * @returns {boolean} Key code represents an up or down arrow key
 */
ve.ce.isUpOrDownArrowKey = function ( keyCode ) {
	return keyCode === OO.ui.Keys.UP || keyCode === OO.ui.Keys.DOWN;
};

/**
 * Check if the key code represents an arrow key
 * @param {number} keyCode Key code
 * @returns {boolean} Key code represents an arrow key
 */
ve.ce.isArrowKey = function ( keyCode ) {
	return ve.ce.isLeftOrRightArrowKey( keyCode ) || ve.ce.isUpOrDownArrowKey( keyCode );
};

/**
 * Check if keyboard shortcut modifier key is pressed.
 *
 * @method
 * @param {jQuery.Event} e Key press event
 * @returns {boolean} Modifier key is pressed
 */
ve.ce.isShortcutKey = function ( e ) {
	return !!( e.ctrlKey || e.metaKey );
};
