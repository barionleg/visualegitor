/*!
 * VisualEditor annotated text content state class
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Annotated text content state (a snapshot of node content)
 *
 * @class
 *
 * @constructor
 * @param {Node} element Element whose content is to be snapshotted
 */
ve.ce.TextState = function VeCeTextState( element ) {
	/**
	 * @property {ve.ce.TextStateChunk[]|null} chunks Linearized annotated text content
	 */
	this.chunks = this.constructor.static.getChunks( element );
};

/* Inheritance */

OO.initClass( ve.ce.TextState );

/* Static methods */

/**
 * Saves a snapshot of the current text content state
 *
 * @param {Node} element Element whose content is to be snapshotted
 * @return {ve.ce.TextStateChunk[]} chunks
 */
ve.ce.TextState.static.getChunks = function ( element ) {
	var $node, viewNode,
		node = element,
		// Stack of tag-lists in force; each tag list is equal to its predecessor extended
		// by one tag. This means two chunks have object-equal tag lists if they have the
		// same tag elements in force (i.e. if their text nodes are DOM siblings).
		tagListStack = [ [] ],
		stackTop = 0,
		annotationStack = [],
		chunks = [];

	/**
	 * Add to chunks, merging content with the same tags/type into the same chunk
	 *
	 * @param {string} text Plain text
	 * @param {string} [type] If this is a unicorn then 'unicorn', else 'text' (default)
	 */
	function add( text, type ) {
		if (
			!chunks.length ||
			chunks[ chunks.length - 1 ].tags !== tagListStack[ stackTop ] ||
			chunks[ chunks.length - 1 ].type !== type
		) {
			chunks.push( new ve.ce.TextStateChunk(
				text,
				tagListStack[ stackTop ],
				type || 'text'
			) );
		} else {
			chunks[ chunks.length - 1 ].text += text;
		}
	}

	while ( true ) {
		// Process node
		// If appropriate, step into first child and loop
		// If no next sibling, step out until there is (breaking if we leave element)
		// Step to next sibling and loop
		$node = $( node );
		if ( node.nodeType === Node.TEXT_NODE ) {
			add( node.data.replace( /\u00A0/g, ' ' ) );
		} else if (
			// Node types that don't appear in the model
			// TODO: what about comments?
			node.nodeType !== Node.ELEMENT_NODE ||
			$node.hasClass( 've-ce-branchNode-blockSlug' ) ||
			$node.hasClass( 've-ce-cursorHolder' )
		) {
			// Do nothing
			this.jscsAllowEmptyBlock = this.jscsAllowEmptyBlock;
		} else if ( $node.hasClass( 've-ce-leafNode' ) ) {
			// Don't return the content, but return placeholder characters so the
			// offsets match up.
			viewNode = $node.data( 'view' );
			// Only return placeholders for the first element in a sibling group;
			// otherwise we'll double count this node
			if ( viewNode && node === viewNode.$element[ 0 ] ) {
				// \u2603 is the snowman character: ☃
				add( ve.repeatString( '\u2603', viewNode.getOuterLength() ) );
			}
		} else if ( $node.hasClass( 've-ce-unicorn' ) ) {
			add( '', 'unicorn' );
		} else if ( node.firstChild ) {
			if ( !ve.isBlockElement( node ) ) {
				// push a new tag stack state
				tagListStack.push( tagListStack[ stackTop ].concat( node ) );
				annotationStack.push( node );
				stackTop++;
			}
			node = node.firstChild;
			continue;
		} // Else no child nodes; do nothing

		// Step out of this node, then keep stepping outwards until there is a next sibling
		while ( true ) {
			if ( node === element ) {
				break;
			}
			if ( node === annotationStack[ annotationStack.length - 1 ] ) {
				tagListStack.pop();
				stackTop--;
			}
			if ( node.nextSibling ) {
				break;
			}
			node = node.parentNode;
		}
		if ( node === element ) {
			break;
		}
		node = node.nextSibling;
	}
	return chunks;
};

/* Methods */

/**
 * Test whether the text state is equal to another.
 *
 * @param {ve.ce.TextState} other The other text state
 * @return {boolean} Whether the states are equal
 */
