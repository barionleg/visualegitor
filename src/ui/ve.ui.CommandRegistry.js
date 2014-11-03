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
	new ve.ui.Command( 'undo', 'history', 'undo', null )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'redo', 'history', 'redo', null )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'bold', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/bold' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'italic', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/italic' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'code', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/code' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'strikethrough', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/strikethrough' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'underline', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/underline' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'subscript', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/subscript' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'superscript', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/superscript' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'link', 'window', 'open', ['linear'], 'link' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'specialcharacter', 'window', 'open', ['linear'], 'specialcharacter' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'clear', 'annotation', 'clearAll', ['linear', 'table'] )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'indent', 'indentation', 'increase', ['linear'] )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'outdent', 'indentation', 'decrease', ['linear'] )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'number', 'list', 'toggle', ['linear'], 'number' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'bullet', 'list', 'toggle', ['linear'], 'bullet' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'commandHelp', 'window', 'open', null, 'commandHelp' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'code', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/code' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'strikethrough', 'annotation', 'toggle', ['linear', 'table'], 'textStyle/strikethrough' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'language', 'window', 'open', ['linear'], 'language' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'paragraph', 'format', 'convert', ['linear'], 'paragraph' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'heading1', 'format', 'convert', ['linear'], 'heading', { level: 1 } )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'heading2', 'format', 'convert', ['linear'], 'heading', { level: 2 } )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'heading3', 'format', 'convert', ['linear'], 'heading', { level: 3 } )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'heading4', 'format', 'convert', ['linear'], 'heading', { level: 4 } )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'heading5', 'format', 'convert', ['linear'], 'heading', { level: 5 } )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'heading6', 'format', 'convert', ['linear'], 'heading', { level: 6 } )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'preformatted', 'format', 'convert', ['linear'], 'preformatted' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'pasteSpecial', 'content', ['linear', 'table'], 'pasteSpecial' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'comment', 'window', 'open', ['linear'], 'comment' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'insertTable', 'table', 'create', ['linear'], {
		header: true,
		rows: 3,
		cols: 4
	} )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'deleteTable', 'table', 'delete', ['table'], 'table' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'insertRowBefore', 'table', 'insert', ['table'], 'row', 'before' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'insertRowAfter', 'table', 'insert', ['table'], 'row', 'after' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'deleteRow', 'table', 'delete', ['table'], 'row' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'insertColumnBefore', 'table', 'insert', ['table'], 'col', 'before' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'insertColumnAfter', 'table', 'insert', ['table'], 'col', 'after' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'deleteColumn', 'table', 'delete', ['table'], 'col' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'tableCellHeader', 'table', 'changeCellStyle', ['table'], 'header' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'tableCellData', 'table', 'changeCellStyle', ['table'], 'data' )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'mergeCells', 'table', 'mergeCells', ['table'] )
);
ve.ui.commandRegistry.register(
	new ve.ui.Command( 'tableCaption', 'table', 'caption', ['table'] )
);
