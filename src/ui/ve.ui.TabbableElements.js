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

	this.onRootKeyDownBound = this.onRootKeyDown.bind( this );

	if ( config.root ) {
		this.setTabRoot( config.root );
	}
};

/* Setup */

OO.initClass( ve.ui.TabbableElements );

/* Methods */

/**
 * Set the current root element for tabbing
 *
 * @param {HTMLElement[]} $root root element to scope tabIndex within
 */
ve.ui.TabbableElements.prototype.setTabRoot = function ( $root ) {
	if ( this.$root ) {
		this.$root.off( 'keydown', this.onRootKeyDownBound );
	}

	this.$root = $( $root ).on( 'keydown', this.onRootKeyDownBound );
};

/**
 * Build a list of elements in the current root, in tab order
 *
 * This mimics browser behavior: fetch focusable elements, sort by [tabIndex, DOM order]
 *
 * @return {HTMLElement[]} list of elements in the order they should be tabbed through
 */
ve.ui.TabbableElements.prototype.getElementsInRoot = function () {
	var elements = this.$root.find( '*' ).filter( function () {
		if ( this.tabIndex === -1 ) {
			// tabIndex -1 is focusable, but shouldn't appear to keyboard-navigation
			return false;
		}
		return OO.ui.isFocusableElement( $( this ) );
	} ).map( function ( index ) {
		return { element: this, index: index };
	} ).get();
	elements.sort( function ( a, b ) {
		if ( a.element.tabIndex < b.element.tabIndex ) {
			return -1;
		}
		if ( a.element.tabIndex > b.element.tabIndex ) {
			return 1;
		}
		return a.index - b.index;
	} );
	return elements.map( function ( data ) {
		return data.element;
	} );
};

/**
 * Handle keydown events on elements
 *
 * @private
 * @param {jQuery.Event} e
 */
ve.ui.TabbableElements.prototype.onRootKeyDown = function ( e ) {
	var elements, index;

	if ( e.which !== OO.ui.Keys.TAB ) {
		return;
	}

	elements = this.getElementsInRoot();
	index = elements.indexOf( e.target );

	if ( index === -1 ) {
		return;
	}

	index += e.shiftKey ? -1 : 1;

	if ( ( index < 0 || index >= elements.length ) ) {
		return;
	}

	e.preventDefault();
	elements[ index ].focus();
};

/**
 * Teardown tabbable elements manager
 *
 */
ve.ui.TabbableElements.prototype.teardown = function () {
	this.setRoot( [] );
};
