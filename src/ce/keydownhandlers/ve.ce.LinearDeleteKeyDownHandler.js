/*!
 * VisualEditor ContentEditable linear delete key down handler
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Delete key down handler for linear selections.
 *
 * @class
 * @extends ve.ce.KeyDownHandler
 *
 * @constructor
 */
ve.ce.LinearDeleteKeyDownHandler = function VeCeLinearDeleteKeyDownHandler() {
	// Parent constructor
	ve.ui.LinearDeleteKeyDownHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ce.LinearDeleteKeyDownHandler, ve.ce.KeyDownHandler );

/* Static properties */

ve.ce.LinearDeleteKeyDownHandler.static.name = 'linearDelete';

ve.ce.LinearDeleteKeyDownHandler.static.keys = [ OO.ui.Keys.BACKSPACE, OO.ui.Keys.DELETE ];

ve.ce.LinearDeleteKeyDownHandler.static.supportedSelections = [ 'linear' ];

/* Static methods */

/**
 * @inheritdoc
 *
 * The handler just schedules a poll to observe the native content removal, unless
 * one of the following is true:
 * - The ctrlKey is down; or
 * - The selection is expanded; or
 * - We are directly adjacent to an element node in the deletion direction.
 * In these cases, it will perform the content removal itself.
 */
