/*!
 * VisualEditor side by side demo
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Map */

/**
 * @class
 *
 * @constructor
 */
ve.ui.LLClearDirtyTool = function () {
	// Parent constructor
	ve.ui.LLClearDirtyTool.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.LLClearDirtyTool, ve.ui.Tool );

/* Static properties */

ve.ui.LLClearDirtyTool.static.name = 'clearDirty';
ve.ui.LLClearDirtyTool.static.group = 'll';
ve.ui.LLClearDirtyTool.static.icon = 'check';
ve.ui.LLClearDirtyTool.static.title = 'Approve translation';
ve.ui.LLClearDirtyTool.static.autoAddToCatchall = false;
ve.ui.LLClearDirtyTool.static.commandName = 'clearDirty';

/* Initialization */

ve.ui.toolFactory.register( ve.ui.LLClearDirtyTool );
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'clearDirty', 'll', 'clearDirty',
		{ supportedSelections: [ 'linear' ] }
	)
);

/**
 * @class
 *
 * @constructor
 */
ve.ui.LLClearDirtyCommand = function () {
	ve.ui.LLClearDirtyCommand.super.call(
		this, 'clearDirty', 'll', 'clearDirty',
		{ supportedSelections: [ 'linear' ] }
	);
};

/* Inheritance */

OO.inheritClass( ve.ui.LLClearDirtyCommand, ve.ui.Command );

/* Static methods */

ve.ui.LLClearDirtyCommand.prototype.isExecutable = function ( fragment ) {
	var selected, contentBranch;
	if ( !ve.ui.LLClearDirtyCommand.super.prototype.isExecutable.apply( this, arguments ) ) {
		return false;
	}
	if ( !( fragment.getSelection() instanceof ve.dm.LinearSelection ) ) {
		return false;
	}
	selected = fragment.getLeafNodes();
	if ( selected.length !== 1 ) {
		return false;
	}
	contentBranch = selected[ 0 ].node.isContent() ?
		selected[ 0 ].node.getParent() :
		selected[ 0 ].node;
	return contentBranch.canContainContent() &&
		( contentBranch.getAttribute( 'll-dirty' ) === 'edited' ||
		contentBranch.getAttribute( 'll-dirty' ) === 'mt' );
};

/* Initialization */

ve.ui.commandRegistry.register( new ve.ui.LLClearDirtyCommand() );

/**
 * @class
 *
 * @constructor
 */
ve.ui.LLAction = function () {
	ve.ui.LLAction.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.LLAction, ve.ui.Action );

/* Static properties */

ve.ui.LLAction.static.name = 'll';
ve.ui.LLAction.static.methods = [ 'clearDirty' ];

/* Static methods */

ve.ui.LLAction.prototype.clearDirty = function () {
	var treePath, otherNode,
		fragment = this.surface.getModel().getFragment(),
		selected, contentBranch, tx;
	if ( !( fragment.getSelection() instanceof ve.dm.LinearSelection ) ) {
		return;
	}
	selected = fragment.getLeafNodes();
	if ( selected.length !== 1 ) {
		return;
	}
	contentBranch = selected[ 0 ].node.isContent() ?
		selected[ 0 ].node.getParent() :
		selected[ 0 ].node;
	if ( !contentBranch.canContainContent() ) {
		return;
	}
	tx = ve.dm.TransactionBuilder.static.newFromAttributeChanges(
		fragment.getDocument(), contentBranch.getOuterRange().start,
		{ 'll-dirty': 'approved' }
	);
	this.surface.getModel().change( tx );

	// HACK: store the verified translation correspondence in the node object
	treePath = ve.dm.getTreePathFromPosition( { node: contentBranch, linearOffset: 0 } );
	otherNode = contentBranch.getDocument().other.getPositionFromTreePath( treePath ).node;

	otherNode.lastVerified = contentBranch.lastVerified = {
		source: otherNode.getChunked(),
		target: contentBranch.getChunked()
	};
};

