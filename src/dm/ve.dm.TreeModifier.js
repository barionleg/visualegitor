/*!
 * VisualEditor DataModel TreeCursor class
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel TreeCursor - a tree walker that tracks the path to the current position.
 *
 * @class
 *
 * @constructor
 * @param {ve.dm.Node} root A document node or a branch root within which to walk
 */
ve.dm.TreeCursor = function VeDmTreeCursor( root ) {
	this.path = [];
	this.offset = 0;
	this.nodes = [ root ];
	this.node = root;
	this.lastStep = null;
};

/* Inheritance */

OO.initClass( ve.dm.TreeCursor );

/* Static Methods */

ve.dm.TreeCursor.static.getChildLength = function ( node ) {
	if ( node instanceof ve.dm.TextNode ) {
		return node.length;
	}
	if ( !node.hasChildren() ) {
		return 0;
	}
	return node.children.length;
};

/* Methods */

/**
 * Take a single step in the walk, consuming no more than a given linear model length
 *
 * A "single step" means either stepping into a node, or stepping out of a node, or stepping
 * over a node, or stepping across text content inside a text node.
 *
 * See https://phabricator.wikimedia.org/T162762
 *
 * @param {number} maxLength Maximum linear model length to step over (integer >= 1)
 * @return {Object|undefined} The type of step taken, or undefined if there are no more steps
 * @return {string} return.type open|close|cross
 * @return {number} length Linear length of the step (integer >= 1, or 0 for open/close text node)
 * @return {number[]} path The offset path from the root to the node containing the stepped item
 * @return {ve.dm.Node|null} node The node containing the stepped item
 * @return {number} offset The offset of the stepped item within its parent
 * @return {number} [offsetLength] Number of children 'cross' passed (1 unless inside a text node)
 * @return {ve.dm.Node} [item] The node stepped into/out of/across (absent for text 'cross')
 */
