/*!
 * VisualEditor minimal demo
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

( function () {
	/* eslint-disable no-jquery/no-global-selector */
	var $firstInstance = $( '.ve-instance' ).eq( 0 ),
		$secondInstance = $( '.ve-instance' ).eq( 1 );
	/* eslint-enable no-jquery/no-global-selector */

	function makeDocument( html ) {
		return ve.dm.converter.getModelFromDom(
			ve.createDocumentFromHtml( html ),
			// Optional: Document language, directionality (ltr/rtl)
			{ lang: $.i18n().locale, dir: $( document.body ).css( 'direction' ) }
		);
	}

	function upperCaseDataItem( dataItem ) {
		if ( dataItem.type ) {
			return dataItem;
		}
		if ( dataItem.length ) {
			return [ dataItem[ 0 ].toUpperCase() ].concat( dataItem.slice( 1 ) );
		}
		return dataItem.toUpperCase();
	}

	// HACK temporary placeholder
	function distortTxFake( oldTx ) {
		return new ve.dm.Transaction( oldTx.operations.map( function ( op ) {
			if ( op.type === 'replace' ) {
				return {
					type: 'replace',
					remove: op.remove.map( upperCaseDataItem ),
					insert: op.insert.map( upperCaseDataItem )
				};
			}
			return op;
		} ) );
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
		var i, len, op, oldPosition, newPosition, treePath, newRemove, newInsert, priorNewLinearOffset,
			oldLinearOffset = 0, newLinearOffset = 0,
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
		return new ve.dm.Transaction( newOps, oldTx.authorId );
	}

	function applyDistorted( doc, otherDoc, tx ) {
		var otherTx;
		if ( !tx.isDistorted ) {
			otherTx = distortTx( tx, doc, otherDoc );
			otherTx.isDistorted = true;
			otherDoc.commit( otherTx );
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
				firstDoc = makeDocument( '<h1>Bilingual editing</h1><p>Try editing on either side, changing the text and the structure.</p><ol><li>One</li><li>Two</li><li>Three</li></ol>' ),
				secondDoc = makeDocument( '<h1>Tweetalig bewerken</h1><p>Probeer aan beide kanten te bewerken. Verander de tekst en ook de structuur.</p><ol><li>Eén</li><li>Twee</li><li>Drie</li></ol>' );

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
