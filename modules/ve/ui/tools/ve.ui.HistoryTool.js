/*!
 * VisualEditor UserInterface HistoryTool classes.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * UserInterface history tool.
 *
 * @class
 * @extends ve.ui.Tool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.HistoryTool = function VeUiHistoryTool( toolGroup, config ) {
	// Parent constructor
	ve.ui.Tool.call( this, toolGroup, config );

	// Events
	this.toolbar.getSurface().getModel().connect( this, { 'history': 'onUpdateState' } );

	// Initialization
	this.setDisabled( true );
};

/* Inheritance */

OO.inheritClass( ve.ui.HistoryTool, ve.ui.Tool );

/* Static Properties */

/**
 * History action method to use.
 *
 * @abstract
 * @static
 * @property {string}
 * @inheritable
 */
ve.ui.HistoryTool.static.method = '';

/**
 * Surface model method to check state with.
 *
 * @abstract
 * @static
 * @property {string}
 * @inheritable
 */
ve.ui.HistoryTool.static.check = '';

/* Methods */

/**
 * Handle the tool being selected.
 *
 * @method
 */
ve.ui.HistoryTool.prototype.onSelect = function () {
	this.toolbar.getSurface().execute( 'history', this.constructor.static.method );
	this.setActive( false );
};

/** */
ve.ui.HistoryTool.prototype.onUpdateState = function () {
	// Parent method
	ve.ui.Tool.prototype.onUpdateState.apply( this, arguments );

	this.setDisabled( !this.toolbar.getSurface().getModel()[this.constructor.static.check]() );
};

/**
 * @inheritdoc
 */
ve.ui.HistoryTool.prototype.destroy = function () {
	this.toolbar.getSurface().getModel().disconnect( this );
	OO.ui.Tool.prototype.destroy.call( this );
};

/**
 * UserInterface undo tool.
 *
 * @class
 * @extends ve.ui.HistoryTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.UndoHistoryTool = function VeUiUndoHistoryTool( toolGroup, config ) {
	ve.ui.HistoryTool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.UndoHistoryTool, ve.ui.HistoryTool );
ve.ui.UndoHistoryTool.static.name = 'undo';
ve.ui.UndoHistoryTool.static.group = 'history';
ve.ui.UndoHistoryTool.static.icon = 'undo';
ve.ui.UndoHistoryTool.static.title =
	OO.ui.deferMsg( 'visualeditor-historybutton-undo-tooltip' );
ve.ui.UndoHistoryTool.static.method = 'undo';
ve.ui.UndoHistoryTool.static.check = 'hasPastState';
ve.ui.toolFactory.register( ve.ui.UndoHistoryTool );

/**
 * UserInterface redo tool.
 *
 * @class
 * @extends ve.ui.HistoryTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.RedoHistoryTool = function VeUiRedoHistoryTool( toolGroup, config ) {
	ve.ui.HistoryTool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.RedoHistoryTool, ve.ui.HistoryTool );
ve.ui.RedoHistoryTool.static.name = 'redo';
ve.ui.RedoHistoryTool.static.group = 'history';
ve.ui.RedoHistoryTool.static.icon = 'redo';
ve.ui.RedoHistoryTool.static.title =
	OO.ui.deferMsg( 'visualeditor-historybutton-redo-tooltip' );
ve.ui.RedoHistoryTool.static.method = 'redo';
ve.ui.RedoHistoryTool.static.check = 'hasFutureState';
ve.ui.toolFactory.register( ve.ui.RedoHistoryTool );
