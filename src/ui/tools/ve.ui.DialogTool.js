/*!
 * VisualEditor UserInterface DialogTool class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface dialog tool.
 *
 * @abstract
 * @class
 * @extends ve.ui.Tool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.DialogTool = function VeUiDialogTool() {
	// Parent constructor
	ve.ui.DialogTool.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.DialogTool, ve.ui.Tool );

/* Static Properties */

/**
 * Annotation or node models this tool is related to.
 *
 * Used by #isCompatibleWith.
 *
 * @static
 * @property {Function[]}
 * @inheritable
 */
ve.ui.DialogTool.static.modelClasses = [];

/**
 * @inheritdoc
 */
ve.ui.DialogTool.static.isCompatibleWith = function ( model ) {
	return ve.isInstanceOfAny( model, this.modelClasses );
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.DialogTool.prototype.onUpdateState = function () {
	// Parent method
	ve.ui.Tool.prototype.onUpdateState.apply( this, arguments );
	// Never show the tool as active
	this.setActive( false );
};

/**
 * Command help tool.
 *
 * @class
 * @extends ve.ui.DialogTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.CommandHelpDialogTool = function VeUiCommandHelpDialogTool() {
	ve.ui.CommandHelpDialogTool.super.apply( this, arguments );
};
OO.inheritClass( ve.ui.CommandHelpDialogTool, ve.ui.DialogTool );
ve.ui.CommandHelpDialogTool.static.name = 'commandHelp';
ve.ui.CommandHelpDialogTool.static.group = 'dialog';
ve.ui.CommandHelpDialogTool.static.icon = 'help';
ve.ui.CommandHelpDialogTool.static.title =
	OO.ui.deferMsg( 'visualeditor-dialog-command-help-title' );
ve.ui.CommandHelpDialogTool.static.autoAddToCatchall = false;
ve.ui.CommandHelpDialogTool.static.autoAddToGroup = false;
ve.ui.CommandHelpDialogTool.static.commandName = 'commandHelp';
ve.ui.toolFactory.register( ve.ui.CommandHelpDialogTool );

/**
 * Special character tool.
 *
 * @class
 * @extends ve.ui.DialogTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.SpecialCharacterDialogTool = function VeUiSpecialCharacterDialogTool() {
	ve.ui.SpecialCharacterDialogTool.super.apply( this, arguments );
};
OO.inheritClass( ve.ui.SpecialCharacterDialogTool, ve.ui.DialogTool );
ve.ui.SpecialCharacterDialogTool.static.name = 'specialCharacter';
ve.ui.SpecialCharacterDialogTool.static.group = 'dialog';
ve.ui.SpecialCharacterDialogTool.static.icon = 'special-character';
ve.ui.SpecialCharacterDialogTool.static.title =
	OO.ui.deferMsg( 'visualeditor-specialcharacter-button-tooltip' );
ve.ui.SpecialCharacterDialogTool.static.autoAddToCatchall = false;
ve.ui.SpecialCharacterDialogTool.static.autoAddToGroup = false;
ve.ui.SpecialCharacterDialogTool.static.commandName = 'specialCharacter';
ve.ui.toolFactory.register( ve.ui.SpecialCharacterDialogTool );