/* Initialization */

ve.ui.actionFactory.register( ve.ui.LLAction );

// XXX use our own sa.Target subclass
ve.init.sa.Target.static.toolbarGroups.push( {
	name: 'll',
	include: [ { group: 'll' } ]
} );

/**
 * Get the node, and either relative linear offset or tree offset, of a linear offset
 *
 * @param {number} linearOffset Linear offset
 * @return {Object} Position
 * @return {ve.dm.BranchNode} return.node Branch node in which the position lies
 * @return {number} [return.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @return {number} [return.treeOffset] If node is not a ContentBranchNode, offset in its children list
 */
ve.dm.Document.prototype.getPositionFromLinearOffset = function ( linearOffset ) {
	var selection = this.selectNodes( new ve.Range( linearOffset ) )[ 0 ],
		node = selection.node,
		nodeRange = selection.nodeRange;
	if ( selection.indexInNode !== undefined && !node.isContent() && !node.canContainContent() ) {
		// Between two children of a non-content branch node
		return { node: node, treeOffset: selection.indexInNode };
	}
	if ( node.isContent() ) {
		node = node.getParent();
		nodeRange = node.getRange();
	}
	return { node: node, linearOffset: linearOffset - nodeRange.start };
};

/**
 * Get the node, and either relative linear offset or tree offset, of a tree path
 *
 * @param {number[]} path Tree path, linearized inside ContentBranchNode if there is one
 * @return {Object} Position
 * @return {ve.dm.BranchNode} return.node Branch node in which the position lies
 * @return {number} [return.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @return {number} [return.treeOffset] If node is not a ContentBranchNode, offset in its children list
 */
ve.dm.Document.prototype.getPositionFromTreePath = function ( path ) {
	var i,
		node = this.getDocumentNode();
	for ( i = 0; i < path.length - 1; i++ ) {
		node = node.getChildren()[ path[ i ] ];
	}
	if ( node.canContainContent() ) {
		return { node: node, linearOffset: path[ i ] };
	}
	return { node: node, treeOffset: path[ i ] };
};

/**
 * Get the tree path of a position in the document
 *
 * @param {Object} position Position in the document
 * @param {ve.dm.BranchNode} position.node Branch node in which the position lies
 * @param {number} [position.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @param {number} [position.treeOffset] If node is not a ContentBranchNode, offset in its children list
 * @return {number[]} Tree path, linearized inside ContentBranchNode if there is one
 */
ve.dm.getTreePathFromPosition = function ( position ) {
	var path = position.node.getOffsetPath();
	path.push( position.treeOffset !== undefined ? position.treeOffset : position.linearOffset );
	return path;
};

/**
 * Get the linear offset of a position in the document
 *
 * @param {Object} position Position in the document
 * @param {ve.dm.BranchNode} position.node Branch node in which the position lies
 * @param {number} [position.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @param {number} [position.treeOffset] If node is not a ContentBranchNode, offset in its children list
 * @return {number} Linear offset
 */
ve.dm.getOffsetFromPosition = function ( position ) {
	var children;
	if ( position.linearOffset !== undefined ) {
		return position.node.getRange().start + position.linearOffset;
	}
	children = position.node.getChildren();
	if ( position.treeOffset === children.length ) {
		return position.node.getRange().end;
	}
	return position.node.getChildren()[ position.treeOffset ].getOuterRange().start;
};

/**
 * Adapt this transaction to apply to a document with the same structure as this one
 *
 * The adapted transaction guarantees to keep the structure the same. It leaves alone content
 * inside content branch nodes, inserting no content only removing content if the node is
 * removed. If adjacent nodes are merged, their content is concatenated.
 *
 * @param {ve.dm.Document} oldDoc Document in the state on which the transaction applies
 * @param {ve.dm.Document} newDoc Corresponding document with the same structure
 * @return {ve.dm.Transaction} Adapted transaction to apply to newDoc
 */
