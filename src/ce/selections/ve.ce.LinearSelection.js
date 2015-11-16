/*!
 * VisualEditor Linear Selection class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @extends ve.ce.Selection
 * @constructor
 * @param {ve.ce.Surface} surface
 * @param {ve.dm.Selection} model
 */
ve.ce.LinearSelection = function VeCeLinearSelection() {
	// Parent constructor
	ve.ce.LinearSelection.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ce.LinearSelection, ve.ce.Selection );

/* Static Properties */

ve.ce.LinearSelection.static.name = 'linear';

/* Method */

/**
 * @inheritdoc
 */
ve.ce.LinearSelection.prototype.getSelectionRects = function () {
	var i, l, range, nativeRange, surfaceRect, focusedNode, rect,
		surface = this.getSurface(),
		rects = [],
		relativeRects = [];

	range = this.getModel().getRange();
	focusedNode = surface.getFocusedNode( range );

	if ( focusedNode ) {
		return focusedNode.getRects();
	}

	nativeRange = surface.getNativeRange( range );
	if ( !nativeRange ) {
		return null;
	}

	// Calling getClientRects sometimes fails:
	// * in Firefox on page load when the address bar is still focused
	// * in empty paragraphs
	try {
		rects = RangeFix.getClientRects( nativeRange );
		if ( !rects.length ) {
			throw new Error( 'getClientRects returned empty list' );
		}
	} catch ( e ) {
		rect = surface.getNodeClientRectFromRange( nativeRange );
		if ( rect ) {
			rects = [ rect ];
		}
	}

	surfaceRect = surface.getSurface().getBoundingClientRect();
	if ( !rects || !surfaceRect ) {
		return null;
	}

	for ( i = 0, l = rects.length; i < l; i++ ) {
		relativeRects.push( ve.translateRect( rects[ i ], -surfaceRect.left, -surfaceRect.top ) );
	}
	return relativeRects;
};

/**
 * @inheritdoc
 */
ve.ce.LinearSelection.prototype.getSelectionStartAndEndRects = function () {
	var range, focusedNode,
		surface = this.getSurface();

	range = this.getModel().getRange();
	focusedNode = surface.getFocusedNode( range );

	if ( focusedNode ) {
		return focusedNode.getStartAndEndRects();
	}

	return ve.getStartAndEndRects( this.getSelectionRects() );
};

/**
 * @inheritdoc
 */
ve.ce.LinearSelection.prototype.getSelectionBoundingRect = function () {
	var range, nativeRange, boundingRect, surfaceRect, focusedNode,
		surface = this.getSurface();

	range = this.getModel().getRange();
	focusedNode = surface.getFocusedNode( range );

	if ( focusedNode ) {
		return focusedNode.getBoundingRect();
	}

	nativeRange = surface.getNativeRange( range );
	if ( !nativeRange ) {
		return null;
	}

	try {
		boundingRect = RangeFix.getBoundingClientRect( nativeRange );
		if ( !boundingRect ) {
			throw new Error( 'getBoundingClientRect returned null' );
		}
	} catch ( e ) {
		boundingRect = surface.getNodeClientRectFromRange( nativeRange );
	}

	surfaceRect = surface.getSurface().getBoundingClientRect();
	if ( !boundingRect || !surfaceRect ) {
		return null;
	}
	return ve.translateRect( boundingRect, -surfaceRect.left, -surfaceRect.top );
};

/* Registration */

ve.ce.selectionFactory.register( ve.ce.LinearSelection );
