/*!
 * VisualEditor CommandRegistry class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Command registry.
 *
 * @class
 * @extends OO.Registry
 * @constructor
 */
ve.ui.CommandRegistry = function VeCommandRegistry() {
	// Parent constructor
	OO.Registry.call( this );
};

/* Inheritance */

OO.inheritClass( ve.ui.CommandRegistry, OO.Registry );

/* Methods */

/**
 * Register a constructor with the factory.
 *
 * @method
 * @param {ve.ui.Command} command Command object
 * @throws {Error} If command is not an instance of ve.ui.Command
 */
ve.ui.CommandRegistry.prototype.register = function ( command ) {
	// Validate arguments
	if ( !( command instanceof ve.ui.Command ) ) {
		throw new Error(
			'command must be an instance of ve.ui.Command, cannot be a ' + typeof command
		);
	}

	OO.Registry.prototype.register.call( this, command.getName(), command );
};

/**
 * Returns the primary command for for node.
 *
 * @param {ve.ce.Node} node Node to get command for
 * @returns {ve.ui.Command}
 */
ve.ui.CommandRegistry.prototype.getCommandForNode = function ( node ) {
	return this.lookup( node.constructor.static.primaryCommandName );
};

/* Initialization */

ve.ui.commandRegistry = new ve.ui.CommandRegistry();

/* Registrations */

ve.ui.commandRegistry.register(
	new ve.ui.Command( 'undo', 'history', 'undo' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'redo', 'history', 'redo' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'bold', 'annotation', 'toggle',
		{ data: ['textStyle/bold'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'italic', 'annotation', 'toggle',
		{ data: ['textStyle/italic'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'code', 'annotation', 'toggle',
		{ data: ['textStyle/code'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'strikethrough', 'annotation', 'toggle',
		{ data: ['textStyle/strikethrough'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'underline', 'annotation', 'toggle',
		{ data: ['textStyle/underline'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'subscript', 'annotation', 'toggle',
		{ data: ['textStyle/subscript'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'superscript', 'annotation', 'toggle',
		{ data: ['textStyle/superscript'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'link', 'window', 'open',
		{ data: ['link'], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'specialcharacter', 'window', 'open',
		{ data: ['specialcharacter'], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'clear', 'annotation', 'clearAll',
		{ supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'indent', 'indentation', 'increase',
		{ supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'outdent', 'indentation', 'decrease',
		{ supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'number', 'list', 'toggle',
		{ data: ['number'], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'bullet', 'list', 'toggle',
		{ data: ['bullet'], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'commandHelp', 'window', 'open', { data: ['commandHelp'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'code', 'annotation', 'toggle',
		{ data: ['textStyle/code'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'strikethrough', 'annotation', 'toggle',
		{ data: ['textStyle/strikethrough'], supportedSelections: ['linear', 'table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'language', 'window', 'open',
		{ data: ['language'], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'paragraph', 'format', 'convert',
		{ data: ['paragraph'], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'heading1', 'format', 'convert',
		{ data: ['heading', { level: 1 } ], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'heading2', 'format', 'convert',
		{ data: ['heading', { level: 2 } ], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'heading3', 'format', 'convert',
		{ data: ['heading', { level: 3 } ], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'heading4', 'format', 'convert',
		{ data: ['heading', { level: 4 } ], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'heading5', 'format', 'convert',
		{ data: ['heading', { level: 5 } ], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'heading6', 'format', 'convert',
		{ data: ['heading', { level: 6 } ], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'preformatted', 'format', 'convert',
		{ supportedSelections: ['linear'], data: ['preformatted'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'pasteSpecial', 'content',
		{ supportedSelections: ['linear', 'table'], data: ['pasteSpecial'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'comment', 'window', 'open',
		{ data: ['comment'], supportedSelections: ['linear'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'insertTable', 'table', 'create',
		{
			data: [ {
				header: true,
				rows: 3,
				cols: 4
			} ],
			supportedSelections: ['linear']
		}
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'deleteTable', 'table', 'delete',
		{ data: ['table'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'insertRowBefore', 'table', 'insert',
		{ data: ['row', 'before'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'insertRowAfter', 'table', 'insert',
		{ data: ['row', 'after'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'deleteRow', 'table', 'delete',
		{ data: ['row'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'insertColumnBefore', 'table', 'insert',
		{ data: ['col', 'before'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'insertColumnAfter', 'table', 'insert',
		{ data: ['col', 'after'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'deleteColumn', 'table', 'delete',
		{  data: ['col'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'tableCellHeader', 'table', 'changeCellStyle',
		{ data: ['header'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'tableCellData', 'table', 'changeCellStyle',
		{ data: ['data'], supportedSelections: ['table'] }
	)
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'mergeCells', 'table', 'mergeCells', { supportedSelections: ['table'] } )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'tableCaption', 'table', 'caption', { supportedSelections: ['table'] } )
);
