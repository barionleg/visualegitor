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

/**
 * Data URI for minimal GIF image.
 */
ve.ce.minImgDataUri = 'data:image/gif;base64,R0lGODdhAQABAADcACwAAAAAAQABAAA';
ve.ce.unicornImgDataUri = 'data:image/gif;base64,R0lGODdhDwATAOf%2FAAAAAAEBAQICAgMDAwQEBAUFBQYGBgcHBwgICAkJCQoKCgsLCwwMDA0NDQ4ODg8PDxAQEBERERISEhMTExQUFBUVFRYWFhcXFxgYGBkZGRoaGhsbGxwcHB0dHR4eHh8fHyAgICEhISIiIiMjIyQkJCUlJSYmJicnJygoKCkpKSoqKisrKywsLC0tLS4uLi8vLzAwMDExMTIyMjMzMzQ0NDU1NTY2Njc3Nzg4ODk5OTo6Ojs7Ozw8PD09PT4%2BPj8%2FP0BAQEFBQUJCQkNDQ0REREVFRUZGRkdHR0hISElJSUpKSktLS0xMTE1NTU5OTk9PT1BQUFFRUVJSUlNTU1RUVFVVVVZWVldXV1hYWFlZWVpaWltbW1xcXF1dXV5eXl9fX2BgYGFhYWJiYmNjY2RkZGVlZWZmZmdnZ2hoaGlpaWpqamtra2xsbG1tbW5ubm9vb3BwcHFxcXJycnNzc3R0dHV1dXZ2dnd3d3h4eHl5eXp6ent7e3x8fH19fX5%2Bfn9%2Ff4CAgIGBgYKCgoODg4SEhIWFhYaGhoeHh4iIiImJiYqKiouLi4yMjI2NjY6Ojo%2BPj5CQkJGRkZKSkpOTk5SUlJWVlZaWlpeXl5iYmJmZmZqampubm5ycnJ2dnZ6enp%2Bfn6CgoKGhoaKioqOjo6SkpKWlpaampqenp6ioqKmpqaqqqqurq6ysrK2tra6urq%2Bvr7CwsLGxsbKysrOzs7S0tLW1tba2tre3t7i4uLm5ubq6uru7u7y8vL29vb6%2Bvr%2B%2Fv8DAwMHBwcLCwsPDw8TExMXFxcbGxsfHx8jIyMnJycrKysvLy8zMzM3Nzc7Ozs%2FPz9DQ0NHR0dLS0tPT09TU1NXV1dbW1tfX19jY2NnZ2dra2tvb29zc3N3d3d7e3t%2Ff3%2BDg4OHh4eLi4uPj4%2BTk5OXl5ebm5ufn5%2Bjo6Onp6erq6uvr6%2Bzs7O3t7e7u7u%2Fv7%2FDw8PHx8fLy8vPz8%2FT09PX19fb29vf39%2Fj4%2BPn5%2Bfr6%2Bvv7%2B%2Fz8%2FP39%2Ff7%2B%2Fv%2F%2F%2FywAAAAADwATAAAIngD%2FCRxIsOC%2BHBq8FVz4Dx0IHAL1MRwILUKef0ZMTRR4KoKwO2D2beTVgISDHPg2AmHA0kSXbwwPicHEkkEWNvEWDukQoSYDM34W4vDJ8kGfZQTzcSDKMssdgtAe1GzQgqWHPuMGBirEhAEPPRJYOnCkamA3I1SUiKrgs9CchY4aEDWzpqAyqUSbvKFHUA5TBkP8hCMY528HItA2MgwIADs%3D';

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
	} else if (
		!( nodeType === 1 && element.getAttribute( 'class' ) === 've-ce-unicorn' ) &&
		( nodeType === 1 || nodeType === 9 )
	) {
		hash += '<' + nodeName + '>';
		// Traverse its children
		for ( element = element.firstChild; element; element = element.nextSibling ) {
			hash += ve.ce.getDomHash( element );
		}
		hash += '</' + nodeName + '>';
		// Merge adjacent text node representations
		hash = hash.replace( /##+/g, '#' );
	}
	return hash;
};

