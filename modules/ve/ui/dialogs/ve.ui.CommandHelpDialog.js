/*!
 * VisualEditor UserInterface CommandHelpDialog class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Dialog listing all command keyboard shortcuts.
 *
 * @class
 * @extends ve.ui.Dialog
 *
 * @constructor
 * @param {ve.ui.WindowSet} windowSet Window set this dialog is part of
 * @param {Object} [config] Configuration options
 */
ve.ui.CommandHelpDialog = function VeUiCommandHelpDialog( windowSet, config ) {
	// Parent constructor
	ve.ui.Dialog.call( this, windowSet, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.CommandHelpDialog, ve.ui.Dialog );

/* Static Properties */

ve.ui.CommandHelpDialog.static.name = 'commandHelp';

ve.ui.CommandHelpDialog.static.titleMessage = 'visualeditor-dialog-command-help-title';

ve.ui.CommandHelpDialog.static.icon = 'help';

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.CommandHelpDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.Dialog.prototype.initialize.call( this );

	var name,
		$list = this.$( '<ul>' ).addClass( 've-ui-commandHelpDialog-list' ),
		triggers = this.surface.getTriggers();

	for ( name in triggers ) {
		$list.append(
			this.$( '<li>' ).text( name + ': ' + triggers[name].getMessage() )
		);
	}

	this.$body.append( $list );
};

/* Registration */

ve.ui.dialogFactory.register( ve.ui.CommandHelpDialog );
