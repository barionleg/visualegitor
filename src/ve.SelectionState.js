/*!
 * VisualEditor DOM selection-like class
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Like the DOM Selection object, but not updated live from the actual selection
 *
 * WARNING: the Nodes are still live and mutable, which can change the meaning
 * of the offsets or invalidate the value of isBackwards.
 *
 * @class
 *
 * @constructor
 * @param {ve.SelectionState|Selection|Object} selection DOM Selection-like object
 * @param {Node|null} selection.anchorNode The anchor node (null if no selection)
 * @param {number} selection.anchorOffset The anchor offset (0 if no selection)
 * @param {Node|null} selection.focusNode The focus node (null if no selection)
 * @param {number} selection.focusOffset The focus offset (0 if no selection)
 * @param {boolean} [selection.isCollapsed] Whether the anchor and focus are the same
 * @param {boolean} [selection.isBackwards] Whether the focus is before the anchor in document order
 */
ve.SelectionState = function VeSelectionState( selection ) {
	this.anchorNode = selection.anchorNode;
	this.anchorOffset = selection.anchorOffset;
	this.focusNode = selection.focusNode;
	this.focusOffset = selection.focusOffset;

	this.isCollapsed = selection.isCollapsed;
	if ( this.isCollapsed === undefined ) {
		// Set to true if nodes are null (matches DOM Selection object's behaviour)
		this.isCollapsed = this.anchorNode === this.focusNode &&
			this.anchorOffset === this.focusOffset;
	}
	this.isBackwards = selection.isBackwards;
	if ( this.isBackwards === undefined ) {
		// Set to false if nodes are null or focus is no earlier than anchor
		this.isBackwards = ve.compareDocumentOrder(
			this.focusNode,
			this.focusOffset,
			this.anchorNode,
			this.anchorOffset
		) < 0;
	}
};

/* Inheritance */

OO.initClass( ve.SelectionState );

/* Static methods */

/**
 * Create a selection state object representing no selection
 *
 * @return {ve.SelectionState} Object representing no selection
 */
ve.SelectionState.static.newNullSelection = function () {
	return new ve.SelectionState( {
		focusNode: null,
		focusOffset: 0,
		anchorNode: null,
		anchorOffset: 0
	} );
};

/* Methods */

/**
 * Whether the selection is null
 *
 * @return {boolean} true if the focusNode is null (in which case the anchorNode should be null too)
 */
ve.SelectionState.prototype.isNull = function () {
	return this.focusNode === null;
};

/**
 * Returns the selection with the anchor and focus swapped
 *
 * @return {ve.SelectionState} selection with anchor/focus swapped. Object-identical to this if isCollapsed
 */
ve.SelectionState.prototype.flip = function () {
	if ( this.isCollapsed ) {
		return this;
	}
	return new ve.SelectionState( {
		anchorNode: this.focusNode,
		anchorOffset: this.focusOffset,
		focusNode: this.anchorNode,
		focusOffset: this.anchorOffset,
		isCollapsed: false,
		isBackwards: !this.isBackwards
	} );
};

/**
 * Whether this and another DOM Selection-like object have the same anchor and the same focus
 *
 * @param {Object} other DOM Selection-like object
 * @return {boolean} True if the anchors and focuses are equal (including null)
 */
ve.SelectionState.prototype.equalsSelection = function ( other ) {
	return this.anchorNode === other.anchorNode &&
		this.anchorOffset === other.anchorOffset &&
		this.focusNode === other.focusNode &&
		this.focusOffset === other.focusOffset;
};

/**
 * Whether this and another DOM Selection-like object have the same anchor/focus (possibly flipped)
 *
 * @param {Object} other DOM Selection-like object
 * @return {boolean} True if the anchors and focuses are equal (including null) or equal flipped
 */
ve.SelectionState.prototype.equalsRange = function ( other ) {
	return (
		this.anchorNode === other.anchorNode &&
		this.anchorOffset === other.anchorOffset &&
		this.focusNode === other.focusNode &&
		this.focusOffset === other.focusOffset
	) || (
		this.anchorNode === other.focusNode &&
		this.anchorOffset === other.focusOffset &&
		this.focusNode === other.anchorNode &&
		this.focusOffset === other.anchorOffset
	);
};

/**
 * Get a range representation of the selection
 *
 * N.B. Range objects do not show whether the selection is backwards
 *
 * @param {HTMLDocument} doc The owner document of the selection nodes
 * @return {Range|null} Range
 */
ve.SelectionState.prototype.getNativeRange = function ( doc ) {
	var range;
	if ( this.anchorNode === null ) {
		return null;
	}
	range = doc.createRange();
	if ( this.isBackwards ) {
		range.setStart( this.focusNode, this.focusOffset );
		range.setEnd( this.anchorNode, this.anchorOffset );
	} else {
		range.setStart( this.anchorNode, this.anchorOffset );
		if ( !this.isCollapsed ) {
			range.setEnd( this.focusNode, this.focusOffset );
		}
	}
	return range;
};