ve.ce.TextState.prototype.isEqual = function ( other ) {
	var i, len;
	if ( other === this ) {
		return true;
	}
	if ( !other || this.chunks.length !== other.chunks.length ) {
		return false;
	}
	for ( i = 0, len = this.chunks.length; i < len; i++ ) {
		if ( !( this.chunks[ i ].isEqual( other.chunks[ i ] ) ) ) {
			return false;
		}
	}
	return true;
};

/**
 * Create a model transaction from a change in text state
 *
 * @param {ve.ce.TextState} prev Previous text state (must be for the same node)
 * @param {ve.dm.Document} modelDoc The model document
 * @param {number} modelOffset The offset of the node in the model
 * @param {ve.dm.AnnotationSet} [unicornAnnotations] The annotations at the unicorn, if any
 * @return {ve.dm.Transaction|null} Transaction corresponding to the text state change
 */
ve.ce.TextState.prototype.getChangeTransaction = function ( prev, modelDoc, modelOffset, unicornAnnotations ) {
	var change, tx, i, iLen, textStart, textEnd, changeOffset, removed, endOffset, annotations,
		missing, oldChunk, newChunk, j, jStart, jEnd, leastMissing, matchStartOffset,
		matchOffset, bestOffset, jLen, oldAnnotations, tag, modelClass, ann, data,
		oldChunks = prev.chunks,
		newChunks = this.chunks,
		modelData = modelDoc.data;

	/**
	 * Calculates the size of oldArray - newArray (asymmetric difference)
	 *
	 * @param {Array} oldArray
	 * @param {Array} newArray
	 * @return {number} Number of elements of oldArray not in newArray
	 */
	function countMissing( oldArray, newArray ) {
		var i, len,
			count = 0;
		for ( i = 0, len = Math.min( oldArray.length, newArray.length ); i < len; i++ ) {
			if ( newArray.indexOf( oldArray[ i ] ) === -1 ) {
				count++;
			}
		}
		return count;
	}

	change = ve.findSequenceChanges( oldChunks, newChunks, function ( a, b ) {
		return a.isEqual( b );
	} );
	if ( change === null ) {
		// No change
		return null;
	}

	tx = new ve.dm.Transaction( modelDoc );

	// Find matching characters with matching annotations at start/end of the changed chunks
	textStart = 0;
	textEnd = 0;
	if ( change.start < Math.min( oldChunks.length, newChunks.length ) ) {
		if ( oldChunks[ change.start ].isEqualTags( newChunks[ change.start ] ) ) {
			oldChunk = oldChunks[ change.start ];
			newChunk = newChunks[ change.start ];
			iLen = Math.min( oldChunk.text.length, newChunk.text.length );
			for ( i = 0; i < iLen; i++ ) {
				if ( oldChunk.text[ i ] !== newChunk.text[ i ] ) {
					break;
				}
			}
			textStart = i;
		}

		if ( oldChunks[ oldChunks.length - 1 - change.end ].isEqualTags(
			newChunks[ newChunks.length - 1 - change.end ]
		) ) {
			oldChunk = oldChunks[ oldChunks.length - 1 - change.end ];
			newChunk = newChunks[ newChunks.length - 1 - change.end ];
			// For oldChunks/newChunks/both, it's possible that only one chunk
			// changed, in which case textStart has already eaten into that chunk;
			// so take care not to overlap it.
			iLen = Math.min(
				oldChunk.text.length -
				( change.start + change.end === oldChunks.length - 1 ? textStart : 0 ),
				newChunk.text.length -
				( change.start + change.end === newChunks.length - 1 ? textStart : 0 )
			);
			for ( i = 0; i < iLen; i++ ) {
				if ( newChunk.text[ newChunk.text.length - 1 - i ] !==
					oldChunk.text[ oldChunk.text.length - 1 - i ]
				) {
					break;
				}
			}
			textEnd = i;
		}
	}

	// Starting just inside the node, skip past matching chunks at the array starts
	changeOffset = modelOffset + 1;
	for ( i = 0, iLen = change.start; i < iLen; i++ ) {
		changeOffset += oldChunks[ i ].text.length;
	}

	// Remove nodes
	removed = 0;
	for ( i = change.start, iLen = oldChunks.length - change.end; i < iLen; i++ ) {
		removed += oldChunks[ i ].text.length;
	}

	// Add nodes
	endOffset = tx.pushRemoval(
		modelDoc,
		0,
		// If textStart/textEnd cause a collapsed range, this just does pushRetain
		new ve.Range( changeOffset + textStart, changeOffset + removed - textEnd )
	);

	for ( i = change.start, iLen = newChunks.length - change.end; i < iLen; i++ ) {
		annotations = null;
		missing = null;
		newChunk = newChunks[ i ];
		if ( newChunk.type === 'unicorn' ) {
			// Unicorns don't exist in the model
			continue;
		}
		// Search for matching tags in old chunks adjacent to the change (i.e. removed
		// chunks or the first chunk before/after the removal). O(n^2) is fine here
		// because usually there will be only one changed chunk, and the wost case is
		// three new chunks (e.g. when the interior of an existing chunk is annotated).
		if ( change.start === 0 ) {
			jStart = 0;
			matchStartOffset = changeOffset;
		} else {
			// Include the last chunk before the change
			jStart = change.start - 1;
			matchStartOffset = changeOffset - oldChunks[ jStart ].text.length;
		}
		// Start
		if ( change.end === 0 ) {
			jEnd = oldChunks.length - 1;
		} else {
			// Include the first chunk after the change
			jEnd = oldChunks.length - change.end;
		}

		// Search for exact match first
		matchOffset = matchStartOffset;
		for ( j = jStart; j < jEnd; j++ ) {
			oldChunk = oldChunks[ j ];
			if ( !oldChunk.isEqualTags( newChunk ) ) {
				matchOffset += oldChunk.text.length;
				continue;
			}
			if ( oldChunk.type === 'unicorn' ) {
				if ( !unicornAnnotations ) {
					throw new Error( 'No unicorn annotations' );
				}
				annotations = unicornAnnotations;
				break;
			}
			annotations = modelData.getInsertionAnnotationsFromRange(
				new ve.Range( matchOffset ),
				true
			);
			break;
		}
		if ( annotations === null ) {
			// No exact match: search for the old chunk whose tag list covers best
			// (chosing the startmost of any tying chunks). There may be no missing
			// tags even though the match is not exact (e.g. because of removed
			// annotations and reordering).
			leastMissing = newChunk.tags.length;
			bestOffset = null;
			matchOffset = matchStartOffset;
			for ( j = jStart; j < jEnd; j++ ) {
				oldChunk = oldChunks[ j ];
				missing = countMissing( oldChunk.tags, newChunk.tags );
				if ( missing < leastMissing ) {
					leastMissing = missing;
					bestOffset = matchOffset;
					if ( missing === 0 ) {
						break;
					}
				}
				matchOffset += oldChunk.text.length;
			}
			if ( bestOffset === null ) {
				oldAnnotations = new ve.dm.AnnotationSet( modelData.getStore() );
			} else {
				oldAnnotations = modelData.getInsertionAnnotationsFromRange(
					new ve.Range( bestOffset ),
					true
				);
			}
			// For each tag in new order, add applicable old annotation or
			// newly-created annotation.
			// TODO: this creates annotations that might not be needed, and so
			// can add superfluous indexes to the store map.
			annotations = new ve.dm.AnnotationSet( modelData.getStore() );
			for ( j = 0, jLen = newChunk.tags.length; j < jLen; j++ ) {
				tag = newChunk.tags[ j ];
				modelClass = ve.dm.modelRegistry.lookup(
					ve.dm.modelRegistry.matchElement( tag )
				);
				ann = ve.dm.annotationFactory.createFromElement(
					ve.dm.converter.createDataElements( modelClass, [ tag ] )[ 0 ]
				);
				if ( !( ann instanceof ve.dm.Annotation ) ) {
					// Erroneous tag; nothing we can do with it
					throw new Error( 'Weird class:' + modelClass );
					// continue;
				}
				annotations.add( oldAnnotations.getComparable( ann ) || ann );
			}
		}
		data = newChunk.text.split( '' );
		if ( i === change.start ) {
			data = data.slice( textStart );
		}
		if ( i === iLen - 1 ) {
			data = data.slice( 0, data.length - textEnd );
		}
		ve.dm.Document.static.addAnnotationsToData( data, annotations );
		endOffset = tx.pushInsertion( modelDoc, endOffset, endOffset, data );
	}
	tx.pushFinalRetain( modelDoc, endOffset );
	return tx;
};
