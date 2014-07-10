/*!
 * VisualEditor UserInterface InspectorManager class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Window manager for inspectors.
 *
 * @class
 * @extends OO.ui.WindowManager
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {ve.ui.Overlay} [overlay] Overlay to use for menus
 */
ve.ui.InspectorManager = function VeUiInspectorManager( config ) {
	// Configuration initialization
	config = config || {};

	// Parent constructor
	ve.ui.InspectorManager.super.call( this, config );

	// Properties
	this.overlay = config.overlay || null;
};

/* Inheritance */

OO.inheritClass( ve.ui.InspectorManager, OO.ui.WindowManager );

/* Static Properties */

ve.ui.InspectorManager.static.sizes = {
	'small': {
		'width': 200,
		'maxHeight': '100%'
	},
	'medium': {
		'width': 300,
		'maxHeight': '100%'
	},
	'large': {
		'width': 400,
		'maxHeight': '100%'
	},
	'full': {
		/* These can be non-numeric because they are never used in calculations */
		'width': '100%',
		'height': '100%'
	}
};

/* Methods */

/**
 * Get overlay for menus.
 *
 * @return {ve.ui.Overlay|null} Menu overlay, null if none was configured
 */
ve.ui.InspectorManager.prototype.getOverlay = function () {
	return this.overlay;
};

/**
 * @inheritdoc
 */
ve.ui.InspectorManager.prototype.getSetupDelay = function () {
	return 0;
};

/**
 * @inheritdoc
 */
ve.ui.InspectorManager.prototype.getReadyDelay = function () {
	return 0;
};

/**
 * @inheritdoc
 */
ve.ui.InspectorManager.prototype.getHoldDelay = function () {
	return 0;
};

/**
 * @inheritdoc
 */
ve.ui.InspectorManager.prototype.getTeardownDelay = function () {
	return 0;
};
