/*!
 * VisualEditor UserInterface RemoveTool class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface node remove tool.
 *
 * @class
 * @abstract
 * @extends ve.ui.Tool
 *
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.RemoveTool = function VeUiRemoveTool( toolGroup, config ) {
	// Parent constructor
	ve.ui.RemoveTool.call( this, toolGroup, ve.extendObject( { flags: [ 'destructive' ] }, config ) );
};

/* Inheritance */

OO.inheritClass( ve.ui.RemoveTool, ve.ui.Tool );

/* Static Properties */

ve.ui.RemoveTool.static.name = 'remove';

ve.ui.RemoveTool.static.icon = 'remove';

ve.ui.RemoveTool.static.title = OO.ui.deferMsg( 'visualeditor-dialog-action-remove' );

ve.ui.RemoveTool.static.commandName = 'remove';

ve.ui.RemoveTool.static.group = 'object';

ve.ui.RemoveTool.static.autoAddToCatchall = false;

ve.ui.RemoveTool.static.autoAddToGroup = false;

/* Static Methods */

ve.ui.RemoveTool.static.isCompatibleWith = function ( model ) {
	return ve.isTouchScreen && model && model.isFocusable && model.isFocusable();
};

ve.ui.RemoveTool.static.getTitle = function () {
	return ve.msg( 'visualeditor-dialog-action-remove' );
};

/* Registration */

ve.ui.toolFactory.register( ve.ui.RemoveTool );
