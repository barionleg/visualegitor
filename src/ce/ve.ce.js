/*!
 * VisualEditor ContentEditable namespace.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Namespace for all VisualEditor ContentEditable classes, static methods and static properties.
 * @class
 * @singleton
 */
ve.ce = {
	// nodeFactory: Initialized in ve.ce.NodeFactory.js
};

/* Static Properties */

/**
 * Data URI for minimal GIF image.
 */
ve.ce.minImgDataUri = 'data:image/gif;base64,R0lGODdhAQABAADcACwAAAAAAQABAAA';
ve.ce.unicornImgDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAATCAQAAADly58hAAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfeChIMMi319aEqAAAAzUlEQVQoz4XSMUoDURAG4K8NIljaeQZrCwsRb5FWL5Daa1iIjQewTycphAQloBEUAoogFmqMsiBmHSzcdfOWlcyU3/+YGXgsqJZMbvv/wLqZDCw1B9rCBSaOmgOHQsfQvVYT7wszIbPSxO9CCF8ebNXx1J2TIvDoxlrKU3mBIYz1U87mMISB3QqXk7e/A4bp1WV/CiE3sFHymZ4X4cO57yLWdVDyjoknr47/MPRcput1k+ljt/O4V1vu2bXViq9qPNW3WfGoxrk37UVfxQ999n1bP+Vh5gAAAABJRU5ErkJggg==';
ve.ce.chimeraImgDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAABGdBTUEAALGPC/xhBQAAAThJREFUOMvF088rRFEYxvGpKdnwJ8iStVnMytZ2ipJmI6xmZKEUe5aUULMzCxtlSkzNjCh2lClFSUpDmYj8KBZq6vreetLbrXs5Rjn1aWbuuee575z7nljsH8YkepoNaccsHrGFgWbCWpHCLZb+oroFzKOEbpeFHVp8gitsYltzSRyiqrkKhsKCevGMfWQwor/2ghns4BQTGMMcnlBA3Aa14U5VLeMDnqrq1/cDpHGv35eqrI5pG+Y/qYYp3WiN6zOHs8DcA7IK/BqLWMOuY5inQjwbNqheGnYMO9d+XtiwFu1BQU/y96ooKRO2Yq6vqog3jAbfZgKvuDELfGWFXQeu76GB9bD26MQRNnSMotTVJvGoxs2rx2oR/B47Rtd3pyBv3lCYnEtYWo0Yps8l7F3HKErjJ2G/Hp/F9YtlR3MQiAAAAABJRU5ErkJggg==';
ve.ce.nailImgDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAsElEQVQ4y%2B3RzYnCYBSF4ScOOtjBdGGKkCBYRZYWYE%2B2MNvgShAFp4JpQUZwoXFhAoPk0y%2F4s%2FLAXdzFfTn3HF6gT0yxxBZ%2FKDBsC%2FrCBmXDHDCOBfWwDoDqWcXCJjdAJfaxsCIC9h067lzsg3ta6zS0GFSWZTCLhS9C76VpWoffjYWNkyQ5BkAl8ravjzDHrnKSV6FfDb%2BN8n9O80cA3%2B7O%2BmgJW%2BMXffxU%2B0McPlcnctpQa2TeZewAAAAASUVORK5CYII%3D';

/* Static Methods */

/**
 * Gets the plain text of a DOM element (that is a node canContainContent === true)
 *
 * In the returned string only the contents of text nodes are included, and the contents of
 * non-editable elements are excluded (but replaced with the appropriate number of snowman
 * characters so the offsets match up with the linear model).
 *
 * @method
 * @param {HTMLElement} element DOM element to get text of
 * @return {string} Plain text of DOM element
 */