ve.ce.LinearDeleteKeyDownHandler.static.execute = function ( surface, e ) {
	var docLength, startNode, tableEditingRange, position, skipNode, pairNode, linkNode, range,
		documentModelSelectedNodes, i, node, nodeRange, nodeOuterRange, matrix,
		direction = e.keyCode === OO.ui.Keys.DELETE ? 1 : -1,
		unit = ( e.altKey === true || e.ctrlKey === true ) ? 'word' : 'character',
		offset = 0,
		rangeToRemove = surface.getModel().getSelection().getRange(),
		documentModel = surface.getModel().getDocument(),
		data = documentModel.data;

	if ( direction === 1 && e.shiftKey && ve.getSystemPlatform() !== 'mac' ) {
		// Shift+Del on non-Mac platforms performs 'cut', so
		// don't handle it here.
		return;
	}

	// Use native behaviour then poll if collapsed, unless we are adjacent to some hard tag
	// (or CTRL is down, in which case we can't reliably predict whether the native behaviour
	// would delete far enough to remove some element)
	if ( rangeToRemove.isCollapsed() && !e.ctrlKey ) {
		position = ve.adjacentDomPosition(
			{
				node: surface.nativeSelection.focusNode,
				offset: surface.nativeSelection.focusOffset
			},
			direction
		);
		skipNode = position.steps[ position.steps.length - 1 ].node;
		if ( skipNode.nodeType === Node.TEXT_NODE ) {
			surface.eventSequencer.afterOne( {
				keydown: surface.surfaceObserver.pollOnce.bind( surface.surfaceObserver )
			} );
			return;
		}

		// If the native action would delete an outside nail, move *two* cursor positions
		// in the deletion direction, to get inside the link just past the inside nail,
		// then preventDefault
		if (
			direction > 0 ?
			skipNode.classList.contains( 've-ce-nail-pre-open' ) :
			skipNode.classList.contains( 've-ce-nail-post-close' )
		) {
			position = ve.adjacentDomPosition( position, direction );
			range = document.createRange();
			range.setStart( position.node, position.offset );
			surface.nativeSelection.removeAllRanges();
			surface.nativeSelection.addRange( range );
			surface.updateActiveLink();
			e.preventDefault();
			return;
		}

		// If inside an empty link, delete it and preventDefault
		if (
			skipNode.classList &&
			skipNode.classList.contains(
				direction > 0 ?
				've-ce-nail-pre-close' :
				've-ce-nail-post-open'
			) &&
			( pairNode = (
				direction > 0 ?
				skipNode.previousSibling :
				skipNode.nextSibling
			) ) &&
			pairNode.classList &&
			pairNode.classList.contains(
				direction > 0 ?
				've-ce-nail-post-open' :
				've-ce-nail-pre-close'
			)
		) {
			linkNode = skipNode.parentNode;
			range = document.createRange();
			range.setStart(
				linkNode.parentNode,
				// Link's offset, minus 1 to allow for outer nail deletion
				// (browsers actually tend to adjust range offsets automatically
				// for previous sibling deletion, but just in case ...)
				Array.prototype.indexOf.call(
					linkNode.parentNode.childNodes,
					linkNode
				) - 1
			);
			// Remove the outer nails, then the link itself
			linkNode.parentNode.removeChild( linkNode.previousSibling );
			linkNode.parentNode.removeChild( linkNode.nextSibling );
			linkNode.parentNode.removeChild( linkNode );

			surface.nativeSelection.removeAllRanges();
			surface.nativeSelection.addRange( range );
			surface.updateActiveLink();
			e.preventDefault();
			return;
		}

		// If the native action would delete an inside nail, move *two* cursor positions
		// in the deletion direction, to get outside the link just past the outside nail,
		// then preventDefault
		if (
			direction > 0 ?
			skipNode.classList.contains( 've-ce-nail-pre-close' ) :
			skipNode.classList.contains( 've-ce-nail-post-open' )
		) {
			position = ve.adjacentDomPosition( position, direction );
			range = document.createRange();
			range.setStart( position.node, position.offset );
			surface.nativeSelection.removeAllRanges();
			surface.nativeSelection.addRange( range );
			surface.updateActiveLink();
			e.preventDefault();
			return;
		}

		offset = rangeToRemove.start;
		if ( !e.ctrlKey && (
			( direction < 0 && !data.isElementData( offset - 1 ) ) ||
			( direction > 0 && !data.isElementData( offset ) )
		) ) {
			surface.eventSequencer.afterOne( {
				keydown: surface.surfaceObserver.pollOnce.bind( surface.surfaceObserver )
			} );
			return;
		}
	}

	// Else range is uncollapsed or is adjacent to a non-nail element.
	if ( rangeToRemove.isCollapsed() ) {
		// Expand rangeToRemove
		rangeToRemove = documentModel.getRelativeRange( rangeToRemove, direction, unit, true );
		tableEditingRange = surface.getActiveTableNode() ? surface.getActiveTableNode().getEditingRange() : null;
		if ( tableEditingRange && !tableEditingRange.containsRange( rangeToRemove ) ) {
			e.preventDefault();
			return;
		}

		// Prevent backspacing/deleting over table cells, select the cell instead
		documentModelSelectedNodes = documentModel.selectNodes( rangeToRemove, 'siblings' );
		for ( i = 0; i < documentModelSelectedNodes.length; i++ ) {
			node = documentModelSelectedNodes[ i ].node;
			nodeOuterRange = documentModelSelectedNodes[ i ].nodeOuterRange;
			if ( node instanceof ve.dm.TableNode ) {
				if ( rangeToRemove.containsOffset( nodeOuterRange.start ) ) {
					surface.getModel().setSelection( new ve.dm.TableSelection(
						documentModel, nodeOuterRange, 0, 0
					) );
				} else {
					matrix = node.getMatrix();
					surface.getModel().setSelection( new ve.dm.TableSelection(
						documentModel, nodeOuterRange, matrix.getColCount() - 1, matrix.getRowCount() - 1
					) );
				}
				e.preventDefault();
				return;
			}
		}

		offset = rangeToRemove.start;
		docLength = documentModel.getInternalList().getListNode().getOuterRange().start;
		if ( offset < docLength - 1 ) {
			while ( offset < docLength - 1 && data.isCloseElementData( offset ) ) {
				offset++;
			}
			// If the user tries to delete a focusable node from a collapsed selection,
			// just select the node and cancel the deletion.
			startNode = documentModel.getDocumentNode().getNodeFromOffset( offset + 1 );
			if ( startNode.isFocusable() ) {
				surface.getModel().setLinearSelection( startNode.getOuterRange() );
				e.preventDefault();
				return;
			}
		}
		if ( rangeToRemove.isCollapsed() ) {
			// For instance beginning or end of the document.
			startNode = documentModel.getDocumentNode().getNodeFromOffset( offset - 1 );
			nodeRange = startNode.getOuterRange();
			if (
				startNode.canContainContent() &&
				( nodeRange.start === 0 || nodeRange.end === docLength )
			) {
				// Content node at start or end of document, do nothing.
				e.preventDefault();
				return;
			} else {
				rangeToRemove = new ve.Range( nodeRange.start, rangeToRemove.start - 1 );
			}
		}
	}

	surface.getModel().getLinearFragment( rangeToRemove, true ).delete( direction ).select();
	// Rerender selection even if it didn't change
	// TODO: is any of this necessary?
	surface.focus();
	surface.surfaceObserver.clear();
	e.preventDefault();
	return;
};

/* Registration */

ve.ce.keyDownHandlerFactory.register( ve.ce.LinearDeleteKeyDownHandler );