/**
 *
 * @method
 * @param {Node} node DOM node
 * @returns {Object}
 * @returns {Node} return.node
 * @returns {number} return.offset
 */
ve.ce.nextCursorOffset = function ( node ) {
	var nextNode, offset;
	if ( node.nextSibling !== null && node.nextSibling.nodeType === Node.TEXT_NODE ) {
		nextNode = node.nextSibling;
		offset = 0;
	} else {
		nextNode = node.parentNode;
		offset = 1 + Array.prototype.indexOf.call( node.parentNode.childNodes, node );
	}
	return { node: nextNode, offset: offset };
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
	var node, view, offset, startNode, lengthSum = 0,
		$domNode = $( domNode );

	if ( $domNode.hasClass( 've-ce-unicorn' ) ) {
		if ( domOffset !== 0 ) {
			throw new Error( 'Non-zero offset in unicorn' );
		}
		return $domNode.data( 'dmOffset' );
	}

	/**
	 * Move to the previous "traversal node" in "traversal sequence".
	 *
	 * - A node is a "traversal node" if it is either a leaf node or a "view node"
	 * - A "view node" is one that has $( n ).data( 'view' ) instanceof ve.ce.Node
	 * - "Traversal sequence" is defined on every node (not just traversal nodes).
	 *   It is like document order, except that each parent node appears
	 *   in the sequence both immediately before and immediately after its child nodes.
	 *
	 * Important properties:
	 * - Non-traversal nodes don't have any width in DM (e.g. bold).
	 * - Certain traversal nodes also have no width (namely, those within an alienated node).
	 * - Both the start and end of a (non-alienated) parent traversal node has width
	 *   (which is one reason why traversal sequence is important).
	 * - In VE-normalized HTML, a text node cannot be a sibling of a non-leaf view node
	 *   (because all non-alienated text nodes are inside a ContentBranchNode).
	 * - Traversal-consecutive non-view nodes are either all alienated or all not alienated.
	 *
	 * @param {Node} n Node to traverse from
	 * @returns {Node} Previous traversal node from n
	 */
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

	// Figure out what node to start traversing at (startNode)
	if ( domNode.nodeType === Node.ELEMENT_NODE ) {
		if ( domNode.childNodes.length === 0 ) {
			// domNode has no children, and the offset is inside of it
			// If domNode is a view node, return the offset inside of it
			// Otherwise, start traversing at domNode
			startNode = domNode;
			view = $( startNode ).data( 'view' );
			if ( view instanceof ve.ce.Node ) {
				return view.getOffset() + ( view.isWrapped() ? 1 : 0 );
			}
			node = startNode;
		} else if ( domOffset === domNode.childNodes.length ) {
			// Offset is at the end of domNode, after the last child. Set startNode to the
			// very rightmost descendant node of domNode (i.e. the last child of the last child
			// of the last child, etc.)
			// However, if the last child or any of the last children we encounter on the way
			// is a view node, return the offset after it. This will be the correct return value
			// because non-traversal nodes don't have a DM width.
			startNode = domNode.lastChild;

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
			// Offset is right before childNodes[domOffset]. Set startNode to this node
			// (i.e. the node right after the offset), then traverse back once.
			startNode = domNode.childNodes[domOffset];
			node = traverse( startNode );
		}
	} else {
		lengthSum += domOffset;
		startNode = domNode;
		node = traverse( startNode );
	}

	// Walk the traversal nodes in reverse traversal sequence, until we find a view node.
	// Add the width of each text node we meet. (Non-text node non-view nodes can only be widthless).
	// Later, if it transpires that we're inside an alienated node, then we will throw away all the
	// text node lengths, because the alien's content has no DM width.
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
		offset += view.getModel().isWrapped() ? 1 : 0;
		if ( view.getModel().canContainContent() ) {
			offset += lengthSum;
		}
		// else: we're inside an alienated node: throw away all the text node lengths,
		// because the alien's content has no DM width
	} else {
		// node is not an ancestor of startNode
		// startNode comes after node, so add node's length
		offset += view.getOuterLength();
		if ( view.isContent() ) {
			// view is a leaf node inside of a CBN, so we started inside of a CBN
			// (otherwise we would have hit the CBN when entering it), so the text we summed up
			// needs to be counted.
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
