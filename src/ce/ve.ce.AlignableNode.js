/*!
 * VisualEditor ContentEditable AlignableNode class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable Alignable node.
 *
 * @class
 * @abstract
 *
 * @constructor
 */
ve.ce.AlignableNode = function VeCeAlignableNode( $alignable, config ) {
	config = config || {};

	this.$alignable = $alignable || this.$element;

	var align = this.model.getAttribute( 'align' );
	if ( align ) {
		this.$alignable.addClass( 've-align-' + align );
		this.emit( 'align', align );
	}

	this.model.connect( this, { attributeChange: 'onAlignableAttributeChange' } );
};

/* Inheritance */

OO.initClass( ve.ce.AlignableNode );

/* Events */

/**
 * @event align
 * @param {string} align New alignment, 'left', 'right' or 'center'
 */

ve.ce.AlignableNode.prototype.onAlignableAttributeChange = function ( key, from, to ) {
	if ( key === 'align' ) {
		if ( from ) {
			this.$alignable.removeClass( 've-align-' + from );
		}
		if ( to ) {
			this.$alignable.addClass( 've-align-' + to );
		}
		this.emit( 'align', to );
	}
};