ve.dm.Transaction.prototype.distort = function ( oldDoc, newDoc ) {
	var i, len, op, oldPosition, newPosition, treePath, newRemove, newInsert,
		priorNewLinearOffset, newTx,
		oldLinearOffset = 0,
		newLinearOffset = 0,
		changedNodePairs = new Map(),
		newOps = [];

	for ( i = 0, len = this.operations.length; i < len; i++ ) {
		op = this.operations[ i ];
		if ( op.type === 'retain' ) {
			priorNewLinearOffset = newLinearOffset;
			oldLinearOffset += op.length;
			oldPosition = oldDoc.getPositionFromLinearOffset( oldLinearOffset );
			treePath = ve.dm.getTreePathFromPosition( oldPosition );
			newPosition = newDoc.getPositionFromTreePath( treePath );
			if ( newPosition.linearOffset !== undefined ) {
				// Retain greedily up to the end of a content branch node
				newPosition.linearOffset = newPosition.node.getLength();
			}
			newLinearOffset = ve.dm.getOffsetFromPosition( newPosition );
			// XXX factor out up to here (duplicated); maybe return range? or offset diff (advancement)?

			newOps.push( {
				type: 'retain',
				length: newLinearOffset - priorNewLinearOffset
			} );
		} else if ( op.type === 'replace' ) {
			priorNewLinearOffset = newLinearOffset;
			oldLinearOffset += op.remove.length;
			oldPosition = oldDoc.getPositionFromLinearOffset( oldLinearOffset );
			treePath = ve.dm.getTreePathFromPosition( oldPosition );
			newPosition = newDoc.getPositionFromTreePath( treePath );
			if ( oldPosition.node.canContainContent() ) {
				changedNodePairs.set( oldPosition.node, newPosition.node );
			}
			if ( newPosition.linearOffset !== undefined ) {
				newPosition.linearOffset = 0;
			}
			newLinearOffset = ve.dm.getOffsetFromPosition( newPosition );
			if ( priorNewLinearOffset > newLinearOffset ) {
				// Because retains are greedy, we might be trying to jump backwards here;
				// prevent that from happening
				newLinearOffset = priorNewLinearOffset;
			}

			newRemove = newDoc.getData( new ve.Range( priorNewLinearOffset, newLinearOffset ) );
			newInsert = ve.dm.LinearData.static.stripContent( op.insert );
			newOps.push( {
				type: 'replace',
				remove: newRemove,
				insert: newInsert
			} );
		} else if ( op.type === 'attribute' && op.key === 'll-dirty' ) {
			// Do nothing
		} else {
			newOps.push( ve.copy( op ) );
		}
	}
	newTx = new ve.dm.Transaction( newOps, this.authorId );
	newTx.isDistorted = true;
	return { tx: newTx, changedNodePairs: changedNodePairs };
};

/**
 * Get the annotated content, chunked at annotation changes
 *
 * @return {Object} Annotated chunked content
 * @return {string} return.allText The entire content as plaintext
 * @return {string[]} return.commonAnnList List of annotation hashes applying to the entire content
 * @return {Object} return.i The i'th chunk
 * @return {number} return.i.start The chunk's start offset
 * @return {string} return.i.text The chunk's text
 * @return {string[]} return.i.annList List of annotation hashes applying to the chunk
 */
