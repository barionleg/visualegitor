/*!
 * VisualEditor UserInterface ve.ui.HelpCompletionAction class.
 *
 * @copyright 2011-2021 VisualEditor Team and others; see http://ve.mit-license.org
 */

( function () {
	/**
	 * HelpCompletionAction action.
	 *
	 * Controls autocompletion of anything from the help panel
	 *
	 * @class
	 * @extends ve.ui.CompletionAction
	 * @constructor
	 * @param {ve.ui.Surface} surface Surface to act on
	 */
	ve.ui.HelpCompletionAction = function ( surface ) {
		var action = this;

		// Parent constructor
		ve.ui.HelpCompletionAction.super.call( this, surface );

		this.tools = ve.extendObject( {}, ve.init.target.getToolbar().tools, ve.init.target.getActions().tools );
		this.toolNames = Object.keys( this.tools ).filter( function ( toolName ) {
			var tool = action.tools[ toolName ];
			// Ignore tools which just open other tool groups
			return tool &&
				!( tool instanceof OO.ui.ToolGroupTool ) &&
				!( tool instanceof OO.ui.PopupTool );
		} );
	};

	/* Inheritance */

	OO.inheritClass( ve.ui.HelpCompletionAction, ve.ui.CompletionAction );

	/* Static Properties */

	ve.ui.HelpCompletionAction.static.name = 'HelpCompletion';

	ve.ui.HelpCompletionAction.static.alwaysIncludeInput = false;

	ve.ui.HelpCompletionAction.static.methods = OO.copy( ve.ui.HelpCompletionAction.static.methods );
	ve.ui.HelpCompletionAction.static.methods.push( 'insertAndOpen' );

	ve.ui.HelpCompletionAction.static.defaultLimit = 99;

	/* Methods */

	var sequence;

	ve.ui.HelpCompletionAction.prototype.insertAndOpen = function () {
		var inserted = false,
			surfaceModel = this.surface.getModel(),
			fragment = surfaceModel.getFragment();

		// This is opening a window in a slightly weird way, so the normal logging
		// doesn't catch it. This assumes that the only way to get here is from
		// the tool. If we add other paths, we'd need to change the logging.
		ve.track(
			'activity.' + this.constructor.static.name,
			{ action: 'window-open-from-tool' }
		);

		// Run the sequence matching logic again to check
		// if we already have the sequence inserted at the
		// current offset.
		if ( fragment.getSelection().isCollapsed() ) {
			inserted = this.surface.getView().findMatchingSequences().some( function ( item ) {
				return item.sequence === sequence;
			} );
		}

		if ( !inserted ) {
			fragment.insertContent( '\\' );
		}
		fragment.collapseToEnd().select();

		return this.open();
	};

	ve.ui.HelpCompletionAction.prototype.getToolTitle = function ( toolName ) {
		var tool = this.tools[ toolName ];
		var title = '';
		if ( tool.elementGroup instanceof OO.ui.PopupToolGroup ) {
			title += tool.elementGroup.getTitle() + ' > ';
		}
		title += tool.getTitle();

		return title;
	};

	ve.ui.HelpCompletionAction.prototype.getSuggestions = function ( input ) {
		var action = this,
			deferred = ve.createDeferred();

		return deferred.resolve( this.filterSuggestionsForInput(
			this.toolNames,
			input,
			function ( toolName ) {
				return action.getToolTitle( toolName ).toLowerCase().indexOf( input ) !== -1;
			}
		) );
	};

	ve.ui.HelpCompletionAction.prototype.getMenuItemForSuggestion = function ( toolName ) {
		var tool = this.tools[ toolName ];
		return new OO.ui.MenuOptionWidget( {
			data: tool,
			label: this.getToolTitle( toolName ),
			// HACK: an invalid icon name will render as a spacer for alignment
			icon: tool.getIcon() || '_',
			disabled: tool.isDisabled()
		} );
	};

	ve.ui.HelpCompletionAction.prototype.getHeaderLabel = function () {
		return ve.msg( 'visualeditor-dialog-command-help-title' );
	};

	ve.ui.HelpCompletionAction.prototype.onChoose = function ( item, range ) {
		// We're completely ignoring the idea that we should be "inserting" anything...
		// Instead, we run the command that was chosen.

		var fragment = this.surface.getModel().getLinearFragment( range, true );
		fragment.removeContent();
		fragment.collapseToEnd();

		var tool = item.getData();
		tool.onSelect();

		return true;
	};

	ve.ui.HelpCompletionAction.prototype.shouldAbandon = function ( input ) {
		// TODO: need to consider whether pending loads from server are happening here
		return ve.ui.HelpCompletionAction.super.prototype.shouldAbandon.apply( this, arguments ) && input.split( /\s+/ ).length > 2;
	};

	/* Registration */

	ve.ui.actionFactory.register( ve.ui.HelpCompletionAction );

	var openCommand = new ve.ui.Command(
		'openHelpCompletions', ve.ui.HelpCompletionAction.static.name, 'open',
		{ supportedSelections: [ 'linear' ] }
	);
	var insertAndOpenCommand = new ve.ui.Command(
		'insertAndOpenHelpCompletions', ve.ui.HelpCompletionAction.static.name, 'insertAndOpen',
		{ supportedSelections: [ 'linear' ] }
	);
	sequence = new ve.ui.Sequence( 'autocompleteHelpCommands', 'openHelpCompletions', '\\', 0 );
	ve.ui.commandRegistry.register( openCommand );
	ve.ui.commandRegistry.register( insertAndOpenCommand );
	// ve.ui.wikitextCommandRegistry.register( openCommand );
	// ve.ui.wikitextCommandRegistry.register( insertAndOpenCommand );
	ve.ui.sequenceRegistry.register( sequence );
	// ve.ui.wikitextSequenceRegistry.register( sequence );
}() );
