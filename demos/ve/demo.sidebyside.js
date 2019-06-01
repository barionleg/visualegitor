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
	function tr( sourceLang, targetLang, sourceText ) {
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
			data: { q: sourceText, markUnknown: 'no', langpair: langPair }
		} ).then( function ( data ) {
			return data.responseData.translatedText;
		} );
	}

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
		// for ( [ sourceNode, targetNode ] of changedNodePairs ) {
		changedNodePairs.forEach( function ( targetNode, sourceNode ) {
			var sourceText, oldTargetText;
			if (
				sourceNode.getAttribute( 'll-dirty' ) !== 'mt' &&
				sourceNode.getAttribute( 'll-dirty' ) !== 'edited' &&
				targetNode.getAttribute( 'll-dirty' ) !== 'edited'
			) {
				sourceText = getText( doc, sourceNode );
				oldTargetText = getText( doc, targetNode );
				tr( doc.getLang(), otherDoc.getLang(), sourceText ).then(
					processTranslation.bind( null, doc, otherDoc, sourceNode, targetNode, sourceText, oldTargetText )
				);
			} else {
				changedNodePairs.delete( sourceNode );
			}
		} );
	}

	function processTranslation( doc, otherDoc, sourceNode, targetNode, sourceText, oldTargetText, targetText ) {
		var mtTx;
		if (
			sourceText === getText( doc, sourceNode ) &&
			oldTargetText === getText( doc, targetNode )
		) {
			mtTx = ve.dm.TransactionBuilder.static.newFromReplacement(
				otherDoc,
				targetNode.getRange(),
				targetText.split( '' )
			);
			otherDoc.commit( mtTx );
		}
		changedNodePairs.delete( sourceNode );
	}

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
