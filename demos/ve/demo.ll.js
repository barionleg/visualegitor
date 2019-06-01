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
	var fragment = this.surface.getModel().getFragment(),
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

};

/* Initialization */

ve.ui.actionFactory.register( ve.ui.LLAction );

// XXX use our own sa.Target subclass
ve.init.sa.Target.static.toolbarGroups.push( {
	name: 'll',
	include: [ { group: 'll' } ]
} );

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

ve.dm.getTreePathFromPosition = function ( position ) {
	var path = position.node.getOffsetPath();
	path.push( position.treeOffset !== undefined ? position.treeOffset : position.linearOffset );
	return path;
};

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

ve.ll.adaptTargetTexts = function ( chunkedSource, targetTexts ) {
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
	this.firstDoc.on( 'precommit', this.applyDistorted.bind( this, this.firstDoc, this.secondDoc ) );
	this.secondDoc.on( 'precommit', this.applyDistorted.bind( this, this.secondDoc, this.firstDoc ) );
	this.changedNodePairs = new Map();
	this.throttledMaybeTranslate = ve.throttle( this.maybeTranslate.bind( this ), 2000 );
};

/* Initialize */

OO.initClass( ve.ll.Prism );

/* Instance methods */

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

ve.ll.Prism.prototype.maybeTranslate = function ( doc, otherDoc ) {
	var prism = this;
	setTimeout( function () {
		prism.changedNodePairs.forEach( function ( targetNode, sourceNode ) {
			var chunkedSource, oldChunkedTarget;
			if (
				sourceNode.getAttribute( 'll-dirty' ) !== 'mt' &&
				sourceNode.getAttribute( 'll-dirty' ) !== 'edited' &&
				targetNode.getAttribute( 'll-dirty' ) !== 'edited'
			) {
				chunkedSource = sourceNode.getChunked();
				oldChunkedTarget = targetNode.getChunked();
				prism.tr( doc.getLang(), otherDoc.getLang(), chunkedSource ).then(
					prism.processTranslation.bind( prism, doc, otherDoc, sourceNode, targetNode, chunkedSource, oldChunkedTarget )
				);
			} else {
				prism.changedNodePairs.delete( sourceNode );
			}
		} );
	} );
};

ve.ll.Prism.prototype.tr = function ( sourceLang, targetLang, chunkedSource ) {
	var langPair,
		texts = [],
		text = chunkedSource.allText,
		apertiumLangName = { en: 'eng', es: 'spa' },
		sourceApertiumLang = apertiumLangName[ sourceLang ],
		targetApertiumLang = apertiumLangName[ targetLang ];
	if ( !sourceApertiumLang ) {
		throw new Error( 'Unsupported language code "' + sourceApertiumLang );
	}
	if ( !targetApertiumLang ) {
		throw new Error( 'Unsupported language code "' + targetApertiumLang );
	}
	langPair = sourceApertiumLang + '|' + targetApertiumLang;

	chunkedSource.chunks.forEach( function ( chunk ) {
		texts.push(
			text.slice( 0, chunk.start ) +
			chunk.text.toUpperCase() +
			text.slice( chunk.start + chunk.text.length )
		);
	} );
	texts.push( text );
	return $.ajax( {
		url: 'https://apertium.wmflabs.org/translate',
		datatype: 'json',
		data: {
			markUnknown: 'no',
			langpair: langPair,
			q: texts.join( '\n:!!:\n' )
		}
	} ).then( function ( data ) {
		return data.responseData.translatedText.split( '\n:!!:\n' );
	} );
};

ve.ll.Prism.prototype.processTranslation = function ( doc, otherDoc, sourceNode, targetNode, chunkedSource, oldChunkedTarget, targetTexts ) {
	var mtTx,
		chunkedTarget = ve.ll.adaptTargetTexts( chunkedSource, targetTexts ),
		targetData = ve.dm.LinearData.static.getUnchunked( chunkedTarget );
	if (
		JSON.stringify( chunkedSource ) === JSON.stringify( sourceNode.getChunked() ) &&
		JSON.stringify( oldChunkedTarget ) === JSON.stringify( targetNode.getChunked() )
	) {
		mtTx = ve.dm.TransactionBuilder.static.newFromReplacement(
			otherDoc,
			targetNode.getRange(),
			targetData
		);
		otherDoc.commit( mtTx );
	}
	this.changedNodePairs.delete( sourceNode );
};
