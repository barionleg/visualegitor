/*!
 * VisualEditor DataModel TreeCursor class
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

// TODO identify a core of "trusted" code that is guaranteed to detect tree invalidation.
// Probably needs: removeNode insertNode removeText insertText

/**
 * DataModel TreeCursor - a tree walker that tracks the path to the current position.
 *
 * @class
 *
 * @constructor
 * @param {ve.dm.Node} root A document node or a branch root within which to walk
 * @param {ve.dm.Node[]} liveIgnoreNodes Live array of nodes to ignore (cross without counting)
 */
ve.dm.TreeCursor = function VeDmTreeCursor( root, liveIgnoreNodes ) {
	this.root = root;
	this.liveIgnoreNodes = liveIgnoreNodes;
	this.path = [];
	this.offset = 0;
	this.nodes = [ root ];
	this.node = root;
	this.lastStep = null;
};

/* Inheritance */

OO.initClass( ve.dm.TreeCursor );

/* Methods */

/**
 * Skip past nodes in the liveIgnoreNodes list
 */
ve.dm.TreeCursor.prototype.skipIgnored = function () {
	var len = ( this.node && this.node.children && this.node.children.length ) || 0;
	while (
		this.offset < len &&
		this.liveIgnoreNodes.indexOf( this.node.children[ this.offset ] ) !== -1
	) {
		this.offset++;
	}
};

/**
 * Skip past ignored nodes and text node boundaries
 *
 * @param {number} [tooShort] Only step into text nodes longer than this
 */
ve.dm.TreeCursor.prototype.normalize = function ( tooShort ) {
	var len, item;
	if ( !this.node ) {
		return;
	}
	if ( tooShort === undefined ) {
		tooShort = -1;
	}
	// If at the end of a text node, step out
	if ( this.node instanceof ve.dm.TextNode && this.offset === this.node.length ) {
		this.nodes.pop();
		this.node = this.nodes[ this.nodes.length - 1 ];
		this.offset = this.path.pop() + 1;
		return;
	}
	// Cross any ignored nodes
	len = ( this.node && this.node.hasChildren() && this.node.children.length ) || 0;
	while (
		this.offset < len &&
		( item = this.node.children[ this.offset ] ) &&
		this.liveIgnoreNodes.indexOf( item ) !== -1
	) {
		this.offset++;
	}
	// If at the start of long enough text node, step in
	if (
		this.node.hasChildren() &&
		( item = this.node.children[ this.offset ] ) &&
		item instanceof ve.dm.TextNode &&
		item.length > tooShort
	) {
		this.node = item;
		this.nodes.push( item );
		this.path.push( this.offset );
		this.offset = 0;
	}
};

/**
 * Take a single step in the walk, consuming no more than a given linear model length
 *
 * A "single step" means either stepping across text content, or stepping over a node, or
 * steping into/out of a non-text node. (Steps into/out of text nodes happen transparently)
 *
 * See https://phabricator.wikimedia.org/T162762 for the algorithm
 *
 * @param {number} maxLength Maximum linear model length to step over (integer >= 1)
 * @return {Object|undefined} The type of step taken, or undefined if there are no more steps
 * @return {string} return.type open|close|cross|crosstext
 * @return {number} length Linear length of the step (integer >= 1)
 * @return {number[]} path The offset path from the root to the node containing the stepped item
 * @return {ve.dm.Node|null} node The node containing the stepped item
 * @return {number} offset The offset of the stepped item within its parent
 * @return {number} [offsetLength] Number of children 'cross' passed (1 unless inside a text node)
 * @return {ve.dm.Node} [item] The node stepped into/out of/across (absent for text 'cross')
 */
