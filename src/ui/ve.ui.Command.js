/*!
 * VisualEditor UserInterface Command class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Command that executes an action.
 *
 * @class
 *
 * @constructor
 * @param {string} name Symbolic name for the command
 * @param {string} action Action to execute when command is triggered
 * @param {string} method Method to call on action when executing
 * @param {object} [options] Command options
 * @param {string[]|null} [options.supportedSelections] List of supported selection types, or null for all
 * @param {Array} [options.data] Additional arguments to pass to the action when executing
 */
ve.ui.Command = function VeUiCommand( name, action, method, options ) {
	options = options || {};
	this.name = name;
	this.action = action;
	this.method = method;
	this.supportedSelections = options.supportedSelections || null;
	this.data = options.data || [];
};

/* Methods */

/**
 * Execute command on a surface.
 *
 * @param {ve.ui.Surface} surface Surface to execute command on
 * @returns {Mixed} Result of command execution.
 */
ve.ui.Command.prototype.execute = function ( surface ) {
	if ( this.supportsSelection( surface.getModel().getSelection() ) ) {
		return surface.execute.apply( surface, [ this.action, this.method ].concat( this.data ) );
	}
};

/**
 * Check if this command supports a given selection
 *
 * @param {ve.dm.Selection} selection Selection
 * @return {boolean} The command can execute on this selection
 */
ve.ui.Command.prototype.supportsSelection = function ( selection ) {
	return !this.supportedSelections ||
		ve.indexOf( selection.constructor.static.name, this.supportedSelections ) !== -1;
};

/**
 * Get command action.
 *
 * @returns {string} action Action to execute when command is triggered
 */
ve.ui.Command.prototype.getAction = function () {
	return this.action;
};

/**
 * Get command method.
 *
 * @returns {string} method Method to call on action when executing
 */
ve.ui.Command.prototype.getMethod = function () {
	return this.method;
};

/**
 * Get command name.
 *
 * @returns {string} name The symbolic name of the command.
 */
ve.ui.Command.prototype.getName = function () {
	return this.name;
};

/**
 * Get command data.
 *
 * @returns {Array} data Additional data to pass to the action when executing
 */
ve.ui.Command.prototype.getData = function () {
	return this.data;
};
