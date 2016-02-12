/*!
 * VisualEditor ContentEditable Document class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable document.
 *
 * @class
 * @extends ve.Document
 *
 * @constructor
 * @param {ve.dm.Document} model Model to observe
 * @param {ve.ce.Surface} surface Surface document is part of
 */
ve.ce.Document = function VeCeDocument( model, surface ) {
	// Parent constructor
	ve.Document.call( this, new ve.ce.DocumentNode( model.getDocumentNode(), surface ) );

	this.getDocumentNode().$element.prop( {
		lang: model.getLang(),
		dir: model.getDir()
	} );

	// Properties
	this.model = model;
};

/* Inheritance */

OO.inheritClass( ve.ce.Document, ve.Document );

/* Methods */

/**
 * Get a slug at an offset.
 *
 * @method
 * @param {number} offset Offset to get slug at
 * @return {HTMLElement} Slug at offset
 */
ve.ce.Document.prototype.getSlugAtOffset = function ( offset ) {
	var node = this.getBranchNodeFromOffset( offset );
	return node ? node.getSlugAtOffset( offset ) : null;
};

/**
 * Calculate the DOM location corresponding to a DM offset
 *
 * @param {number} offset Linear model offset
 * @param {boolean} outsideNail Whether to jump outside nails if directly next to them
 * @return {Object} DOM location
 * @return {Node} return.node location node
 * @return {number} return.offset location offset within the node
 * @throws {Error} Offset could not be translated to a DOM element and offset
 */
ve.ce.Document.prototype.getNodeAndOffset = function ( offset, outsideNail ) {
	var nao, currentNode, nextLeaf, previousLeaf;
	// Get the un-unicorn-adjusted result. If it is:
	// - just before pre unicorn (in same branch node), return cursor location just after it
	// - just after post unicorn (in same branch node), return cursor location just before it
	// - anywhere else, return the result unmodified

	/**
	 * Get the DOM leaf between current and adjacent cursor positions in a .ve-ce-branchNode
	 *
	 * @param {number} direction 1 for forwards, -1 for backwards
	 * @param {Node} node The position node
	 * @param {number} [offset] The position offset; defaults to leading edge inside node
	 * @return {Node|null} DOM leaf, if it exists
	 */
	function getAdjacentLeaf( direction, node, offset ) {
		var interior,
			isText = ( node.nodeType === Node.TEXT_NODE ),
			back = direction < 0;

		if ( offset === undefined ) {
			offset = back ? 0 : ( isText ? node.data : node.childNodes ).length;
		}
		if ( back ) {
			interior = offset > 0;
		} else {
			interior = offset < ( isText ? node.data : node.childNodes ).length;
		}

		if ( isText && interior ) {
			// There is only text adjacent to the position
			return null;
		}

		if ( interior ) {
			node = node.childNodes[ back ? offset - 1 : offset ];
		} else {
			// We're at the node boundary; step parent-wards until there is a
			// previous sibling, then step to that
			while ( ( back ? node.previousSibling : node.nextSibling ) === null ) {
				node = node.parentNode;
				if ( !node || node.classList.contains( 've-ce-branchNode' ) ) {
					return null;
				}
			}
			node = ( back ? node.previousSibling : node.nextSibling );
		}

		// step child-wards until we hit a leaf
		while ( node.firstChild ) {
			node = back ? node.lastChild : node.firstChild;
		}
		return node;
	}

	nao = this.getNodeAndOffsetUnadjustedForUnicorn( offset );
	currentNode = nao.node;
	previousLeaf = getAdjacentLeaf( -1, nao.node, nao.offset );
	nextLeaf = getAdjacentLeaf( 1, nao.node, nao.offset );

	// Adjust for unicorn or nails if necessary, then return
	if (
		nextLeaf &&
		nextLeaf.nodeType === Node.ELEMENT_NODE &&
		nextLeaf.classList.contains( 've-ce-pre-unicorn' )
	) {
		// At offset just before the pre unicorn; return the point just after it
		return ve.ce.nextCursorOffset( nextLeaf );
	}
	if (
		previousLeaf &&
		previousLeaf.nodeType === Node.ELEMENT_NODE &&
		previousLeaf.classList.contains( 've-ce-post-unicorn' )
	) {
		// At text offset or slug just after the post unicorn; return the point just before it
		return ve.ce.previousCursorOffset( previousLeaf );
	}

	if ( outsideNail ) {
		if (
			nao.offset === currentNode.length &&
			nextLeaf &&
			nextLeaf.nodeType === Node.ELEMENT_NODE &&
			nextLeaf.classList.contains( 've-ce-nail-pre-close' )
		) {
			// Being outside the nails requested and right next to the ending nail: jump outside
			return ve.ce.nextCursorOffset( getAdjacentLeaf( 1, nextLeaf ) );
		}
		if (
			nao.offset === 0 &&
			previousLeaf &&
			previousLeaf.nodeType === Node.ELEMENT_NODE &&
			previousLeaf.classList.contains( 've-ce-nail-post-open' )
		) {
			// Being outside the nails requested and right next to the starting nail: jump outside
			return ve.ce.previousCursorOffset( getAdjacentLeaf( -1, previousLeaf ) );
		}
	}

	return nao;
};

/**
 * Calculate the DOM location corresponding to a DM offset (without unicorn adjustments)
 *
 * @private
 * @param {number} offset Linear model offset
 * @return {Object} location
 * @return {Node} return.node location node
 * @return {number} return.offset location offset within the node
 */
