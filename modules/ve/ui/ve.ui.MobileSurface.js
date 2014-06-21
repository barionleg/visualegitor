/*!
 * VisualEditor UserInterface MobileSurface class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * A surface is a top-level object which contains both a surface model and a surface view.
 * This is the mobile version of the surface.
 *
 * @class
 * @extends ve.ui.Surface
 *
 * @constructor
 * @param {HTMLDocument|Array|ve.dm.LinearData|ve.dm.Document} dataOrDoc Document data to edit
 * @param {Object} [config] Configuration options
 */
ve.ui.MobileSurface = function VeUiMobileSurface() {
	// Parent constructor
	ve.ui.Surface.apply( this, arguments );

	// Events
	this.dialogs.connect( this, {
		'setup': [ 'toggleGlobalOverlay', true ],
		'teardown': [ 'toggleGlobalOverlay', false ]
	} );

	// Initialization
	this.$globalOverlay
		.append( this.context.$element )
		.addClass( 've-ui-mobileSurface-overlay ve-ui-mobileSurface-overlay-global' );
};

/* Inheritance */

OO.inheritClass( ve.ui.MobileSurface, ve.ui.Surface );

/* Methods */

/**
 * @inheridoc
 */
ve.ui.MobileSurface.prototype.createContext = function () {
	return new ve.ui.MobileContext( this, { '$': this.$ } );
};

/**
 * Toggle context visibility.
 *
 * @param {boolean} [show] Show context, omit to toggle
 * @return {jQuery.Promise} Promise resolved when context is shown/hidden
 */
ve.ui.MobileSurface.prototype.toggleGlobalOverlay = function ( show ) {
	var promise;

	if ( this.globalOverlayTransitioning ) {
		return this.globalOverlayTransitioning;
	}
	show = show === undefined ? !this.globalOverlayVisible : !!show;
	if ( show === this.globalOverlayVisible ) {
		return $.Deferred().resolve().promise();
	}

	this.globalOverlayTransitioning = $.Deferred();
	promise = this.globalOverlayTransitioning.promise();

	// Save/restore scroll position
	if ( show ) {
		this.scrollPos = $( 'body' ).scrollTop();
	} else {
		$( 'body' ).scrollTop( this.scrollPos );
	}

	// Toggle classes
	$( 'html, body' ).toggleClass( 've-ui-mobileSurface-overlay-global-enabled', show );
	this.$globalOverlay.toggleClass( 've-ui-mobileSurface-overlay-global-visible', show );

	// Wait for CSS animations to complete
	setTimeout( ve.bind( function () {
		this.globalOverlayTransitioning.resolve();
		this.globalOverlayTransitioning = null;
		this.globalOverlayVisible = show;
	}, this ), 300 );

	return promise;
};