ve.dm.ContentBranchNode.prototype.getChunked = function () {
	var i, len, item, annList, ch, annListStr, commonAnnList, commonAnnListLen, chunks, start,
		texts = [],
		annLists = [],
		chars = [],
		lastAnnList = null,
		lastAnnListStr = null,
		data = this.getDocument().getDataFromNode( this );

	function flush() {
		if ( chars.length === 0 ) {
			return;
		}
		texts.push( chars.join( '' ) );
		annLists.push( lastAnnList );
		chars.length = 0;
	}
	for ( i = 0, len = data.length; i < len; i++ ) {
		item = data[ i ];
		annList = Array.isArray( item ) ? item[ 1 ] : [];
		ch = Array.isArray( item ) ? item[ 0 ] : item;
		annListStr = JSON.stringify( annList );
		if ( lastAnnListStr !== annListStr ) {
			// Annotation change: flush chunk
			if ( chars.length > 0 ) {
				flush();
				lastAnnList = annList;
				lastAnnListStr = annListStr;
			}
		}
		chars.push( ch );
		lastAnnList = annList;
		lastAnnListStr = annListStr;
	}
	if ( chars.length > 0 ) {
		flush();
	}
	if ( texts.length === 0 ) {
		return { texts: [], commonAnnList: [], chunks: [] };
	}
	commonAnnListLen = ve.getCommonStartSequenceLength( annLists );
	commonAnnList = annLists.length === 0 ?
		[] :
		annLists[ 0 ].slice(
			0,
			ve.getCommonStartSequenceLength( annLists )
		);
	chunks = [];
	start = 0;
	for ( i = 0, len = texts.length; i < len; i++ ) {
		// TODO: kill extraneous whitespace inside chunks
		if ( annLists[ i ].length > commonAnnListLen ) {
			chunks.push( {
				start: start,
				text: texts[ i ],
				annList: annLists[ i ]
			} );
		}
		start += texts[ i ].length;
	}
	return {
		allText: texts.join( '' ),
		commonAnnList: commonAnnList,
		chunks: chunks
	};
};

/**
 * Strip content from linear data
 *
 * @param {Array} data Linear data
 * @return {Array} The linear data, with everything stripped except structure nodes
 */
ve.dm.LinearData.static.stripContent = function ( data ) {
	return ve.copy( data.filter( function ( item ) {
		var type = item.type;
		if ( type ) {
			if ( type.charAt( 0 ) === '/' ) {
				type = type.substr( 1 );
			}
			return !ve.dm.nodeFactory.isNodeContent( type );
		}
		return false;
	} ) );
};

/**
 * Get linear data from chunked content
 *
 * @param {Object} chunked Annotated chunked content
 * @param {string} chunked.allText The entire content as plaintext
 * @param {string[]} chunked.commonAnnList List of annotation hashes applying to the entire content
 * @param {Object} chunked.i The i'th chunk
 * @param {number} chunked.i.start The chunk's start offset
 * @param {string} chunked.i.text The chunk's text
 * @param {string[]} chunked.i.annList List of annotation hashes applying to the chunk
 * @return {Array} The content as linear data
 */
ve.dm.LinearData.static.getUnchunked = function ( chunked ) {
	var i, iLen, chunk,
		allText = chunked.allText,
		commonAnnList = chunked.commonAnnList,
		cursor = 0,
		data = [];

	function annotate( text, annList ) {
		var j, jLen,
			plainData = text.split( '' );
		if ( annList.length === 0 ) {
			return plainData;
		}
		for ( j = 0, jLen = plainData.length; j < jLen; j++ ) {
			plainData[ j ] = [ plainData[ j ], ve.copy( annList ) ];
		}
		return plainData;
	}

	for ( i = 0, iLen = chunked.chunks.length; i < iLen; i++ ) {
		chunk = chunked.chunks[ i ];
		ve.batchPush(
			data,
			annotate( allText.slice( cursor, chunk.start ), commonAnnList )
		);
		ve.batchPush(
			data,
			annotate( chunk.text, chunk.annList )
		);
		cursor = chunk.start + chunk.text.length;
	}
	ve.batchPush(
		data,
		annotate( allText.slice( cursor ), commonAnnList )
	);
	return data;
};

/*!
 * LL namespace
 */

ve.ll = {};