ve.ce.Document.prototype.getNodeAndOffsetUnadjustedForUnicorn = function ( offset ) {
	var branchNode, position, count, step, node, textLength, matchingPositions, model,
		countedNodes = [],
		slug = this.getSlugAtOffset( offset );

	// Cleaner method:
	// 1. Step with ve.adjacentDomPosition until we hit a position at the correct offset
	// (which is guaranteed to be the first such position in document order).
	// 2. Use ve.adjacentDomPosition( ..., { skipSoft: false } ) once to return all
	// subsequent positions at the same offset.
	// 3. Look at the possible positions and pick accordingly.

	// If we're a block slug, or an empty inline slug, return its location
	// Start at the current branch node; get its start offset
	// Walk the tree, summing offsets until the sum reaches the desired offset value.
	// If the desired offset:
	// - is after a ve-ce-branchNode/ve-ce-leafNode: skip the node
	// - is inside a ve-ce-branchNode/ve-ce-leafNode: descend into node
	// - is between an empty unicorn pair: return inter-unicorn location
	// At the desired offset:
	// - If is a text node: return that node and the correct remainder offset
	// - Else return the first maximally deep element at the offset
	// Otherwise, signal an error

	// Unfortunately, there is no way to avoid slugless block nodes with no DM length: an
	// IME can remove all the text from a node at a time when it is unsafe to fixup the node
	// contents. In this case, a maximally deep element gives better bounding rectangle
	// coordinates than any of its containers.

	// Check for a slug that is empty (apart from a chimera) or a block slug
	// TODO: remove this check: it can just be a case of non-branchNode/leafNode DOM element
	if ( slug && (
		!slug.firstChild ||
		$( slug ).hasClass( 've-ce-branchNode-blockSlug' ) ||
		$( slug.firstChild ).hasClass( 've-ce-chimera' )
	) ) {
		return { node: slug, offset: 0 };
	}
	branchNode = this.getBranchNodeFromOffset( offset );
	position = { node: branchNode.$element, offset: 0 };
	count = branchNode.getOffset() + ( ( branchNode.isWrapped() ) ? 1 : 0 );

	function noDescend() {
		return this.classList.contains( 've-ce-branchNode-blockSlug' ) ||
			ve.rejectsCursor( this );
	}

	while ( true ) {
		if ( count === offset ) {
			break;
		}
		position = ve.adjacentDomPosition( position, 1, { noDescend: noDescend } );
		step = position.steps[ 0 ];
		node = step.node;
		if ( node.nodeType === Node.TEXT_NODE ) {
			// this branch always breaks or skips over the text node; therefore it
			// is guaranteed that this is the first time we encounter the text node,
			// so step.type === 'enter' (we just stepped in)
			// TODO: what about zero-length text nodes?
			textLength = node.data.length;
			if ( offset <= count + textLength ) {
				// match the appropriate offset in the text node
				matchingPositions.push( { node: node, offset: offset - count } );
				break;
			} else {
				// skip over the text node
				count += textLength;
				position = { node: node, offset: textLength };
				continue;
			}
		} // else is an element node (TODO: handle comment etc)

		if ( !(
			node.classList.contains( 've-ce-branchNode' ) ||
			node.classList.contains( 've-ce-leafNode' )
		) ) {
			// Nodes like b, inline slug, browser-generated br that doesn't have
			// class ve-ce-leafNode: continue walk without incrementing
			continue;
		}

		if ( step.type === 'leave' ) {
			// Below we'll guarantee that .ve-ce-branchNode/.ve-ce-leafNode elements
			// are only enteres if their open/close tags take up a model offset, so
			// we can increment unconditionally here
			count++;
			continue;
		} // else step.type === 'enter' || step.type === 'cross'

		model = $.data( node, 'view' ).model;

		if ( countedNodes.indexOf( model ) !== -1 ) {
			// This DM node is rendered as multiple DOM elements, and we have already
			// counted it as part of an earlier element. Skip past without incrementing
			position = { node: node.parentNode, offset: ve.parentIndex( node ) + 1 };
		} else if ( offset >= count + model.getOuterLength() ) {
			// Offset doesn't lie inside the node. Skip past and count length
			// skip past the whole node
			position = { node: node.parentNode, offset: ve.parentIndex( node ) + 1 };
			count += model.getOuterLength();
		} else if ( step.type === 'cross' ) {
			count += 2;
		} else {
			count += 1;
		}
	}
	throw new Error( 'Offset could not be translated to a DOM element and offset: ' + offset );
};

/**
 * Get the directionality of some selection.
 *
 * @method
 * @param {ve.dm.Selection} selection Selection
 * @return {string|null} 'rtl', 'ltr' or null if unknown
 */
ve.ce.Document.prototype.getDirectionFromSelection = function ( selection ) {
	var effectiveNode, range, selectedNodes;

	if ( selection instanceof ve.dm.LinearSelection ) {
		range = selection.getRange();
	} else if ( selection instanceof ve.dm.TableSelection ) {
		range = selection.tableRange;
	} else {
		return null;
	}

	selectedNodes = this.selectNodes( range, 'covered' );

	if ( selectedNodes.length > 1 ) {
		// Selection of multiple nodes
		// Get the common parent node
		effectiveNode = this.selectNodes( range, 'siblings' )[ 0 ].node.getParent();
	} else {
		// selection of a single node
		effectiveNode = selectedNodes[ 0 ].node;

		while ( effectiveNode.isContent() ) {
			// This means that we're in a leaf node, like TextNode
			// those don't read the directionality properly, we will
			// have to climb up the parentage chain until we find a
			// wrapping node like paragraph or list item, etc.
			effectiveNode = effectiveNode.parent;
		}
	}

	return effectiveNode.$element.css( 'direction' );
};
