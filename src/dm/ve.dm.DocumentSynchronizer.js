/*!
 * VisualEditor DataModel DocumentSynchronizer class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel document synchronizer.
 *
 * This object is a utility for collecting actions to be performed on the model tree in multiple
 * steps as the linear model is modified by a transaction processor and then processing those queued
 * actions when the transaction is done being processed.
 *
 * Ranges and offsets passed to this class refer to the linear model as it was before the
 * transaction was processed.
 *
 * @class
 * @constructor
 * @param {ve.dm.Document} doc Document to synchronize
 * @param {ve.dm.Transaction} transaction The transaction being synchronized for
 * @param {boolean} isStaging Transaction is being applied in staging mode
 */
ve.dm.DocumentSynchronizer = function VeDmDocumentSynchronizer( doc, transaction, isStaging ) {
	// Properties
	this.document = doc;
	this.actionQueue = [];
	this.eventQueue = [];
	this.adjustment = 0;
	this.transaction = transaction;
	this.isStaging = isStaging;
};

/* Static Properties */

/**
 * Synchronization methods.
 *
 * Each method is specific to a type of action. Methods are called in the context of a document
 * synchronizer, so they work similar to normal methods on the object.
 *
 * @static
 * @property
 */
ve.dm.DocumentSynchronizer.synchronizers = {};

/* Static Methods */

/**
 * Synchronize an annotation action.
 *
 * This method is called within the context of a document synchronizer instance.
 *
 * @static
 * @method
 * @param {Object} action
 * @param {ve.Range} action.range
 */
ve.dm.DocumentSynchronizer.synchronizers.annotation = function ( action ) {
	// Queue events for all leaf nodes covered by the range
	var i,
		adjustedRange = action.range,
		selection = this.document.selectNodes( adjustedRange, 'leaves' );
	for ( i = 0; i < selection.length; i++ ) {
		// No tree synchronization needed
		// Queue events
		this.queueEvent( selection[ i ].node, 'annotation' );
		this.queueEvent( selection[ i ].node, 'update', this.isStaging );
	}
};

/**
 * Synchronize an attribute change action.
 *
 * This method is called within the context of a document synchronizer instance.
 *
 * @static
 * @method
 * @param {Object} action
 * @param {ve.dm.Node} action.node
 * @param {string} action.key
 * @param {Mixed} action.from
 * @param {Mixed} action.to
 */
ve.dm.DocumentSynchronizer.synchronizers.attributeChange = function ( action ) {
	// No tree synchronization needed
	// Queue events
	this.queueEvent( action.node, 'attributeChange', action.key, action.from, action.to );
	this.queueEvent( action.node, 'update', this.isStaging );
};

/**
 * Synchronize a resize action.
 *
 * This method is called within the context of a document synchronizer instance.
 *
 * @static
 * @method
 * @param {Object} action
 * @param {ve.dm.TextNode} action.node
 * @param {number} action.adjustment
 */
ve.dm.DocumentSynchronizer.synchronizers.resize = function ( action ) {
	var node = action.node,
		parent = node.getParent();

	if ( parent && node.getType() === 'text' && node.getLength() + action.adjustment === 0 ) {
		// Auto-prune empty text nodes
		parent.splice( parent.indexOf( node ), 1 );
	} else {
		// Apply length change to tree
		// No update event needed, adjustLength causes an update event on its own
		// FIXME however, any queued update event will still be emitted, resulting in a duplicate
		node.adjustLength( action.adjustment );
	}
};

/**
 * Synchronize a text node insertion.
 *
 * This method is called within the context of a document synchronizer instance.
 *
 * @static
 * @method
 * @param {Object} action
 * @param {ve.dm.Node} action.parentNode
 * @param {number} action.index
 * @param {number} action.adjustment
 */
ve.dm.DocumentSynchronizer.synchronizers.insertTextNode = function ( action ) {
	var textNode = new ve.dm.TextNode();
	textNode.setLength( action.adjustment );
	action.parentNode.splice( action.index, 0, textNode );
};

/**
 * Synchronize a rebuild action.
 *
 * This method is called within the context of a document synchronizer instance.
 *
 * @static
 * @method
 * @param {Object} action
 * @param {ve.Range} action.range
 * @param {number} action.adjustment
 */
