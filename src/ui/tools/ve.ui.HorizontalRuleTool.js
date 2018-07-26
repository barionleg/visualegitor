/*!
 * VisualEditor UserInterface HorizontalRuleTool classes.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 * @license The MIT License (MIT); see LICENSE.txt
 */

/* Tools */

ve.ui.InsertHorizontalRuleTool = function VeUiInsertHorizontalRuleTool() {
	ve.ui.InsertHorizontalRuleTool.super.apply( this, arguments );
};
OO.inheritClass( ve.ui.InsertHorizontalRuleTool, ve.ui.Tool );
ve.ui.InsertHorizontalRuleTool.static.name = 'insertHorizontalRule';
ve.ui.InsertHorizontalRuleTool.static.group = 'insert';
ve.ui.InsertHorizontalRuleTool.static.icon = 'subtract';
ve.ui.InsertHorizontalRuleTool.static.title = OO.ui.deferMsg( 'visualeditor-insert-horizontalrule' );
ve.ui.InsertHorizontalRuleTool.static.commandName = 'insertHorizontalRule';
ve.ui.toolFactory.register( ve.ui.InsertHorizontalRuleTool );