/**
 * Break text into wordbreak-separated tokens, with whitespace normalized
 *
 * If the text already had normalized whitespace, getTokens( text ).join( '' ) === text
 *
 * @param {string} text The text to tokenize
 * @return {string} The text split by wordbreaks, with whitespace normalized
 */
ve.ll.getTokens = function ( text ) {
	var thisBreak, us,
		prevBreak = 0,
		tokens = [];

	text = text.replace( /^\s+|\s+$/g, '' ).replace( /\s+/g, ' ' );
	us = new unicodeJS.TextString( text );
	while ( true ) {
		thisBreak = unicodeJS.wordbreak.nextBreakOffset( us, prevBreak );
		if ( thisBreak === prevBreak ) {
			break;
		}
		tokens.push( text.slice( prevBreak, thisBreak ) );
		prevBreak = thisBreak;
	}
	return tokens;
};

/**
 * Build annotated chunked target text from annotated chunked source and target translations
 *
 * This is designed so a plaintext translation engine can be used to translate annotated text.
 *
 * For example, given source text of "a <i>modern</i> Britain", the chunkedSource will
 * look like this:
 * {
 *     allText: 'a modern Britain',
 *     commonAnnList: [],
 *     chunks: [ { start: 2, text: 'modern', annList: [ 'hefd27ef3bf2041dd' ] } ]
 * }
 *
 * If the targetTexts are like [ 'Una Gran Bretaña MODERNA', 'Una Gran Bretaña moderna' ],
 *
 * then this method uses that information to derive the chunked target text:
 * {
 *     allText: 'un Gran Bretaña moderna',
 *     commonAnnList: [],
 *     chunks: [ { start: 16, text: 'moderna', annList: [ 'hefd27ef3bf2041dd' ] } ]
 * }
 *
 * Requirements about targetText:
 *
 * - The last item in targetTexts must be the entire target plaintext
 *
 * - targetText[ i ] must be the entire target plaintext, but with words corresponding to
 *   chunkedSource.chunks[ i ] changed (e.g. upper-cased).
 *
 * @param {Object} chunkedSource Source as Annotated chunked content
 * @param {string} chunkedSource.allText The entire content as plaintext
 * @param {string[]} chunkedSource.commonAnnList List of annotation hashes applying to the entire content
 * @param {Object} chunkedSource.i The i'th chunk
 * @param {number} chunkedSource.i.start The chunk's start offset
 * @param {string} chunkedSource.i.text The chunk's text
 * @param {string[]} chunkedSource.i.annList List of annotation hashes applying to the chunk
 *
 * @param {string[]} targetTexts The target texts; see above
 *
 * @return {Object} Target as annotated chunked content
 * @return {string} return.allText The entire content as plaintext
 * @return {string[]} return.commonAnnList List of annotation hashes applying to the entire content
 * @return {Object} return.i The i'th chunk
 * @return {number} return.i.start The chunk's start offset
 * @return {string} return.i.text The chunk's text
 * @return {string[]} return.i.annList List of annotation hashes applying to the chunk
 */
ve.ll.adaptAnnotations = function ( chunkedSource, targetTexts ) {
	var fullTokenList, i, iLen, tokenList, j, jLen, min, max,
		chunks = [],
		targetTokenLists = targetTexts.map( ve.ll.getTokens );

	fullTokenList = targetTokenLists.pop();
	for ( i = 0, iLen = targetTokenLists.length; i < iLen; i++ ) {
		tokenList = targetTokenLists[ i ];
		for ( j = 0, jLen = tokenList.length; j < jLen; j++ ) {
			if ( tokenList[ j ] !== fullTokenList[ j ] ) {
				break;
			}
		}
		if ( j === jLen ) {
			continue;
		}
		min = j;
		for ( j = tokenList.length - 1; j > min; j-- ) {
			if ( tokenList[ j ] !== fullTokenList[ j ] ) {
				break;
			}
		}
		max = j + 1;
		chunks.push( {
			start: tokenList.slice( 0, min ).join( '' ).length,
			text: fullTokenList.slice( min, max ).join( '' ),
			annList: chunkedSource.chunks[ i ].annList
		} );

	}
	return {
		allText: fullTokenList.join( '' ),
		commonAnnList: chunkedSource.commonAnnList,
		chunks: chunks
	};
};