ve.dm.TreeCursor.prototype.stepAtMost = function ( maxLength ) {
	var childLength, item, step, length;
	if ( !this.node ) {
		this.lastStep = undefined;
		return undefined;
	}
	this.normalize( maxLength );
	if ( this.node instanceof ve.dm.TextNode ) {
		// We cannot be the end, because we just normalized
		length = Math.min( maxLength, this.node.length - this.offset );
		step = {
			type: 'crosstext',
			length: length,
			path: this.path.slice(),
			node: this.node,
			offset: this.offset,
			offsetLength: length
		};
		this.offset += step.length;
		this.lastStep = step;
		return step;
	}
	// Else not a text node
	childLength = this.node.hasChildren() ? this.node.children.length : 0;
	if ( this.offset > childLength ) {
		throw new Error( 'Offset ' + this.offset + ' > childLength ' + childLength );
	}
	if ( this.offset === childLength ) {
		return this.stepOut();
	}
	// Else there are unpassed child nodes
	item = this.node.children[ this.offset ];
	if ( item.getOuterLength() > maxLength ) {
		return this.stepIn();
	}
	// Else step across this item
	step = {
		type: 'cross',
		length: item.getOuterLength(),
		path: this.path.slice(),
		node: this.node,
		offset: this.offset,
		offsetLength: 1,
		item: item
	};
	this.offset++;
	this.lastStep = step;
	return step;
};

/**
 * Adjust own position to account for an insertion/deletion
 *
 * @param {number[]} path The path to the node in which the insertion/deletion occurs
 * @param {number} offset The offset at which the insertion/deletion occurs
 * @param {number} adjustment The number of nodes inserted (if > 0) or deleted (if < 0)
 */
ve.dm.TreeCursor.prototype.adjustPath = function ( path, offset, adjustment ) {
	var i, len;
	if ( this.path.length < path.length ) {
		// Adjusted node is deeper than own position, so cannot contain it
		return;
	}
	len = path.length;
	for ( i = 0; i < len; i++ ) {
		if ( this.path[ i ] !== path[ i ] ) {
			// Own position does not lie within the adjusted node
			return;
		}
	}

	// Temporarily push offset onto path to simplify the logic
	this.path.push( this.offset );
	if ( this.path[ len ] > offset || (
		adjustment > 0 && this.path[ len ] === offset
	) ) {
		// Own position lies after the adjustment
		if ( this.path[ len ] + adjustment < offset ) {
			throw new Error( 'Cursor lies within deleted range' );
		}
		this.path[ len ] += adjustment;
	}
	// Restore offset
	this.offset = this.path.pop();
};

/**
 * Step into the next node
 *
 * @return {Object} The step
 */
ve.dm.TreeCursor.prototype.stepIn = function () {
	var item, step;
	if (
		this.node instanceof ve.dm.TextNode ||
		!this.node.hasChildren() ||
		this.offset >= this.node.children.length
	) {
		throw new Error( 'No node to step into' );
	}
	item = this.node.children[ this.offset ];
	step = {
		type: 'open',
		length: item instanceof ve.dm.TextNode ? 0 : 1,
		path: this.path.slice(),
		node: this.node,
		offset: this.offset,
		item: item
	};
	this.path.push( this.offset );
	this.nodes.push( item );
	this.node = item;
	this.offset = 0;
	this.lastStep = step;
	return step;
};

/**
 * Step out of the current node (skipping past any uncrossed children or text within)
 * @return {Object} The step
 */
ve.dm.TreeCursor.prototype.stepOut = function () {
	var item, step;
	item = this.nodes.pop();
	this.node = this.nodes[ this.nodes.length - 1 ];
	this.offset = this.path.pop();
	if ( this.node === undefined ) {
		// Stepped out of the root
		this.lastStep = undefined;
		return undefined;
	}
	step = {
		type: 'close',
		length: item instanceof ve.dm.TextNode ? 0 : 1,
		path: this.path.slice(),
		node: this.node,
		offset: this.offset,
		item: item
	};
	this.offset++;
	this.lastStep = step;
	return step;
};

/*!
 * VisualEditor DataModel TreeModifier class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel tree modifier.
 *
 * This class applies operations from a transaction to the document tree, after the linear model
 * has already been updated.
 *
 * NOTE: Instances of this class are not recyclable: you can only call .process() on them once.
 *
 * @class
 * @param {ve.dm.Document} doc Document
 * @param {ve.dm.Transaction} transaction Transaction
 * @constructor
 */
ve.dm.TreeModifier = function VeDmTreeModifier( doc, transaction ) {
	// Properties
	this.document = doc;
	this.transaction = transaction;
	this.operations = transaction.getOperations();
	this.deletions = [];
	this.insertions = [];
	this.remover = new ve.dm.TreeCursor( doc.getDocumentNode(), this.insertions );
	this.inserter = new ve.dm.TreeCursor( doc.getDocumentNode(), this.deletions );
};

/**
 * The top level method: modify the tree according to the transaction
 */
