/*!
 * VisualEditor minimal demo
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

( function () {
	/* eslint-disable no-jquery/no-global-selector */
	var $firstInstance = $( '.ve-instance' ).eq( 0 ),
		$secondInstance = $( '.ve-instance' ).eq( 1 ),
		changedNodePairs = new Map(),
		throttledMaybeTranslate = ve.throttle( maybeTranslate, 2000 );
	/* eslint-enable no-jquery/no-global-selector */

	/**
	 * Port changes to content data
	 *
	 * @param {Array} src1 Original linear data for source paragraph
	 * @param {Array} tgt1 Original linear data for target paragraph
	 * @param {ve.dm.Transaction} srcTx Change to the source paragraph from src1 to current state
	 * @param {ve.dm.Transaction} tgtTx Change to the source paragraph from tgt1 to current state
	 * @return {ve.dm.Transaction} Change to the target paragraph
	 */
	function port( src1, tgt1, srcTx, tgtTx ) {
	}

	/**
	 * Translate a plain text string
	 *
	 * @param {string} langPair apertium language pair, e.g. 'eng|spa'
	 * @param {string} source text
	 * @return {Promise} target text
	 */
	window.tr = function ( sourceLang, targetLang, sourceText ) {
		var langPair,
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
		return $.ajax( {
			url: 'https://apertium.wmflabs.org/translate',
			datatype: 'json',
			data: { q: sourceText, markUnknown: 'no', langpair: langPair },
		} ).then( function ( data ) {
			return data.responseData.translatedText;
		} );
	};

	function makeDocument( lang, html ) {
		return ve.dm.converter.getModelFromDom(
			ve.createDocumentFromHtml( html ),
			// Optional: Document language, directionality (ltr/rtl)
			{ lang: lang, dir: $( document.body ).css( 'direction' ) }
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

	function distortTx( oldTx, oldDoc, newDoc, changedNodePairs ) {
		var i, len, op, oldPosition, newPosition, treePath, newRemove, newInsert,
			priorNewLinearOffset, newTx,
			oldLinearOffset = 0,
			newLinearOffset = 0,
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
			} else {
				newOps.push( ve.copy( op ) );
			}
		}
		newTx = new ve.dm.Transaction( newOps, oldTx.authorId );
		newTx.isDistorted = true;
		return newTx;
	}

	function getText( doc, node ) {
		return doc.getData( node.getRange() ).map( function ( item ) {
			if ( item.type ) {
				return '';
			} else if ( Array.isArray( item ) ) {
				return item[ 0 ];
			} else {
				return item;
			}
		} ).join( '' );
	}

	function maybeTranslate( doc, otherDoc, changedNodePairs ) {
		var sourceNode, targetNode, sourceText;
		for ( [ sourceNode, targetNode ] of changedNodePairs ) {
			sourceText = getText( doc, sourceNode );
			oldTargetText = getText( doc, targetNode );
			tr( doc.getLang(), otherDoc.getLang(), sourceText ).then(
				processTranslation.bind( null, doc, otherDoc, sourceNode, targetNode, sourceText, oldTargetText )
			);
		}
	}

	function processTranslation( doc, otherDoc, sourceNode, targetNode, sourceText, oldTargetText, targetText ) {
		var mtTx;
		if (
			sourceText !== getText( doc, sourceNode ) ||
			oldTargetText !== getText( doc, targetNode )
		) {
			return;
		}
		mtTx = ve.dm.TransactionBuilder.static.newFromReplacement(
			otherDoc,
			targetNode.getRange(),
			targetText.split( '' )
		);
		otherDoc.commit( mtTx );
		changedNodePairs.delete( sourceNode );
	}

	function applyDistorted( doc, otherDoc, tx ) {
		var distortion, otherTx, sourceNode, targetNode;
		if ( !tx.isDistorted ) {
			newTx = distortTx( tx, doc, otherDoc, changedNodePairs );
			otherDoc.commit( newTx );
			throttledMaybeTranslate( doc, otherDoc, changedNodePairs );
		}
	}

	// Set up the platform and wait for i18n messages to load
	new ve.init.sa.Platform( ve.messagePaths ).getInitializedPromise()
		.fail( function () {
			$firstInstance.text( 'Sorry, this browser is not supported.' );
		} )
		.done( function () {
			var firstTarget = new ve.init.sa.Target(),
				secondTarget = new ve.init.sa.Target(),
				firstDoc = makeDocument( 'en', '<h1>Bilingual editing</h1><p>Try editing on either side, changing the text and the structure.</p><ol><li>One</li><li>Two</li><li>Three</li></ol>' ),
				secondDoc = makeDocument( 'es', '<h1>Tweetalig bewerken</h1><p>Probeer aan beide kanten te bewerken. Verander de tekst en ook de structuur.</p><ol><li>Eén</li><li>Twee</li><li>Drie</li></ol>' );

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