/**
 * Parallel document models with identical structure but differing content
 *
 * @class
 * @constructor
 * @param {Object} firstOptions Options for first document
 * @param {Object} firstOptions.lang Language code
 * @param {Object} firstOptions.dir Directionality
 * @param {Object} firstOptions.html Initial HTML
 * @param {Object} secondOptions Options for second document
 * @param {Object} secondOptions.lang Language code
 * @param {Object} secondOptions.dir Directionality
 * @param {Object} secondOptions.html Initial HTML
 */
ve.ll.Prism = function ( firstOptions, secondOptions ) {
	function makeDocument( lang, dir, html, store ) {
		return ve.dm.converter.getModelFromDom(
			ve.createDocumentFromHtml( html ),
			{ lang: lang, dir: dir },
			store
		);
	}
	// TODO use one target with two surfaces? But then they'd share one toolbar, do we want that?
	this.firstDoc = makeDocument( firstOptions.lang, firstOptions.dir, firstOptions.html );
	this.secondDoc = makeDocument( secondOptions.lang, secondOptions.dir, secondOptions.html, this.firstDoc.getStore() );
	this.firstDoc.other = this.secondDoc;
	this.secondDoc.other = this.firstDoc;
	this.firstDoc.on( 'precommit', this.applyDistorted.bind( this, this.firstDoc, this.secondDoc ) );
	this.secondDoc.on( 'precommit', this.applyDistorted.bind( this, this.secondDoc, this.firstDoc ) );
	this.changedNodePairs = new Map();
	this.throttledMaybeTranslate = ve.throttle( this.maybeTranslate.bind( this ), 50 );
};

/* Initialize */

OO.initClass( ve.ll.Prism );

/* Instance methods */

/**
 * Distort an applied translation for the other doc, and apply it
 *
 * @param {ve.dm.Document} doc The lead document for this change
 * @param {ve.dm.Document} otherDoc The following document for this change
 * @param {ve.dm.Transaction} tx A transaction applying to doc
 */
ve.ll.Prism.prototype.applyDistorted = function ( doc, otherDoc, tx ) {
	var distortion,
		prism = this;
	if ( tx.isDistorted ) {
		return;
	}
	distortion = tx.distort( doc, otherDoc );
	distortion.changedNodePairs.forEach( function ( targetNode, sourceNode ) {
		var tx;
		if (
			sourceNode.getAttribute( 'll-dirty' ) !== 'mt' &&
			sourceNode.getAttribute( 'll-dirty' ) !== 'edited' &&
			targetNode.getAttribute( 'll-dirty' ) !== 'edited'
		) {
			tx = ve.dm.TransactionBuilder.static.newFromAttributeChanges(
				otherDoc, targetNode.getOuterRange().start, { 'll-dirty': 'mt' }
			);
			tx.isDistorted = true;
			otherDoc.commit( tx );
		}
		prism.changedNodePairs.set( sourceNode, targetNode );

	} );
	otherDoc.commit( distortion.tx );
	this.throttledMaybeTranslate( doc, otherDoc );
};

/**
 * Asynchronously translate nodes marked for translation, if they are unchanged
 *
 * TODO: This doesn't always fire at sensible times. Rethink this whole methodology.
 *
 * @param {ve.dm.Document} doc The lead document XXX but "lead" is defined per CBN
 * @param {ve.dm.Document} otherDoc The following document XXX ditto
 */