ve.dm.TreeModifier.prototype.process = function () {
	var i, iLen, op, retainLength, j, jLen;
	for ( i = 0, iLen = this.operations.length; i < iLen; i++ ) {
		op = this.operations[ i ];
		if ( op.type === 'retain' ) {
			retainLength = op.length;
			while ( retainLength > 0 ) {
				retainLength -= this.processRetain( retainLength );
			}
		} else if ( op.type === 'replace' ) {
			for ( op.remove, j = 0, jLen = op.remove.length; j < jLen; j++ ) {
				this.processRemove( op.remove[ j ] );
			}
			for ( j = 0, jLen = op.insert.length; j < jLen; j++ ) {
				this.processInsert( op.insert[ j ] );
			}
		}
		// Else do nothing
	}
	this.processImplicitFinalRetain();
	this.applyDeletions();
};

/**
 * Retain to the end of the content
 */
ve.dm.TreeModifier.prototype.processImplicitFinalRetain = function () {
	// Pretend there is an implicit retain to the end of the document
	// TODO: fix our tests so this is unnecessary, then actually check for exhaustion
	var node, retainLength, item;
	while ( true ) {
		node = this.remover.node;
		if ( !node || (
			node === this.remover.root &&
			this.remover.offset === node.children.length
		) ) {
			return;
		}
		if ( node instanceof ve.dm.TextNode ) {
			retainLength = Math.max( 1, node.length - this.remover.offset );
		} else if ( !node.hasChildren() ) {
			retainLength = 1;
		} else {
			item = node.children[ this.remover.offset ];
			retainLength = item ? item.getOuterLength() : 1;
		}
		this.processRetain( retainLength );
	}
};

ve.dm.TreeModifier.prototype.applyDeletions = function () {
	var i, node, parent, idx, pre, post,
		// Clone to avoid really obscure debugging issues if splice calls back into
		// TreeModifier somehow (at the time of writing that's impossible but hey)
		deletions = this.deletions.slice();
	// Delete in reverse order, to handle nested deletions acceptably
	for ( i = deletions.length - 1; i >= 0; i-- ) {
		node = deletions[ i ];
		parent = node.parent;
		idx = parent.children.indexOf( node );
		parent.splice( idx, 1 );
		pre = parent.children[ idx - 1 ];
		post = parent.children[ idx ];
		if (
			pre instanceof ve.dm.TextNode &&
			post instanceof ve.dm.TextNode &&
			deletions.indexOf( pre ) === -1
		) {
			parent.splice( idx, 1 );
			pre.adjustLength( post.length );
		}
	}
};

/**
 * Step the inserter into a text node if one exists at this offset; else create one and step in
 */
ve.dm.TreeModifier.prototype.ensureTextNode = function () {
	var node = this.inserter.node;
	if ( node instanceof ve.dm.TextNode ) {
		return;
	}
	if ( !node.hasChildren() ) {
		throw new Error( 'Cannot ensureTextNode in childless node' );
	}
	if ( node.children[ this.inserter.offset ] instanceof ve.dm.TextNode ) {
		// do nothing
	} else if ( node.children[ this.inserter.offset - 1 ] instanceof ve.dm.TextNode ) {
		this.inserter.offset--;
	} else {
		this.insertNode( new ve.dm.TextNode() );
	}
	if ( this.cursorsMatch() ) {
		this.remover.stepIn();
	}
	this.inserter.stepIn();
};

ve.dm.TreeModifier.prototype.ensureNotTextNode = function () {
	var node = this.inserter.node,
		offset = this.inserter.offset;
	if ( !( node instanceof ve.dm.TextNode ) ) {
		return;
	}
	this.inserter.stepOut();
	if ( offset === 0 ) {
		// Position the cursor before the text node
		this.inserter.offset--;
		return;
	}
	if ( offset < node.length ) {
		// Split the node
		node.adjustLength( offset - this.inserter.node.length );
		this.insertNode( new ve.dm.TextNode() );
		this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
	}
};

/**
 * Remove the node at the remove cursor, without moving the cursor
 *
 * Joins text nodes automatically as appropriate
 *
 * @return {ve.dm.Node} The node being returned
 */
ve.dm.TreeModifier.prototype.removeNode = function () {
	var node = this.remover.node.splice( this.remover.offset, 1 )[ 0 ];
	this.inserter.adjustPath( this.inserter.path, this.inserter.offset, -1 );
	// TODO: text nodes?
	return node;
};

