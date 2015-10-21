/*!
 * VisualEditor annotated text content state chunk class
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Uniformly annotated chunk of text content
 *
 * @class
 *
 * @constructor
 * @param {string} text Plain text
 * @param {Node[]} tags Annotation tags in force
 * @param {string} type If this is a unicorn then 'unicorn', else 'text'
 */
ve.ce.TextStateChunk = function VeCeTextState( text, tags, type ) {
	/**
	 * @property {string} text The plain text of this chunk
	 */
	this.text = text;

	/**
	 * @property {Node[]} tags The annotation elements open at this chunk
	 */
	this.tags = tags;

	/**
	 * @property {string} type The chunk type: 'text' or 'unicorn'
	 */
	this.type = type;
};

/**
 * Test whether this chunk has the same annotations as another.
 *
 * @param {ve.ce.TextStateChunk} other The other chunk
 * @return {boolean} Whether the chunks have the same annotations
 */
ve.ce.TextStateChunk.prototype.isEqualTags = function ( other ) {
	var i, len, thisTag, otherTag;
	if ( this.tags === other.tags ) {
		return true;
	}
	if ( this.tags.length !== other.tags.length ) {
		return false;
	}
	for ( i = 0, len = this.tags.length; i < len; i++ ) {
		thisTag = this.tags[ i ];
		otherTag = other.tags[ i ];
		if ( !( thisTag === otherTag || (
			// TODO: Improve this test?
			thisTag.nodeName === otherTag.nodeName &&
			thisTag.getAttribute( 'class' ) === otherTag.getAttribute( 'class' ) &&
			thisTag.getAttribute( 'typeof' ) === otherTag.getAttribute( 'typeof' ) &&
			thisTag.getAttribute( 'property' ) === otherTag.getAttribute( 'property' )
		) ) ) {
			return false;
		}
	}
	return true;
};

/**
 * Test whether this chunk is equal to another chunk
 *
 * @param {ve.ce.TextStateChunk} other The other chunk
 * @return {boolean} Whether the chunks are equal
 */
ve.ce.TextStateChunk.prototype.isEqual = function ( other ) {
	return this.text === other.text && this.type === other.type && this.isEqualTags( other );
};