ve.dm.TreeCursor.prototype.advanceAtMost = function ( maxLength ) {
	var childLength, item, step, length;
	if ( !this.node ) {
		return this.lastStep = undefined;
	}
	childLength = this.constructor.static.getChildLength( this.node );
	// Step across and ignore any newly-created nodes immediately ahead.
	// They must have been created by the other pointer, so we must be the trailing
	// pointer, so we can clear the newly-created flag
	while (
		this.offset < childLength &&
		this.node.children &&
		this.node.children[ this.offset ].isNew
	) {
		this.node.children[ this.offset ].isNew = false;
		this.offset++;
	}

	if ( this.offset === childLength ) {
		return this.stepOut();
	}
	if ( this.node instanceof ve.dm.TextNode ) {
		length = Math.min( maxLength, this.node.length - this.offset );
		step = {
			type: 'cross',
			length: length,
			path: this.path.slice(),
			node: this.node,
			offset: this.offset,
			offsetLength: length
		};
		this.offset += step.length;
		return this.lastStep = step;
	}
	// Else there are unpassed child nodes
	item = this.node.children[ this.offset ];
	if ( item.getOuterLength() > maxLength ) {
		// step in
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
		return this.lastStep = step;
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
	return this.lastStep = step;
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
	if ( this.path[ len ] > offset ) {
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
 * #advanceAtMost( 1 ) that asserts the step type is 'open'
 * @return {Object} The step
 */
ve.dm.TreeCursor.prototype.stepIn = function () {
	var step = this.advanceAtMost( 1 );
	if ( step.type !== 'open' ) {
		throw new Error( 'Expected an open tag' );
	}
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
		return this.lastStep = undefined;
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
	return this.lastStep = step;
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
	this.remover = new ve.dm.TreeCursor( doc.getDocumentNode() );
	this.inserter = new ve.dm.TreeCursor( doc.getDocumentNode() );
	// remover position - inserter position
	// TODO: maintain this properly in process*
	this.difference = NaN;
};

ve.dm.TreeModifier.prototype.modify = function () {
	var i, len, op;
	for ( i = 0, len = this.operations.length; i < len; i++ ) {
		op = this.operations[ i ];
		if ( op.type === 'retain' ) {
			this.processRetain( op.length );
		} else if ( op.type === 'replace' ) {
			this.processRemove( op.remove );
			this.processInsert( op.insert );
		}
		// Else do nothing
	}
};

ve.dm.TreeModifier.prototype.pointersMatch = function () {
	var i, len,
		rp = this.remover.path,
		ip = this.inserter.path;
	if ( rp.length !== ip.length ) {
		return false;
	}
	for ( i = 0, len = rp.length; i < len; i++ ) {
		if ( rp[ i ] !== ip[ i ] ) {
			return false;
		}
	}
	return this.remover.offset === this.inserter.offset;
};

ve.dm.TreeModifier.prototype.processRetain = function ( length ) {
	var step, inserterStep,
		remover = this.remover,
		inserter = this.inserter;
	while ( length > 0 ) {
		if ( this.pointersMatch() ) {
			// Pointers are in the same location, so advance them in step over the
			// retained content
			step = remover.advanceAtMost( length );
			inserterStep = inserter.advanceAtMost( length );
			if ( step.length !== inserterStep.length ) {
				throw new Error( 'remover and inserter unexpectedly diverged' );
			}
			length -= step.length;
			continue;
		}
		// Else pointers are not in the same location (in fact they cannot lie in the
		// same node)
		step = remover.advanceAtMost( length, true );
		if ( step.type === 'cross' ) {
			// TODO: maybe this can work even when the cursors are in the same place
			this.moveLast();
		} else if ( step.type === 'open' ) {
			// XXX can the inserter ever get in here? If it does, here isn't removable
			if ( inserter.item === step.item ) {
				inserterStep = inserter.stepIn();
				delete inserterStep.item.kill;
			} else {
				this.cloneOpen();
				step.item.kill = true;
			}
		} else if ( step.type === 'close' ) {
			inserter.stepOut(); // Might orphan stuff
			// Ensure consistency with respect to text nodes
			if (
				!( step.item instanceof ve.dm.TextNode ) &&
				( inserter.lastStep.item instanceof ve.dm.TextNode )
			) {
				inserter.stepOut();
			}
			if ( step.item.kill ) {
				this.removeLast();
			}
		}
		length -= step.length;
	}
};

ve.dm.TreeModifier.prototype.processRemove = function ( data ) {
	var i, len, step;
	for ( i = 0, len = data.length; i < len; i++ ) {
		while ( true ) {
			step = this.remover.advanceAtMost( 1 );
			// TODO: verify data[ i ] matches the step
			if ( step.type === 'cross' ) {
				this.removeLast();
			} else if ( step.type === 'open' ) {
				step.item.kill = true;
			} else if ( step.type === 'close' ) {
				if ( step.node.kill ) {
					this.removeLast();
				}
			}
			if ( step.length === 1 ) {
				break;
			}
		}
	}
};

ve.dm.TreeModifier.prototype.processInsert = function ( data ) {
	var i, len, item, type;
	for ( i = 0, len = data.length; i < len; i++ ) {
		item = data[ i ];
		type = item.type ? ( item.type.startsWith( '/' ) ? 'close' : 'open' ) : 'cross';
		if ( type === 'open' ) {
			this.create( item );
			this.inserter.stepIn();
		} else if ( type === 'cross' ) {
			this.create( item );
			if ( this.pointersMatch() ) {
				this.remover.offset++;
			}
			this.inserter.offset++;
		} else if ( type === 'close' ) {
			// TODO: this orphans remaining children; need a way to kill them off
			this.inserter.stepOut();
		}
	}
};

ve.dm.TreeModifier.prototype.cloneOpen = function () {
	var node = this.remover.lastStep.node.getClonedElement();
	if ( this.inserter.node instanceof ve.dm.TextNode ) {
		this.inserter.stepOut();
	}
	// This will crash if not a BranchNode (showing the tx is invalid)
	this.inserter.node.splice( this.inserter.offset, 0, node );
	this.inserter.stepIn();
	this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
};

ve.dm.TreeModifier.prototype.removeLast = function () {
	var step = this.remover.lastStep,
		node = step.node;
	if ( step.type !== 'cross' && step.type !== 'close' ) {
		throw new Error( 'Expected step of type cross/close, not ' + step.type );
	}
	if ( node instanceof ve.dm.TextNode ) {
		node.adjustLength( -step.offsetLength );
		// TODO: What if it becomes zero length?
	} else {
		node.splice( step.offset, 1 );
	}
	this.remover.offset = step.offset;
	this.inserter.adjustPath( this.remover.path, this.remover.offset, -step.offsetLength );
};

/**
 * Move the content crossed at the remover's last step to the inserter
 */
ve.dm.TreeModifier.prototype.moveLast = function () {
	var node,
		remover = this.remover,
		inserter = this.inserter,
		step = remover.lastStep;
	if ( step.type !== 'cross' ) {
		throw new Error( 'Expected step of type cross, not ' + step.type );
	}
	if ( step.node instanceof ve.dm.TextNode ) {
		if ( !( inserter.node instanceof ve.dm.TextNode ) ) {
			inserter.node.splice(
				inserter.offset,
				0,
				new ve.dm.TextNode()
			);
			inserter.stepIn();
		}
		remover.node.adjustLength( -step.offsetLength );
		remover.offset -= step.offsetLength;
		if ( remover.node.getLength() === 0 ) {
			// Empty text node: remove
			remover.stepOut();
			remover.offset--;
			remover.node.splice( remover.offset, 1 );
			inserter.adjustPath( remover.path, remover.offset, -1 );
		}
		inserter.node.adjustLength( step.offsetLength );
		inserter.offset += step.offsetLength;
		// One pointer's adjustments cannot affect the other's path/offset; the
		// pointers are two distinct text nodes.
	} else {
		if ( inserter.node instanceof ve.dm.TextNode ) {
			inserter.stepOut();
		}
		node = step.node.splice( step.offset, 1 )[ 0 ];
		inserter.adjustPath( remover.path, step.offset, -1 );
		inserter.node.splice( inserter.offset, 0, node );
		remover.adjustPath( inserter.path, inserter.offset, 1 );
		// TODO: adjust ancestor offsets
	}
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
		if ( !( this.inserter.node instanceof ve.dm.TextNode ) ) {
			// TODO: what if the next node is a text node? Should we just step into it?
			this.inserter.node.splice(
				this.inserter.offset,
				0,
				new ve.dm.TextNode()
			);
			this.inserter.stepIn();
		}
		this.inserter.node.adjustLength( 1 );
	} else {
		node = ve.dm.nodeFactory.createFromElement( item );
		if ( this.inserter.node instanceof ve.dm.TextNode ) {
			if (
				this.pointersMatch() &&
				this.remover.offset === this.remover.node.length
			) {
				this.remover.stepOut();
			}
			this.inserter.stepOut();
		}
		this.inserter.node.splice( this.inserter.offset, 0, node );
	}
	this.remover.adjustPath( this.inserter.path, this.inserter.offset, 1 );
};
