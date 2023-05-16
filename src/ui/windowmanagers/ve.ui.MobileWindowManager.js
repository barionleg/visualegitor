/*!
 * VisualEditor UserInterface MobileWindowManager class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Window manager for mobile windows.
 *
 * @class
 * @extends ve.ui.SurfaceWindowManager
 *
 * @constructor
 * @param {ve.ui.Surface} surface Surface this belongs to
 * @param {Object} [config] Configuration options
 * @cfg {ve.ui.Overlay} [overlay] Overlay to use for menus
 */
ve.ui.MobileWindowManager = function VeUiMobileWindowManager( surface, config ) {
	// Parent constructor
	ve.ui.MobileWindowManager.super.call( this, surface, config );

	// Initialization
	this.$element.addClass( 've-ui-mobileWindowManager' );
};

/* Inheritance */

OO.inheritClass( ve.ui.MobileWindowManager, ve.ui.SurfaceWindowManager );

/* Static Properties */

// Only allow 'small' and 'full' sizes, defaulting to 'full'
ve.ui.MobileWindowManager.static.sizes = {
	small: ve.ui.MobileWindowManager.super.static.sizes.small,
	// 'context' mode makes the window stick to the bottom of the screen like
	// context items. This should not be used while a virtual keyboard may be in use.
	context: { width: '100%' },
	full: ve.ui.MobileWindowManager.super.static.sizes.full
};

ve.ui.MobileWindowManager.static.defaultSize = 'full';

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MobileWindowManager.prototype.updateWindowSize = function ( win ) {
	ve.ui.MobileWindowManager.super.prototype.updateWindowSize.apply( this, arguments );

	// Bypass for non-current, and thus invisible, windows
	if ( win !== this.currentWindow ) {
		return;
	}

	// TODO: Fix upstream
	this.$element.toggleClass( 'oo-ui-windowManager-size-context', win.getSize() === 'context' );

	return this;
};
