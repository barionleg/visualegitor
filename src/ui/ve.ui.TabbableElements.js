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
 * @cfg {boolean} [loop=true] Whether to loop between the start / end of the element set
 * @cfg {boolean} [trap=false] Whether to allow the focus to leave off the start / end of the element set
 * @cfg {Array} [elements] Initial set of elements to apply behavior to
 */
ve.ui.TabbableElements = function VeUiTabbableElements( config ) {
	config = $.extend( { loop: true, trap: false }, config );

	this.shouldLoop = config.loop;
	this.shouldTrap = config.trap;

	if ( config.elements ) {
		this.setElements( config.elements );
	}

	this.onElementKeyDownBound = this.onElementKeyDown.bind( this );
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

	$( elements ).on( 'keydown', this.onElementKeyDownBound );
};

/**
 * Add an element to the tabbable set
 *
 * @param {HTMLElement} element
 * @param {number} index
 */
ve.ui.TabbableElements.prototype.addElement = function ( element, index ) {
	this.setElements( this.elements.slice().splice( index, 0, element ) );
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
		if ( this.shouldLoop ) {
			if ( index < 0 ) {
				index = this.elements.length;
			} else {
				index = 0;
			}
		} else if ( this.shouldTrap ) {
			e.preventDefault();
			return;
		} else {
			return;
		}
	}

	e.preventDefault();
	this.elements[ index ].focus();
};