ve.ce.getDomText = function ( element ) {
	// Inspired by jQuery.text / Sizzle.getText
	var func = function ( element ) {
		var viewNode,
			nodeType = element.nodeType,
			$element = $( element ),
			text = '';

		if (
			nodeType === Node.ELEMENT_NODE ||
			nodeType === Node.DOCUMENT_NODE ||
			nodeType === Node.DOCUMENT_FRAGMENT_NODE
		) {
			if ( $element.hasClass( 've-ce-branchNode-blockSlug' ) ) {
				// Block slugs are not represented in the model at all, but they do
				// contain a single nbsp/FEFF character in the DOM, so make sure
				// that character isn't counted
				return '';
			} else if ( $element.hasClass( 've-ce-cursorHolder' ) ) {
				// Cursor holders do not exist in the model
				return '';
			} else if ( $element.hasClass( 've-ce-leafNode' ) ) {
				// For leaf nodes, don't return the content, but return
				// the right number of placeholder characters so the offsets match up.
				viewNode = $element.data( 'view' );
				// Only return snowmen for the first element in a sibling group: otherwise
				// we'll double-count this node
				if ( viewNode && element === viewNode.$element[ 0 ] ) {
					// \u2603 is the snowman character: ☃
					return new Array( viewNode.getOuterLength() + 1 ).join( '\u2603' );
				}
				// Second or subsequent sibling, don't double-count
				return '';
			} else {
				// Traverse its children
				for ( element = element.firstChild; element; element = element.nextSibling ) {
					text += func( element );
				}
			}
		} else if ( nodeType === Node.TEXT_NODE ) {
			return element.data;
		}
		return text;
	};
	// Return the text, replacing non-breaking spaces with spaces
	return func( element ).replace( /\u00A0/g, ' ' );
};

/**
 * Get text node list with linearized annotations.
 *
 * Work at a chunk level to help distinguish browser tag degradation (span->b) from real changes
 */
