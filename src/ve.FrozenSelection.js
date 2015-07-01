/*!
 * VisualEditor DOM selection-like class
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Like the DOM Selection object, but not updated live from the actual selection
 * @class
 *
 * @constructor
 * @param {Object} selection Selection-like object
 * @param {Node|null} anchorNode the Anchor node
 * @param {number|null} anchorOffset the Anchor offset
 * @param {Node|null} focusNode the Focus node
 * @param {number|null} focusOffset the Focusoffset
 * @param {boolean} [isCollapsed] Whether the anchor and focus are the same
 * @param {boolean} [isBackwards] Whether the focus is before the anchor in document order
 */
ve.FrozenSelection = function VeFrozenSelection( selection ) {
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
		// Set to false if nodes are null
		this.isBackwards = this.focusNode !== null && ve.compareDocumentOrder(
			this.focusNode,
			this.focusOffset,
			this.anchorNode,
			this.anchorOffset
		) < 0;
	}
};

/* Inheritance */

OO.initClass( ve.FrozenSelection );

/* Methods */

/**
 * Returns the selection with the anchor and focus swapped
 *
 * @returns {Object} selection with anchor/focus swapped. Object-identical to this if isCollapsed
 */
ve.FrozenSelection.prototype.flip = function () {
	if ( this.isCollapsed ) {
		return this;
	}
	return {
		anchorNode: this.focusNode,
		anchorOffset: this.focusOffset,
		focusNode: this.anchorNode,
		focusOffset: this.anchorOffset,
		isCollapsed: false,
		isBackwards: !this.isBackwards
	};
};

/**
 * Whether the selection represents is the same range as another DOM Selection-like object
 *
 * @param {Object} other DOM Selection-like object
 * @returns {boolean} True if the anchors/focuses are equal (including null)
 */
ve.FrozenSelection.prototype.equalsSelection = function ( other ) {
	return this.anchorNode === other.anchorNode &&
		this.anchorOffset === other.anchorOffset &&
		this.focusNode === other.focusNode &&
		this.focusOffset === other.focusOffset;
};

/**
 * Get a range representation of the selection
 *
 * N.B. Range objects do not show whether the selection is backwards
 *
 * @param {HTMLDocument} doc The owner document of the selection nodes
 * @returns {Range|null} Range
 */
ve.FrozenSelection.prototype.getNativeRange = function ( doc ) {
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