ve.ll.Prism.prototype.maybeTranslate = function ( doc, otherDoc ) {
	var prism = this;
	setTimeout( function () {
		prism.changedNodePairs.forEach( function ( targetNode, sourceNode ) {
			var chunkedSource, oldChunkedSource, oldChunkedTarget;
			if (
				sourceNode.getAttribute( 'll-dirty' ) !== 'mt' &&
				sourceNode.getAttribute( 'll-dirty' ) !== 'edited' &&
				targetNode.getAttribute( 'll-dirty' ) !== 'edited'
			) {
				chunkedSource = sourceNode.getChunked();
				oldChunkedSource = targetNode.lastVerified ? targetNode.lastVerified.source :
					{ allText: '', commonAnnList: [], chunks: [] };
				oldChunkedTarget = targetNode.lastVerified ? targetNode.lastVerified.target :
					{ allText: '', commonAnnList: [], chunks: [] };
				prism.tr(
					doc.getLang(),
					otherDoc.getLang(),
					oldChunkedSource,
					chunkedSource
				).then( function ( oldAndNew ) {
					var newTargetData, machineTranslation1, machineTranslation2, tx,
						oldTargetTexts = oldAndNew[ 0 ],
						targetTexts = oldAndNew[ 1 ];
					if ( JSON.stringify( chunkedSource ) !== JSON.stringify( sourceNode.getChunked() ) ) {
						// Source has changed since we started translating; abort
						return;
					}
					prism.changedNodePairs.delete( sourceNode );

					machineTranslation1 = ve.ll.adaptAnnotations( oldChunkedSource, oldTargetTexts );
					machineTranslation2 = ve.ll.adaptAnnotations( chunkedSource, targetTexts );

					newTargetData = prism.adaptCorrections(
						machineTranslation1,
						machineTranslation2,
						oldChunkedTarget
					);
					tx = ve.dm.TransactionBuilder.static.newFromReplacement(
						otherDoc,
						targetNode.getRange(),
						newTargetData,
						// Remove metadata
						true
					);
					otherDoc.commit( tx );
				} );
			} else {
				prism.changedNodePairs.delete( sourceNode );
			}
		} );
	} );
};

/**
 * Machine translate chunked source, in preparation for the trick described in #adaptAnnotations
 *
 * @param {string} sourceLang Source language code; only en|es are supported right now
 * @param {string} targetLang Target language code; only es|en are supported right now
 * @param {Object} oldChunkedSource Chunked old source, as returned by getChunked
 * @param {Object} chunkedSource Chunked current source, as returned by getChunked
 * @return {Promise} Promise resolving with string[]s oldTranslatedText and translatedText
 */
ve.ll.Prism.prototype.tr = function ( sourceLang, targetLang, oldChunkedSource, chunkedSource ) {
	var langPair, oldTexts, texts,
		apertiumLangName = { en: 'eng', es: 'spa' },
		sourceApertiumLang = apertiumLangName[ sourceLang ],
		targetApertiumLang = apertiumLangName[ targetLang ];

	function multiplexChunks( chunked ) {
		var outputList = [];
		chunked.chunks.forEach( function ( chunk ) {
			outputList.push( chunked.allText.slice( 0, chunk.start ) +
				chunk.text.toUpperCase() +
				chunked.allText.slice( chunk.start + chunk.text.length )
			);
		} );
		outputList.push( chunked.allText );
		return outputList;
	}

	if ( !sourceApertiumLang ) {
		throw new Error( 'Unsupported language code "' + sourceApertiumLang );
	}
	if ( !targetApertiumLang ) {
		throw new Error( 'Unsupported language code "' + targetApertiumLang );
	}
	langPair = sourceApertiumLang + '|' + targetApertiumLang;

	oldTexts = multiplexChunks( oldChunkedSource );
	texts = multiplexChunks( chunkedSource );
	return $.ajax( {
		url: 'https://apertium.wmflabs.org/translate',
		datatype: 'json',
		data: {
			markUnknown: 'no',
			langpair: langPair,
			q: oldTexts.join( '\n:!!:\n' ) + '\n:!!!:\n' + texts.join( '\n:!!:\n' )
		}
	} ).then( function ( data ) {
		var oldTranslatedTexts, translatedTexts,
			parts = data.responseData.translatedText.split( /\s*:!!!:\s*/ );
		if ( parts.length !== 2 ) {
			throw new Error( 'Cannot find exactly one separator \\n:!!!:\\n' );
		}
		oldTranslatedTexts = parts[ 0 ].split( /\s*:!!:\s*/ );
		translatedTexts = parts[ 1 ].split( /\s*:!!:\s*/ );
		return [ oldTranslatedTexts, translatedTexts ];
	} );
};