ve.ce.getDomAnnotatedChunks = function ( element ) {
	var func, i,
		stack = [],
		chunks = [];

	function getComparable( element ) {
		var parts = [ element.nodeName.toLowerCase() ];
		return parts.concat.apply( parts, element.classList ).join( '.' );
	}

	func = function ( element ) {
		var viewNode, child,
			nodeType = element.nodeType,
			$element = $( element );

		if (
			nodeType === Node.ELEMENT_NODE ||
			nodeType === Node.DOCUMENT_NODE ||
			nodeType === Node.DOCUMENT_FRAGMENT_NODE
		) {
			if ( $element.hasClass( 've-ce-branchNode-blockSlug' ) ) {
				// Block slugs are not represented in the model at all, but they do
				// contain a single nbsp/FEFF character in the DOM, so make sure
				// that character isn't counted
				return;
			} else if ( $element.hasClass( 've-ce-cursorHolder' ) ) {
				// Cursor holders do not exist in the model
				return;
			} else if ( $element.hasClass( 've-ce-leafNode' ) ) {
				// For leaf nodes, don't return the content, but return
				// the right number of placeholder characters so the offsets match up.
				viewNode = $element.data( 'view' );
				// Only return snowmen for the first element in a sibling group: otherwise
				// we'll double-count this node
				if ( viewNode && element === viewNode.$element[ 0 ] ) {
					// \u2603 is the snowman character: ☃
					chunks.push( {
						text: new Array( viewNode.getOuterLength() + 1 )
							.join( '\u2603' ),
						tags: stack.join( ' ' )
					} );
				}
				// Second or subsequent sibling, don't double-count
			} else if ( $element.hasClass( 've-ce-unicorn' ) ) {
				chunks.push( {
					text: '',
					type: 'unicorn',
					tags: stack.join( ' ' )
				} );
			} else {
				// Traverse its children
				if ( !ve.isBlockElement( element ) ) {
					stack.push( getComparable( element ) );
				}
				for ( child = element.firstChild; child; child = child.nextSibling ) {
					func( child );
				}
				if ( !ve.isBlockElement( element ) ) {
					stack.pop();
				}
			}
		} else if ( nodeType === Node.TEXT_NODE ) {
			// The text, with non-breaking spaces replaced by spaces
			chunks.push( {
				text: element.data.replace( /\u00A0/g, ' ' ),
				tags: stack.join( ' ' )
			} );
		}
	};
	func( element );
	// Merge adjacent chunks with equal tags
	for ( i = chunks.length - 1; i > 0; i-- ) {
		if (
			chunks[ i ].tags === chunks[ i - 1 ].tags &&
			chunks[ i ].type === undefined &&
			chunks[ i - 1 ].type === undefined
		) {
			chunks[ i - 1 ].text += chunks[ i ].text;
			chunks.splice( i, 1 );
		}
	}
	return chunks;
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
 * @return {string} Hash of DOM element
 */
ve.ce.getDomHash = function ( element ) {
	var $element,
		nodeType = element.nodeType,
		nodeName = element.nodeName,
		hash = '';

	if ( nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE ) {
		return '#';
	} else if ( nodeType === Node.ELEMENT_NODE || nodeType === Node.DOCUMENT_NODE ) {
		$element = $( element );
		if ( !(
			$element.hasClass( 've-ce-branchNode-blockSlug' ) ||
			$element.hasClass( 've-ce-cursorHolder' ) ||
			$element.hasClass( 've-ce-nail' )
		) ) {
			hash += '<' + nodeName + '>';
			// Traverse its children
			for ( element = element.firstChild; element; element = element.nextSibling ) {
				hash += ve.ce.getDomHash( element );
			}
			hash += '</' + nodeName + '>';
		}
		// Merge adjacent text node representations
		hash = hash.replace( /##+/g, '#' );
	}
	return hash;
};

/**
 * Get the first cursor offset immediately after a node.
 *
 * @param {Node} node DOM node
 * @return {Object}
 * @return {Node} return.node
 * @return {number} return.offset
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
 * Get the first cursor offset immediately before a node.
 *
 * @param {Node} node DOM node
 * @return {Object}
 * @return {Node} return.node
 * @return {number} return.offset
 */
ve.ce.previousCursorOffset = function ( node ) {
	var previousNode, offset;
	if ( node.previousSibling !== null && node.previousSibling.nodeType === Node.TEXT_NODE ) {
		previousNode = node.previousSibling;
		offset = previousNode.data.length;
	} else {
		previousNode = node.parentNode;
		offset = Array.prototype.indexOf.call( node.parentNode.childNodes, node );
	}
	return { node: previousNode, offset: offset };
};

/**
 * Gets the linear offset from a given DOM node and offset within it.
 *
 * @method
 * @param {HTMLElement} domNode DOM node
 * @param {number} domOffset DOM offset within the DOM node
 * @return {number} Linear model offset
 * @throws {Error} domOffset is out of bounds
 * @throws {Error} domNode has no ancestor with a .data( 'view' )
 * @throws {Error} domNode is not in document
 */
ve.ce.getOffset = function ( domNode, domOffset ) {
	var node, view, offset, startNode, maxOffset, lengthSum = 0,
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
	 * @return {Node} Previous traversal node from n
	 * @throws {Error} domNode has no ancestor with a .data( 'view' )
	 */
	function traverse( n ) {
		while ( !n.previousSibling ) {
			n = n.parentNode;
			if ( !n ) {
				throw new Error( 'domNode has no ancestor with a .data( \'view\' )' );
			}
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

	// Validate domOffset
	if ( domNode.nodeType === Node.ELEMENT_NODE ) {
		maxOffset = domNode.childNodes.length;
	} else {
		maxOffset = domNode.data.length;
	}
	if ( domOffset < 0 || domOffset > maxOffset ) {
		throw new Error( 'domOffset is out of bounds' );
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
			startNode = domNode.childNodes[ domOffset ];
			node = traverse( startNode );
		}
	} else {
		// Text inside of a block slug doesn't count
		if ( !(
			$( domNode.parentNode ).hasClass( 've-ce-branchNode-blockSlug' ) ||
			$( domNode.parentNode ).hasClass( 've-ce-cursorHolder' )
		) ) {
			lengthSum += domOffset;
		}
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

		// Text inside of a block slug doesn't count
		if (
			node.nodeType === Node.TEXT_NODE &&
			!$( node.parentNode ).hasClass( 've-ce-branchNode-blockSlug' ) &&
			!$( node.parentNode ).hasClass( 've-ce-cursorHolder' )
		) {
			lengthSum += node.data.length;
		}
		// else: non-text nodes that don't have a .data( 'view' ) don't exist in the DM
		node = traverse( node );
	}

	offset = view.getOffset();

	if ( $.contains( node, startNode ) ) {
		// node is an ancestor of startNode
		if ( !view.getModel().isContent() ) {
			// Add 1 to take the opening into account
			offset += view.getModel().isWrapped() ? 1 : 0;
		}
		if ( view.getModel().canContainContent() ) {
			offset += lengthSum;
		}
		// else: we're inside an alienated node: throw away all the text node lengths,
		// because the alien's content has no DM width
	} else if ( view.parent ) {
		// node is not an ancestor of startNode
		// startNode comes after node, so add node's length
		offset += view.getOuterLength();
		if ( view.isContent() ) {
			// view is a leaf node inside of a CBN, so we started inside of a CBN
			// (otherwise we would have hit the CBN when entering it), so the text we summed up
			// needs to be counted.
			offset += lengthSum;
		}
	} else {
		throw new Error( 'Node is not in document' );
	}

	return offset;
};

/**
 * Gets the linear offset of a given slug
 *
 * @method
 * @param {HTMLElement} element Slug DOM element
 * @return {number} Linear model offset
 * @throws {Error}
 */
ve.ce.getOffsetOfSlug = function ( element ) {
	var model, $element = $( element );
	if ( $element.index() === 0 ) {
		model = $element.parent().data( 'view' ).getModel();
		return model.getOffset() + ( model.isWrapped() ? 1 : 0 );
	} else if ( $element.prev().length ) {
		model = $element.prev().data( 'view' ).getModel();
		return model.getOffset() + model.getOuterLength();
	} else {
		throw new Error( 'Incorrect slug location' );
	}
};

/**
 * Test whether the DOM position lies straight after annotation boundaries
 *
 * "Straight after" means that in document order, there are annotation open/close tags
 * immediately before the position, and there are none immediately after.
 *
 * This is important for cursors: the DM position is ambiguous with respect to annotation
 * boundaries, and the browser does not fully distinguish this position from the preceding
 * position immediately before the annotation boundaries (e.g. 'a|&lt;b&gt;c' and 'a&lt;b&gt;|c'),
 * but the two positions behave differently for insertions (in this case, whether the text
 * appears bolded or not).
 *
 * In Chromium, cursor focus normalizes to the earliest (in document order) of equivalent
 * positions, at least in reasonably-styled non-BIDI text. But in Firefox, the user can
 * cursor/click into either the earliest or the latest equivalent position: the cursor lands in
 * the closest (in document order) to the click location (for mouse actions) or cursor start
 * location (for cursoring).
 *
 * @param {Node} node Position node
 * @param {number} offset Position offset
 * @return {boolean} Whether this is the end-most of multiple cursor-equivalent positions
 */
ve.ce.isAfterAnnotationBoundary = function ( node, offset ) {
	var previousNode;
	if ( node.nodeType === Node.TEXT_NODE ) {
		if ( offset > 0 ) {
			return false;
		}
		offset = Array.prototype.indexOf.call( node.parentNode.childNodes, node );
		node = node.parentNode;
	}
	if ( offset === 0 ) {
		return ve.dm.modelRegistry.isAnnotation( node );
	}

	previousNode = node.childNodes[ offset - 1 ];
	if ( previousNode.nodeType === Node.ELEMENT_NODE && (
		previousNode.classList.contains( 've-ce-nail-post-close' ) ||
		previousNode.classList.contains( 've-ce-nail-post-open' )
	) ) {
		return true;
	}
	return ve.dm.modelRegistry.isAnnotation( previousNode );
};

/**
 * Check if keyboard shortcut modifier key is pressed.
 *
 * @method
 * @param {jQuery.Event} e Key press event
 * @return {boolean} Modifier key is pressed
 */
ve.ce.isShortcutKey = function ( e ) {
	return !!( e.ctrlKey || e.metaKey );
};

/**
 * Find the DM range of a DOM selection
 *
 * @param {Object} selection DOM-selection-like object
 * @param {Node} selection.anchorNode
 * @param {number} selection.anchorOffset
 * @param {Node} selection.focusNode
 * @param {number} selection.focusOffset
 * @return {ve.Range|null} DM range, or null if nothing in the CE document is selected
 */
ve.ce.veRangeFromSelection = function ( selection ) {
	try {
		return new ve.Range(
			ve.ce.getOffset( selection.anchorNode, selection.anchorOffset ),
			ve.ce.getOffset( selection.focusNode, selection.focusOffset )
		);
	} catch ( e ) {
		return null;
	}
};

/**
 * Find the link in which a node lies
 *
 * @param {Node|null} node The node to test
 * @return {Node|null} The link within which the node lies (possibly the node itself)
 */
ve.ce.linkAt = function ( node ) {
	if ( node && node.nodeType === Node.TEXT_NODE ) {
		node = node.parentNode;
	}
	return $( node ).closest( '.ve-ce-linkAnnotation' )[ 0 ];
};

/**
 * Analyse a DOM content change to build a Transaction
 *
 * Content changes have oldState.node === newState.node and newState.contentChanged === true .
 * Annotations are inferred heuristically from plaintext to do what the user intended.
 * TODO: treat more changes as simple (not needing a re-render); see
 * https://phabricator.wikimedia.org/T114260 .
 *
 * @method
 * @param {ve.ce.RangeState} oldState The prior range state
 * @param {ve.ce.RangeState} newState The changed range state
 *
 * @return {ve.dm.Transaction} Transaction corresponding to the DOM content change
 */
ve.ce.modelChangeFromContentChange = function ( oldState, newState ) {
	var splices, tx, endOffset, adjust, i, len, splice, data, annotations,
		// It is guaranteed that oldState.node === newState.node , so just call it 'node'
		node = newState.node,
		nodeOffset = node.getModel().getOffset(),
		dmDoc = node.getModel().getDocument(),
		modelData = dmDoc.data;

	splices = ve.ce.diffAnnotatedChunks( oldState.annotatedChunks, newState.annotatedChunks );
	tx = new ve.dm.Transaction( dmDoc );
	endOffset = 0;
	adjust = 0;
	for ( i = 0, len = splices.length; i < len; i++ ) {
		splice = splices[ i ];
		if ( splice.type === 'remove' ) {
			endOffset = tx.pushRemoval(
				dmDoc,
				endOffset,
				new ve.Range(
					nodeOffset + 1 + splice.offset + adjust,
					nodeOffset + 1 + splice.offset + splice.text.length + adjust
				)
			);
			adjust += splice.text.length;
		} else if ( splice.type === 'insert' ) {
			data = splice.text.split( '' );
			if ( splice.oldAnnOffset === 'unicorn' ) {
				if ( node.unicornAnnotations ) {
					annotations = node.unicornAnnotations;
				}
			} else if ( splice.oldAnnOffset !== null ) {
				annotations = modelData.getInsertionAnnotationsFromRange(
					new ve.Range( nodeOffset + 1 + splice.oldAnnOffset ),
					true
				);
			}
			if ( annotations ) {
				ve.dm.Document.static.addAnnotationsToData( data, annotations );
			}
			// TODO: else we haven't got the correct annotation, so do a full convert
			endOffset = tx.pushInsertion( dmDoc, endOffset, nodeOffset + 1 + splice.offset + adjust, data );
		} else {
			throw new Error( 'Unknown splice type: ' + splice.type );
		}
	}
	tx.pushFinalRetain( dmDoc, endOffset );
	return tx;
};

ve.ce.diffAnnotatedChunks = function ( oldChunks, newChunks ) {
	var chunkChanges, before, after, beforeStart, afterStart, beforeEnd, afterEnd,
		fromLeft, fromRight, offset, i, iLen, j, jLen, text, cloneOffsets, tags, tagOffset,
		splices = [];

	// Find minimal range of chunks that have changed (either in text or tags)
	chunkChanges = ve.diffSequences( oldChunks, newChunks, function ( x, y ) {
		return x.tags === y.tags && x.text === y.text;
	} );
	before = chunkChanges.before;
	after = chunkChanges.after;

	// Find minimal range of text that has not changed annotation (only chunk)
	fromLeft = 0;
	fromRight = 0;
	if ( before.length > 0 && after.length > 0 ) {
		beforeStart = before[ 0 ];
		afterStart = after[ 0 ];
		while (
			beforeStart.tags === afterStart.tags &&
			beforeStart.text[ fromLeft ] === afterStart.text[ fromLeft ]
			// This cannot succeed for entire text, else chunk would be unchanged
		) {
			fromLeft++;
		}

		beforeEnd = before[ before.length - 1 ];
		afterEnd = after[ after.length - 1 ];
		while (
			beforeEnd.tags === afterEnd.tags &&
			beforeEnd.text[ beforeEnd.text.length - 1 - fromRight ] ===
				afterEnd.text[ afterEnd.text.length - 1 - fromRight ]
			// This cannot succeed for entire text, else chunk would be unchanged
		) {
			fromRight++;
		}
	}

	// Find the offset of the first changed chunk
	offset = oldChunks.slice( 0, chunkChanges.retainStart ).reduce( function ( total, chunk ) {
		return total + chunk.text.length;
	}, 0 );

	// Look at annotations on inserted text, and find where we can clone from (if anywhere)
	// The annotations are likely to be a list of length 1 (or occasionally 0, 2 or 3), so
	// O(n^2) is fine.
	cloneOffsets = [];
	NEW_ANNOTATIONS:
	for ( i = 0, iLen = after.length; i < iLen; i++ ) {
		tagOffset = offset;
		tags = after[ i ].tags;
		for ( j = 0, jLen = before.length; j < jLen; j++ ) {
			if ( before[ j ].tags === tags ) {
				cloneOffsets.push( before[ j ].type === 'unicorn' ? 'unicorn' : tagOffset );
				continue NEW_ANNOTATIONS;
			}
			tagOffset += before[ j ].text.length;
		}
		// Not found the tag; now look at the text after the change
		for ( j = oldChunks.length - chunkChanges.retainEnd, jLen = oldChunks.length; j < jLen; j++ ) {
			if ( oldChunks[ j ].tags === tags  ) {
				cloneOffsets.push( oldChunks[ j ].type === 'unicorn' ? 'unicorn' : tagOffset );
				continue NEW_ANNOTATIONS;
			}
			tagOffset += oldChunks[ j ].text.length;
		}

		// Not found the tag; look at the text before the change
		tagOffset = 0;
		for ( j = 0; j < chunkChanges.retainStart; j++ ) {
			if ( oldChunks[ j ].tags === tags ) {
				cloneOffsets.push( oldChunks[ j ].type === 'unicorn' ? 'unicorn' : tagOffset );
				continue NEW_ANNOTATIONS;
			}
			tagOffset += oldChunks[ j ].text.length;
		}
		// Not found the tag at all; use null
		cloneOffsets.push( null );
	}

	offset += fromLeft;

	for ( i = 0, iLen = before.length; i < iLen; i++ ) {
		text = before[ i ].text;
		if ( i === 0 ) {
			text = text.slice( fromLeft );
		}
		if ( i === iLen - 1 ) {
			text = text.slice( 0, text.length - fromRight );
		}
		if ( text === '' ) {
			continue;
		}
		splices.push( {
			type: 'remove',
			offset: offset,
			text: text,
			tags: before[ i ].tags
		} );
	}
	for ( i = 0, iLen = after.length; i < iLen; i++ ) {
		text = after[ i ].text;
		if ( i === 0 ) {
			text = text.slice( fromLeft );
		}
		if ( i === iLen - 1 ) {
			text = text.slice( 0, text.length - fromRight );
		}
		if ( text === '' ) {
			continue;
		}
		splices.push( {
			type: 'insert',
			offset: offset,
			text: text,
			tags: after[ i ].tags,
			oldAnnOffset: cloneOffsets[ i ]
		} );
		offset += text.length;
	}
	return splices;
};