ve.dm.DocumentSynchronizer.synchronizers.rebuild = function ( action ) {
	// TODO consider if we want rebuilds to be node-based rather than range-based;
	// this seems scary with merged/overlapping rebuilds; we'd have to skip rebuilds
	// of already-rebuilt (detached) parents and somehow adjust child indexes when
	// the same parent is touched by multiple rebuilds
	// TODO also consider if TransactionProcessor and DocumentSynchronizer could be merged or
	// more tightly integrated such that tree sync is done on the fly rather than afterwards,
	var firstNode, parent, index, numNodes,
		// Find the nodes contained by the range
		adjustedRange = action.range,
		selection = this.document.selectNodes( adjustedRange, 'siblings' );

	// If the document is empty, selection[0].node will be the document (so no parent)
	// but we won't get indexInNode either. Detect this and use index=0 in that case.
	if ( 'indexInNode' in selection[ 0 ] || !selection[ 0 ].node.getParent() ) {
		// Insertion
		parent = selection[ 0 ].node;
		index = selection[ 0 ].indexInNode || 0;
		numNodes = 0;
	} else {
		// Rebuild
		firstNode = selection[ 0 ].node;
		parent = firstNode.getParent();
		index = selection[ 0 ].index;
		numNodes = selection.length;
	}
	// Perform rebuild in tree
	this.document.rebuildNodes( parent, index, numNodes, adjustedRange.from,
		adjustedRange.getLength() + action.adjustment
	);
};

/* Methods */

/**
 * Get the document being synchronized.
 *
 * @method
 * @return {ve.dm.Document} Document being synchronized
 */
ve.dm.DocumentSynchronizer.prototype.getDocument = function () {
	return this.document;
};

/**
 * Add an annotation action to the queue.
 *
 * This finds all leaf nodes covered wholly or partially by the given range, and emits annotation
 * events for all of them.
 *
 * @method
 * @param {ve.Range} range Range that was annotated
 */
ve.dm.DocumentSynchronizer.prototype.pushAnnotation = function ( range ) {
	this.actionQueue.push( {
		type: 'annotation',
		range: range
	} );
};

/**
 * Add an attribute change to the queue.
 *
 * This emits an attributeChange event for the given node with the provided metadata.
 *
 * @method
 * @param {ve.dm.Node} node Node whose attribute changed
 * @param {string} key Key of the attribute that changed
 * @param {Mixed} from Old value of the attribute
 * @param {Mixed} to New value of the attribute
 * @param {number} offset Start offset of node
 */
ve.dm.DocumentSynchronizer.prototype.pushAttributeChange = function ( node, key, from, to, offset ) {
	this.actionQueue.push( {
		type: 'attributeChange',
		range: new ve.Range( offset ),
		node: node,
		key: key,
		from: from,
		to: to
	} );
};

/**
 * Add a resize action to the queue.
 *
 * This changes the length of a text node.
 *
 * @method
 * @param {ve.dm.TextNode} node Node to resize
 * @param {number} adjustment Length adjustment to apply to the node
 * @param {ve.Range} nodeOuterRange Outer range of node
 */
ve.dm.DocumentSynchronizer.prototype.pushResize = function ( node, adjustment, nodeOuterRange ) {
	this.actionQueue.push( {
		type: 'resize',
		range: nodeOuterRange,
		node: node,
		adjustment: adjustment
	} );
};

/**
 * Add a text node insertion action to the queue.
 *
 * This inserts a new text node.
 *
 * @param {ve.dm.Node} parentNode Node to insert text node into
 * @param {number} index Index in parentNode to insert text node at
 * @param {number} length Length of new text node
 * @param {number} offset Offset to insert text node at
 */
ve.dm.DocumentSynchronizer.prototype.pushInsertTextNode = function ( parentNode, index, length, offset ) {
	this.actionQueue.push( {
		type: 'insertTextNode',
		range: new ve.Range( offset ),
		parentNode: parentNode,
		index: index,
		adjustment: length
	} );
};

/**
 * Add a rebuild action to the queue.
 *
 * When a range of data has been changed arbitrarily this can be used to drop the nodes that
 * represented that range and replace them with new nodes that represent the new data.
 *
 * This can also be used to build nodes for newly inserted data by passing in
 * a zero-length range at the start of the new data, and setting lengthChange to the length
 * of the new data.
 *
 * @method
 * @param {ve.Range} range Range of old nodes to be dropped
 * @param {number} lengthChange Difference between the length of the new data and the old data
 */
ve.dm.DocumentSynchronizer.prototype.pushRebuild = function ( range, lengthChange ) {
	this.actionQueue.push( {
		type: 'rebuild',
		range: range,
		adjustment: lengthChange
	} );
};

/**
 * Queue an event to be emitted on a node.
 *
 * This method is called by methods defined in {ve.dm.DocumentSynchronizer.synchronizers}.
 *
 * Duplicate events will be ignored only if all arguments match exactly. Hashes of each event that
 * has been queued are stored in the nodes they will eventually be fired on.
 *
 * @method
 * @param {ve.dm.Node} node
 * @param {string} event Event name
 * @param {...Mixed} [args] Additional arguments to be passed to the event when fired
 */
