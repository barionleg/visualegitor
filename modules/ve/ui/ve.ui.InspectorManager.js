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
 */
ve.ui.InspectorManager = function VeUiInspectorManager( config ) {
	// Parent constructor
	ve.ui.InspectorManager.super.call( this, config );
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