/**
 * Adapt corrections from old machine translation to new machine translation
 *
 * @param {Object} machineTranslation1 Machine-translated chunked old source
 * @param {Object} machineTranslation2 Machine-translated chunked current source
 * @param {Object} target1 Human-corrected version of machineTranslation1
 * @return {Array} Linear data of machineTranslation2 with adapted human corrections
 */
ve.ll.Prism.prototype.adaptCorrections = function ( machineTranslation1, machineTranslation2, target1 ) {
	var m1, m2, t1, m1m2, m1t1, startToken, endToken, start, end,
		insertion, oldData, newData;

	function sliceChunked( chunked, s, e ) {
		var allText, chunks, i, len, chunk;
		if ( e === undefined ) {
			e = chunked.allText.length;
		}
		if ( s < 0 ) {
			s += chunked.allText.length;
		}
		if ( e < 0 ) {
			e += chunked.allText.length;
		}
		allText = chunked.allText.slice( s, e );
		chunks = [];
		for ( i = 0, len = chunked.chunks.length; i < len; i++ ) {
			chunk = chunked.chunks[ i ];
			if ( chunk.start >= e || chunk.start + chunk.text.length < s ) {
				continue;
			}
			chunks.push( {
				start: chunk.start - s,
				text: chunk.text.slice( 0, Math.min( chunk.text.length, allText.length - s ) ),
				annList: chunk.annList
			} );
		}
		return {
			allText: allText,
			chunks: chunks,
			// XXX should we really have the same commonAnnList???
			commonAnnList: chunked.commonAnnList
		};
	}

	m1 = ve.ll.getTokens( machineTranslation1.allText );
	m2 = ve.ll.getTokens( machineTranslation2.allText );
	t1 = ve.ll.getTokens( target1.allText );

	m1m2 = ve.countEdgeMatches( m1, m2 );
	m1t1 = ve.countEdgeMatches( m1, t1 );

	if ( !m1m2 ) {
		// No changes
		return;
	}

	if ( !m1t1 ) {
		m1t1 = { start: 0, end: t1.length };
	}

	// Calculate replacement range in t1
	if ( m1.length - m1m2.end <= m1t1.start ) {
		startToken = m1m2.start;
		endToken = m1.length - m1m2.end;

	} else if ( m1.length - m1t1.end <= m1m2.start ) {
		startToken = m1m2.start + t1.length - m1.length;
		endToken = t1.length - m1m2.end;
	} else {
		// ranges overlap; do nothing
		return;
	}
	start = t1.slice( 0, startToken ).join( '' ).length;
	end = start + t1.slice( startToken, endToken ).join( '' ).length;
	insertion = sliceChunked(
		machineTranslation2,
		m2.slice( 0, m1m2.start ).join( '' ).length,
		m2.slice( 0, m2.length - m1m2.end ).join( '' ).length
	);
	oldData = ve.dm.LinearData.static.getUnchunked( target1 );
	newData = [].concat(
		oldData.slice( 0, start ),
		ve.dm.LinearData.static.getUnchunked( insertion ),
		oldData.slice( end )
	);
	return newData;
};