ve.dm.DocumentSynchronizer.prototype.queueEvent = function ( node ) {
	// Check if this is already queued
	var
		args = Array.prototype.slice.call( arguments, 1 ),
		hash = OO.getHash( args );

	if ( !node.queuedEventHashes ) {
		node.queuedEventHashes = {};
	}
	if ( !node.queuedEventHashes[ hash ] ) {
		node.queuedEventHashes[ hash ] = true;
		this.eventQueue.push( {
			node: node,
			args: args.concat( this.transaction )
		} );
	}
};

/**
 * Synchronize node tree using queued actions.
 *
 * This method uses the static methods defined in {ve.dm.DocumentSynchronizer.synchronizers} and
 * calls them in the context of {this}.
 *
 * After synchronization is complete all queued events will be emitted. Hashes of queued events that
 * have been stored on nodes are removed from the nodes after the events have all been emitted.
 *
 * This method also clears both action and event queues.
 *
 * @method
 */
ve.dm.DocumentSynchronizer.prototype.synchronize = function () {
	var i, j, action, nextAction, event;

	// Sort the action queue by start offset, and break ties by reverse end offset
	this.actionQueue.sort( function ( a, b ) {
		return a.range.start !== b.range.start ?
			a.range.start - b.range.start :
			b.range.end - a.range.end;
	} );

	// TODO what if nextAction touches action? At least in the case of two adjacent zero-length
	// rebuilds we have to either merge them or guarantee that they won't be misordered

	// Collapse any actions nested inside of rebuild actions
	for ( i = 0; i < this.actionQueue.length; i++ ) {
		action = this.actionQueue[ i ];
		if ( !Object.prototype.hasOwnProperty.call( ve.dm.DocumentSynchronizer.synchronizers, action.type ) ) {
			throw new Error( 'Invalid action type ' + action.type );
		}
		// If action.type is:
		// - 'annotation', then we can leave it alone, it doesn't interfere with anything else;
		//    it might emit annotate events on some nodes that were just rebuilt, but because they're
		//    freshly rebuilt nodes nobody can be listening for events on them anyway;
		// - 'attributeChange' or 'insertTextNode', then nothing can be inside it because it's zero-length;
		// - 'rebuild', then just about anything could be inside it, but can be merged in
		// - 'resize', then a zero-length rebuild could be "inside" it (coincide with the start)
		//   or a rebuild could overlap with it precisely (rebuilding the same text node that's
		//   being resized), and in both cases we can merge the resize and the rebuild into a rebuild;
		//   apart from those cases and 'annotation' actions (which we can leave alone), nothing else
		//   can be inside a resize.
		if ( action.type !== 'rebuild' && action.type !== 'resize' ) {
			continue;
		}

		for ( j = i + 1; j < this.actionQueue.length; j++ ) {
			nextAction = this.actionQueue[ j ];
			if ( nextAction.range.start >= action.range.end ) {
				break;
			}

			// If nextAction is entirely contained within action, then:
			// - if its type is 'annotate' then we leave it alone, see above
			// - if its type is 'attributeChange or 'insertTextNode' then we remove it
			// - if its type is 'resize' or 'rebuild', then we merge it with action
			// If nextAction partially overlaps with action and continues past it, then:
			// - it can't be zero-length, so its type can't be 'attributeChange' or 'insertTextNode';
			// - it can't be a 'resize' because a rebuild can't end in the middle of a text node;
			// - if it's an 'annotate' then we leave it alone, see above
			// - if it's a 'rebuild' then we merge it with action
			// In conclusion, we leave nextAction alone if it's an 'annotate', and merge it in
			// if it's anything else.
			if ( nextAction.type !== 'annotate' ) {
				// Add in nextAction's adjustment, if any
				action.adjustment += nextAction.adjustment || 0;
				// Merge the ranges
				action.range = ve.Range.static.newCoveringRange( action.range, nextAction.range );
				// Force the merged action to be a rebuild if it was previously a resize
				action.type = 'rebuild';
				// Remove nextAction
				this.actionQueue.splice( j, 1 );
				j--;
			}
		}
	}

	// Execute the actions in the queue
	for ( i = 0; i < this.actionQueue.length; i++ ) {
		action = this.actionQueue[ i ];
		// action.range is based on the pre-modification data and tree, adjust it for things we have synchronized
		// thus far
		action.range = action.range.translateRange( this.adjustment );
		ve.dm.DocumentSynchronizer.synchronizers[ action.type ].call( this, action );
		this.adjustment += action.adjustment;
	}
	// Emit events in the event queue
	for ( i = 0; i < this.eventQueue.length; i++ ) {
		event = this.eventQueue[ i ];
		event.node.emit.apply( event.node, event.args );
		delete event.node.queuedEventHashes;
	}
	// Clear queues
	this.actionQueue = [];
	this.eventQueue = [];
};
