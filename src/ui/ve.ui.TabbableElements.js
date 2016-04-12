/*!
 * VisualEditor TabbableElements class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Tabbable Elements mixin constructor
 *
 * @class
 * @constructor
 *
 * @param {Object} [config] Configuration options
 * @cfg {Array} [elements] Initial set of elements to apply behavior to
 */
ve.ui.TabbableElements = function VeUiTabbableElements( config ) {
	config = $.extend( {}, config );

	this.onElementKeyDownBound = this.onElementKeyDown.bind( this );

	if ( config.elements ) {
		this.setElements( config.elements );
	}
};

/* Setup */

OO.initClass( ve.ui.TabbableElements );

/* Methods */

/**
 * Set the elements to be tabbed between
 *
 * @param {HTMLElement[]} elements list of elements in the order they should be tabbed through
 */
ve.ui.TabbableElements.prototype.setElements = function ( elements ) {
	$( this.elements ).off( 'keydown', this.onElementKeyDownBound );

	this.elements = elements;

	$( this.elements ).on( 'keydown', this.onElementKeyDownBound )
		// Apply a tabindex to anything not already focusable
		.filter( function () {
			return !OO.ui.isFocusableElement( $( this ) );
		} )
		.prop( 'tabIndex', 0 );
};

/**
 * Add an element to the tabbable set
 *
 * @param {number} index
 * @param {...HTMLElement} elements
 */
ve.ui.TabbableElements.prototype.addElements = function () {
	var elements = arguments.slice(),
		index = elements.shift();
	this.setElements( ve.batchSplice( this.elements.slice(), index, 0, elements ) );
};

/**
 * Remove an element from the tabbable set
 *
 * @param {HTMLElement} element
 */
ve.ui.TabbableElements.prototype.removeElement = function ( element ) {
	this.setElements( this.elements.slice().splice( this.elements.indexOf( element ), 1 ) );
};

/**
 * Handle keydown events on elements
 *
 * @private
 * @param {jQuery.Event} e
 */
ve.ui.TabbableElements.prototype.onElementKeyDown = function ( e ) {
	var index = this.elements.indexOf( e.currentTarget );

	if ( e.which !== OO.ui.Keys.TAB ) {
		return;
	}

	if ( index === -1 ) {
		return;
	}

	index += e.shiftKey ? -1 : 1;

	if ( ( index < 0 || index >= this.elements.length ) ) {
		return;
	}

	e.preventDefault();
	this.elements[ index ].focus();
};

/**
 * Teardown tabbable elements manager
 *
 */
ve.ui.TabbableElements.prototype.teardown = function () {
	this.setElements( [] );
};
