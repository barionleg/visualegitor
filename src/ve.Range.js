/*!
 * VisualEditor Range class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 *
 * @constructor
 * @param {number} from Anchor offset
 * @param {number} [to=from] Focus offset
 */
ve.Range = function VeRange( from, to ) {
	this.from = from || 0;
	this.to = to === undefined ? this.from : to;
	this.start = this.from < this.to ? this.from : this.to;
	this.end = this.from < this.to ? this.to : this.from;
};

/* Inheritance */

OO.initClass( ve.Range );

/**
 * @property {number} from Starting offset
 */

/**
 * @property {number} to Ending offset
 */

/**
 * @property {number} start Starting offset (the lesser of #to and #from)
 */

/**
 * @property {number} end Ending offset (the greater of #to and #from)
 */

/* Static Methods */

/**
 * Create a new range from a JSON serialization of a range
 *
 * @see ve.Range#toJSON
 *
 * @param {string} json JSON serialization
 * @return {ve.Range} New range
 */
ve.Range.static.newFromJSON = function ( json ) {
	return this.newFromHash( JSON.parse( json ) );
};

/**
 * Create a new range from a range hash object
 *
 * @see ve.Range#toJSON
 *
 * @param {Object} hash Hash object
 * @return {ve.Range} New range
 */
ve.Range.static.newFromHash = function ( hash ) {
	return new ve.Range( hash.from, hash.to );
};

/**
 * Create a range object that covers all of the given ranges.
 *
 * @static
 * @param {Array} ranges Array of ve.Range objects (at least one)
 * @param {boolean} backwards Return a backwards range
 * @return {ve.Range} Range that spans all of the given ranges
 */
ve.Range.static.newCoveringRange = function ( ranges, backwards ) {
	var minStart, maxEnd, i, range;
	if ( !ranges || ranges.length === 0 ) {
		throw new Error( 'newCoveringRange() requires at least one range' );
	}
	minStart = ranges[ 0 ].start;
	maxEnd = ranges[ 0 ].end;
	for ( i = 1; i < ranges.length; i++ ) {
		if ( ranges[ i ].start < minStart ) {
			minStart = ranges[ i ].start;
		}
		if ( ranges[ i ].end > maxEnd ) {
			maxEnd = ranges[ i ].end;
		}
	}
	if ( backwards ) {
		range = new ve.Range( maxEnd, minStart );
	} else {
		range = new ve.Range( minStart, maxEnd );
	}
	return range;
};

/* Methods */

/**
 * Get a clone.
 *
 * @return {ve.Range} Clone of range
 */
ve.Range.prototype.clone = function () {
	return new this.constructor( this.from, this.to );
};

/**
 * Check if an offset is within the range.
 *
 * Specifically we mean the whole element at a specific offset, so in effect
 * this is the same as #containsRange( new ve.Range( offset, offset + 1 ) ).
 *
 * @param {number} offset Offset to check
 * @return {boolean} If offset is within the range
 */
ve.Range.prototype.containsOffset = function ( offset ) {
	return offset >= this.start && offset < this.end;
};

/**
 * Check if another range is within the range.
 *
 * @param {ve.Range} range Range to check
 * @return {boolean} If other range is within the range
 */
ve.Range.prototype.containsRange = function ( range ) {
	return range.start >= this.start && range.end <= this.end;
};

/**
 * Get the length of the range.
 *
 * @return {number} Length of range
 */
ve.Range.prototype.getLength = function () {
	return this.end - this.start;
};

/**
 * Gets a range with reversed direction.
 *
 * @return {ve.Range} A new range
 */
ve.Range.prototype.flip = function () {
	return new ve.Range( this.to, this.from );
};

/**
 * Get a range that's a translated version of this one.
 *
 * @param {number} distance Distance to move range by
 * @return {ve.Range} New translated range
 */
ve.Range.prototype.translate = function ( distance ) {
	return new ve.Range( this.from + distance, this.to + distance );
};

/**
 * Check if two ranges are equal, taking direction into account.
 *
 * @param {ve.Range|null} other
 * @return {boolean}
 */
ve.Range.prototype.equals = function ( other ) {
	return other && this.from === other.from && this.to === other.to;
};

/**
 * Check if two ranges are equal, ignoring direction.
 *
 * @param {ve.Range|null} other
 * @return {boolean}
 */
ve.Range.prototype.equalsSelection = function ( other ) {
	return other && this.end === other.end && this.start === other.start;
};

/**
 * Create a new range with a truncated length.
 *
 * @param {number} limit Maximum length of new range (negative for left-side truncation)
 * @return {ve.Range} A new range
 */
ve.Range.prototype.truncate = function ( limit ) {
	if ( limit >= 0 ) {
		return new ve.Range(
			this.start, Math.min( this.start + limit, this.end )
		);
	} else {
		return new ve.Range(
			Math.max( this.end + limit, this.start ), this.end
		);
	}
};

/**
 * Expand a range to include another range, preserving direction.
 *
 * @param {ve.Range} other Range to expand to include
 * @return {ve.Range} Range covering this range and other
 */
ve.Range.prototype.expand = function ( other ) {
	return ve.Range.static.newCoveringRange( [ this, other ], this.isBackwards() );
};

/**
 * Check if the range is collapsed.
 *
 * A collapsed range has equal start and end values making its length zero.
 *
 * @return {boolean} Range is collapsed
 */
ve.Range.prototype.isCollapsed = function () {
	return this.from === this.to;
};

/**
 * Check if the range is backwards, i.e. from > to
 *
 * @return {boolean} Range is backwards
 */
ve.Range.prototype.isBackwards = function () {
	return this.from > this.to;
};

/**
 * Get a object summarizing the range for JSON serialization
 *
 * @return {Object} Object for JSON serialization
 */
ve.Range.prototype.toJSON = function () {
	return {
		type: 'range',
		from: this.from,
		to: this.to
	};
};