/**
 * Insert a node at the insert cursor, without moving the cursor
 *
 * Splits text nodes automatically as appropriate
 *
 * @param {ve.dm.Node} node The node to insert
 */
ve.dm.TreeModifier.prototype.insertNode = function ( node ) {
	this.ensureNotTextNode();
	// TODO deal with text splits
	this.inserter.node.splice( this.inserter.offset, 0, node );
	this.insertions.push( node );
	this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
};

/**
 * Test whether both pointers are in the same node
 *
 * @return {boolean} True if the paths are identical
 */
ve.dm.TreeModifier.prototype.pathsMatch = function () {
	return this.remover.node && this.remover.node === this.inserter.node;
};

/**
 * Test whether both pointers point to the same location
 *
 * @return {boolean} True if the paths and offsets are identical
 */
ve.dm.TreeModifier.prototype.cursorsMatch = function () {
	return this.pathsMatch() && this.remover.offset === this.inserter.offset;
};

/**
 * Process the retention of content passed by one step of the remover
 *
 * @param {number} maxLength The maximum amount of content to retain
 * @return {number} The amount of content retained
 */
ve.dm.TreeModifier.prototype.processRetain = function ( maxLength ) {
	var removerStep, inserterStep,
		remover = this.remover,
		inserter = this.inserter;

	remover.normalize();
	inserter.normalize();
	if ( this.cursorsMatch() ) {
		// Pointers are in the same location, so advance them together.
		// This is the only way both pointers can ever enter the same node;
		// in any other case, a node entered at an 'open' tag by one pointer
		// is marked as either as a deletion or a creation, so the other
		// pointer will not follow.
		removerStep = remover.stepAtMost( maxLength );
		inserterStep = inserter.stepAtMost( maxLength );
		if ( !removerStep || !inserterStep ) {
			throw new Error( 'Remover or inserter past end' );
		}
		if ( removerStep.length !== inserterStep.length ) {
			throw new Error( 'Remover and inserter unexpectedly diverged' );
		}
		return removerStep.length;
	}
	// Else pointers are not in the same location (in fact they cannot lie in the
	// same node)
	removerStep = remover.stepAtMost( maxLength, true );
	if ( removerStep.type === 'crosstext' ) {
		this.moveLastCrossText();
	} else if ( removerStep.type === 'cross' ) {
		this.moveLast();
	} else if ( removerStep.type === 'open' ) {
		this.cloneLastOpen();
		this.inserter.stepIn();
		this.deletions.push( removerStep.item );
	} else if ( removerStep.type === 'close' ) {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		inserterStep = inserter.stepOut();
		// TODO check the steps match
	}
	return removerStep.length;
};

/**
 * Process the removal of one item
 *
 * @param {string|Array|Object} item The item to remove
 */
ve.dm.TreeModifier.prototype.processRemove = function () {
	var step = this.remover.stepAtMost( 1 );
	// TODO: verify item matches the step
	if ( step.type === 'crosstext' ) {
		this.removeLastCrossText();
	} else if ( step.type === 'cross' ) {
		this.removeLast();
	} else if ( step.type === 'open' ) {
		this.deletions.push( step.item );
	}
	// Else step.type === 'close': do nothing
};

/**
 * Process the insertion of one item
 *
 * @param {string|Array|Object} item The item to insert
 */
ve.dm.TreeModifier.prototype.processInsert = function ( item ) {
	var type = item.type ? ( item.type.startsWith( '/' ) ? 'close' : 'open' ) : 'crosstext',
		inserter = this.inserter;
	if ( type === 'open' ) {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		this.create( item );
		inserter.stepIn();
	} else if ( type === 'crosstext' ) {
		// TODO: verify the content?
		this.insertText( 1 );
	} else if ( type === 'close' ) {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		inserter.stepOut();
	}
};

/**
 * Clone the node just opened by the remover, and insert it at the inserter
 */
ve.dm.TreeModifier.prototype.cloneLastOpen = function () {
	var node,
		step = this.remover.lastStep;
	if ( step.type !== 'open' ) {
		throw new Error( 'Expected step of type open, not ' + step.type );
	}
	node = ve.dm.nodeFactory.createFromElement( step.item.getClonedElement() );
	if ( this.inserter.node instanceof ve.dm.TextNode ) {
		this.inserter.stepOut();
	}
	// This will crash if not a BranchNode (showing the tx is invalid)
	this.insertNode( node );
};

