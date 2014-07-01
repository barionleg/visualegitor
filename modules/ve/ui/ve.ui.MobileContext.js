/*!
 * VisualEditor UserInterface MobileContext class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * UserInterface context that displays inspector full screen.
 *
 * @class
 * @extends ve.ui.Context
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Configuration options
 */
ve.ui.MobileContext = function VeUiMobileContext( surface, config ) {
	config = $.extend( { '$contextOverlay': surface.$globalOverlay }, config );

	// Parent constructor
	ve.ui.Context.call( this, surface, config );

	// Properties
	this.transitioning = null;

	// Events
	this.inspectors.connect( this, {
		'setup': 'show',
		'teardown': 'hide'
	} );

	// Initialization
	this.$element
		.addClass( 've-ui-mobileContext' )
		.append( this.context.$element );

	this.surface.$globalOverlay
		.append( this.inspectors.$element );
};

/* Inheritance */

OO.inheritClass( ve.ui.MobileContext, ve.ui.Context );

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MobileContext.prototype.toggle = function ( show ) {
	var promise;

	if ( this.transitioning ) {
		return this.transitioning;
	}
	show = show === undefined ? !this.visible : !!show;
	if ( show === this.visible ) {
		return $.Deferred().resolve().promise();
	}

	this.visible = show;
	this.transitioning = this.surface.toggleGlobalOverlay( show );
	promise = this.transitioning.promise();

	this.transitioning.then( ve.bind( function () {
		this.$element.toggleClass( 've-ui-mobileContext-visible', show );
		this.transitioning.resolve();
		this.transitioning = null;
		this.visible = show;
	}, this ) );

	return promise;
};
