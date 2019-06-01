/*!
 * VisualEditor side by side demo
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Map */

( function () {
	/* eslint-disable no-jquery/no-global-selector */
	var throttledMaybeTranslate,
		$firstInstance = $( '.ve-instance' ).eq( 0 ),
		$secondInstance = $( '.ve-instance' ).eq( 1 ),
		changedNodePairs = new Map();
	/* eslint-enable no-jquery/no-global-selector */

	function ClearDirtyTool() {
		// Parent constructor
		ClearDirtyTool.super.apply( this, arguments );
	}
	OO.inheritClass( ClearDirtyTool, ve.ui.Tool );
	ClearDirtyTool.static.name = 'clearDirty';
	ClearDirtyTool.static.group = 'll';
	ClearDirtyTool.static.icon = 'check';
	ClearDirtyTool.static.title = 'Approve translation';
	ClearDirtyTool.static.autoAddToCatchall = false;
	ClearDirtyTool.static.commandName = 'clearDirty';
	ve.ui.toolFactory.register( ClearDirtyTool );
	ve.ui.commandRegistry.register(
		new ve.ui.Command(
			'clearDirty', 'll', 'clearDirty',
			{ supportedSelections: [ 'linear' ] }
		)
	);
	function LLClearDirtyCommand() {
		LLClearDirtyCommand.super.call(
			this, 'clearDirty', 'll', 'clearDirty',
			{ supportedSelections: [ 'linear' ] }
		);
	}
	OO.inheritClass( LLClearDirtyCommand, ve.ui.Command );
	LLClearDirtyCommand.prototype.isExecutable = function ( fragment ) {
		var selected, contentBranch;
		if ( !LLClearDirtyCommand.super.prototype.isExecutable.apply( this, arguments ) ) {
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
	ve.ui.commandRegistry.register( new LLClearDirtyCommand() );
	function LLAction() {
		LLAction.super.apply( this, arguments );
	}
	OO.inheritClass( LLAction, ve.ui.Action );
	LLAction.static.name = 'll';
	LLAction.static.methods = [ 'clearDirty' ];
	LLAction.prototype.clearDirty = function () {
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
	ve.ui.actionFactory.register( LLAction );

	// XXX use our own sa.Target subclass
	ve.init.sa.Target.static.toolbarGroups.push( {
		name: 'll',
		include: [ { group: 'll' } ]
	} );

	/**
	 * Translate a plain text string
	 *
	 * @param {string} sourceLang Source language code
	 * @param {string} targetLang Target language code
	 * @param {Object} chunkedSource
	 * @return {Promise} target text
	 */
	function tr( sourceLang, targetLang, chunkedSource ) {
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
	}

	function makeDocument( lang, html, store ) {
		return ve.dm.converter.getModelFromDom(
			ve.createDocumentFromHtml( html ),
			// Optional: Document language, directionality (ltr/rtl)
			{ lang: lang, dir: $( document.body ).css( 'direction' ) },
			store
		);
	}

	function stripContent( data ) {
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
	}

	function getPositionFromLinearOffset( doc, linearOffset ) {
		var selection = doc.selectNodes( new ve.Range( linearOffset ) )[ 0 ],
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
	}

	function getTreePathFromPosition( position ) {
		var path = position.node.getOffsetPath();
		path.push( position.treeOffset !== undefined ? position.treeOffset : position.linearOffset );
		return path;
	}

	function getPositionFromTreePath( doc, path ) {
		var i,
			node = doc.getDocumentNode();
		for ( i = 0; i < path.length - 1; i++ ) {
			node = node.getChildren()[ path[ i ] ];
		}
		if ( node.canContainContent() ) {
			return { node: node, linearOffset: path[ i ] };
		}
		return { node: node, treeOffset: path[ i ] };
	}

	function getOffsetFromPosition( position ) {
		var children;
		if ( position.linearOffset !== undefined ) {
			return position.node.getRange().start + position.linearOffset;
		}
		children = position.node.getChildren();
		if ( position.treeOffset === children.length ) {
			return position.node.getRange().end;
		}
		return position.node.getChildren()[ position.treeOffset ].getOuterRange().start;
	}

	function distortTx( oldTx, oldDoc, newDoc ) {
		var i, len, op, oldPosition, newPosition, treePath, newRemove, newInsert,
			priorNewLinearOffset, newTx,
			oldLinearOffset = 0,
			newLinearOffset = 0,
			changedNodePairs = new Map(),
			newOps = [];

		for ( i = 0, len = oldTx.operations.length; i < len; i++ ) {
			op = oldTx.operations[ i ];
			if ( op.type === 'retain' ) {
				priorNewLinearOffset = newLinearOffset;
				oldLinearOffset += op.length;
				oldPosition = getPositionFromLinearOffset( oldDoc, oldLinearOffset );
				treePath = getTreePathFromPosition( oldPosition );
				newPosition = getPositionFromTreePath( newDoc, treePath );
				if ( newPosition.linearOffset !== undefined ) {
					// Retain greedily up to the end of a content branch node
					newPosition.linearOffset = newPosition.node.getLength();
				}
				newLinearOffset = getOffsetFromPosition( newPosition );
				// XXX factor out up to here (duplicated); maybe return range? or offset diff (advancement)?

				newOps.push( {
					type: 'retain',
					length: newLinearOffset - priorNewLinearOffset
				} );
			} else if ( op.type === 'replace' ) {
				priorNewLinearOffset = newLinearOffset;
				oldLinearOffset += op.remove.length;
				oldPosition = getPositionFromLinearOffset( oldDoc, oldLinearOffset );
				treePath = getTreePathFromPosition( oldPosition );
				newPosition = getPositionFromTreePath( newDoc, treePath );
				if ( oldPosition.node.canContainContent() ) {
					changedNodePairs.set( oldPosition.node, newPosition.node );
				}
				if ( newPosition.linearOffset !== undefined ) {
					newPosition.linearOffset = 0;
				}
				newLinearOffset = getOffsetFromPosition( newPosition );
				if ( priorNewLinearOffset > newLinearOffset ) {
					// Because retains are greedy, we might be trying to jump backwards here;
					// prevent that from happening
					newLinearOffset = priorNewLinearOffset;
				}

				newRemove = newDoc.getData( new ve.Range( priorNewLinearOffset, newLinearOffset ) );
				newInsert = stripContent( op.insert );
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
		newTx = new ve.dm.Transaction( newOps, oldTx.authorId );
		newTx.isDistorted = true;
		return { tx: newTx, changedNodePairs: changedNodePairs };
	}

	function getChunked( doc, node ) {
		var i, len, item, annList, ch, annListStr, commonAnnList, commonAnnListLen, chunks, start,
			texts = [],
			annLists = [],
			chars = [],
			lastAnnList = null,
			lastAnnListStr = null,
			data = doc.getData( node.getRange() );

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
	}

	function getUnchunked( chunked ) {
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
	}

	function getTokens( text ) {
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
	}

	function adaptTargetTexts( chunkedSource, targetTexts ) {
		var fullTokenList, i, iLen, tokenList, j, jLen, min, max,
			chunks = [],
			targetTokenLists = targetTexts.map( getTokens );

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
	}

	function processTranslation( doc, otherDoc, sourceNode, targetNode, chunkedSource, oldChunkedTarget, targetTexts ) {
		var mtTx,
			chunkedTarget = adaptTargetTexts( chunkedSource, targetTexts ),
			targetData = getUnchunked( chunkedTarget );
		if (
			JSON.stringify( chunkedSource ) === JSON.stringify( getChunked( doc, sourceNode ) ) &&
			JSON.stringify( oldChunkedTarget ) === JSON.stringify( getChunked( doc, targetNode ) )
		) {
			mtTx = ve.dm.TransactionBuilder.static.newFromReplacement(
				otherDoc,
				targetNode.getRange(),
				targetData
			);
			otherDoc.commit( mtTx );
		}
		changedNodePairs.delete( sourceNode );
	}

	function maybeTranslate( doc, otherDoc, changedNodePairs ) {
		setTimeout( function () {
			changedNodePairs.forEach( function ( targetNode, sourceNode ) {
				var chunkedSource, oldChunkedTarget;
				if (
					sourceNode.getAttribute( 'll-dirty' ) !== 'mt' &&
					sourceNode.getAttribute( 'll-dirty' ) !== 'edited' &&
					targetNode.getAttribute( 'll-dirty' ) !== 'edited'
				) {
					chunkedSource = getChunked( doc, sourceNode );
					oldChunkedTarget = getChunked( doc, targetNode );
					tr( doc.getLang(), otherDoc.getLang(), chunkedSource ).then(
						processTranslation.bind( null, doc, otherDoc, sourceNode, targetNode, chunkedSource, oldChunkedTarget )
					);
				} else {
					changedNodePairs.delete( sourceNode );
				}
			} );
		} );
	}
	throttledMaybeTranslate = ve.throttle( maybeTranslate, 2000 );

	function applyDistorted( doc, otherDoc, tx ) {
		var distortion;
		if ( !tx.isDistorted ) {
			distortion = distortTx( tx, doc, otherDoc );
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
				changedNodePairs.set( sourceNode, targetNode );

			} );
			otherDoc.commit( distortion.tx );
			throttledMaybeTranslate( doc, otherDoc, changedNodePairs );
		}
	}

	// Set up the platform and wait for i18n messages to load
	new ve.init.sa.Platform( ve.messagePaths ).getInitializedPromise()
		.fail( function () {
			$firstInstance.text( 'Sorry, this browser is not supported.' );
		} )
		.done( function () {
			// TODO use one target with two surfaces? But then they'd share one toolbar, do we want that?
			var firstTarget = new ve.init.sa.Target(),
				secondTarget = new ve.init.sa.Target(),
				firstDoc = makeDocument( 'en', '<p><b>Carbon dioxide</b> is a gas at <a href="#rtp">room temperature</a></p>' ),
				secondDoc = makeDocument( 'es', '<p></p>', firstDoc.getStore() );

			$firstInstance.append( firstTarget.$element );
			$secondInstance.append( secondTarget.$element );
			firstTarget.clearSurfaces();
			firstTarget.addSurface( firstDoc );
			secondTarget.clearSurfaces();
			secondTarget.addSurface( secondDoc );
			firstDoc.on( 'precommit', applyDistorted.bind( null, firstDoc, secondDoc ) );
			secondDoc.on( 'precommit', applyDistorted.bind( null, secondDoc, firstDoc ) );
		} );
}() );
