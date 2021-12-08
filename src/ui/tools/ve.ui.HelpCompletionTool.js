ve.ui.HelpCompletionTool = function() {
	// Parent constructor
	ve.ui.HelpCompletionTool.super.apply( this, arguments );
}

OO.inheritClass( ve.ui.HelpCompletionTool, ve.ui.Tool );

// Static
ve.ui.HelpCompletionTool.static.commandName = 'insertAndOpenHelpCompletions';
ve.ui.HelpCompletionTool.static.name = 'helpCompletion';
ve.ui.HelpCompletionTool.static.icon = 'help';
ve.ui.HelpCompletionTool.static.title = OO.ui.deferMsg( 'discussiontools-replywidget-mention-tool-title' );
ve.ui.HelpCompletionTool.static.autoAddToCatchall = false;

ve.ui.toolFactory.register( ve.ui.HelpCompletionTool );