/**
 * Remove the node just crossed or closed by the remover
 *
 * @return {ve.dm.Node} The removed node
 */
ve.dm.TreeModifier.prototype.removeLast = function () {
	var step = this.remover.lastStep;
	if ( step.type !== 'cross' && step.type !== 'close' ) {
		throw new Error( 'Expected step of type cross/close, not ' + step.type );
	}
	this.remover.offset--;
	return this.removeNode();
};

/**
 * Remove the text just crossed or closed by the remover
 */
ve.dm.TreeModifier.prototype.removeLastCrossText = function () {
	var pathsMatch,
		step = this.remover.lastStep,
		length = step.length,
		node = this.remover.node,
		offset = this.remover.offset;
	if ( step.type !== 'crosstext' ) {
		throw new Error( 'Expected step of type crosstext, not ' + step.type );
	}
	this.remover.offset -= length;

	this.inserter.normalize();
	pathsMatch = this.pathsMatch();
	if ( pathsMatch ) {
		if ( this.inserter.offset >= offset + length ) {
			this.inserter.offset -= length;
		} else if ( this.inserter.offset > offset ) {
			throw new Error( 'Inserter lies in the removed range' );
		}
	}
	node.adjustLength( -length );
	if ( node.length === 0 ) {
		// Remove empty text node
		if ( pathsMatch ) {
			this.inserter.stepOut();
			this.inserter.offset--;
		}
		this.remover.stepOut();
		this.remover.offset--;
		this.removeNode();
	}
};

/**
 * Move the text crossed at the remover's last step to the inserter
 */
ve.dm.TreeModifier.prototype.moveLastCrossText = function () {
	var step = this.remover.lastStep;
	if (
		this.remover.node === this.inserter.node &&
		this.remover.offset < this.inserter.offset
	) {
		throw new Error( 'Ambiguous text move within the same node' );
	}
	this.removeLastCrossText();
	this.insertText( step.offsetLength );
};

/**
 * Remove the text node containing the remover, if it is empty
 */
ve.dm.TreeModifier.prototype.removeTextNodeIfEmpty = function () {
	if ( !( this.remover.node instanceof ve.dm.TextNode ) ) {
		throw new Error( 'Expected text node' );
	}
	if ( this.remover.node.length > 0 ) {
		return;
	}
	// Remove empty text node, and step the cursor(s) out
	if ( this.pathsMatch() ) {
		this.inserter.stepOut();
		this.inserter.offset--;
	}
	this.remover.stepOut();
	this.remover.offset--;
	this.removeNode();
};

/**
 * Move the content crossed at the remover's last step to the inserter
 */
ve.dm.TreeModifier.prototype.moveLast = function () {
	this.insertNode( this.removeLast() );
	this.inserter.offset++;
};

ve.dm.TreeModifier.prototype.insertText = function ( length ) {
	var pathsMatch;
	this.ensureTextNode();
	pathsMatch = this.pathsMatch();
	if ( pathsMatch && this.inserter.offset > this.remover.offset ) {
		throw new Error( 'Cannot insert ahead of remover in same text node' );
	}
	this.inserter.node.adjustLength( length );
	if ( pathsMatch && this.remover.offset >= this.inserter.offset ) {
		// Advance the remover if it is at the inserter or past it
		this.remover.offset += length;
	}
	this.inserter.offset += length;
};

/**
 * Create an item and attach it at the inserter (without moving the cursor)
 *
 * @param {string|Array|Object} item Linear model item (but not a close tag)
 */
ve.dm.TreeModifier.prototype.create = function ( item ) {
	var node;
	if ( !item.type ) {
		// Item is text
		this.ensureTextNode();
		this.inserter.node.adjustLength( 1 );
		this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
	} else {
		node = ve.dm.nodeFactory.createFromElement( item );
		if ( this.inserter.node instanceof ve.dm.TextNode ) {
			if (
				this.cursorsMatch() &&
				this.remover.offset === this.remover.node.length
			) {
				this.remover.stepOut();
			}
			this.inserter.stepOut();
		}
		this.insertNode( node );
	}
};
