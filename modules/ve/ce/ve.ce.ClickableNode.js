/*!
 * VisualEditor ContentEditable ClickableNode class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Node mixin that responds to click events
 * Node this is mixed into must emit a dblclick event
 *
 * @abstract
 * @class
 *
 * @constructor
 */
ve.ce.ClickableNode = function VeCeClickableNode() {
	// Events
	this.connect( this, { 'dblclick': 'onDblClick' } );
};

/**
 * Finds and opens the tool for the double clicked node
 */
ve.ce.ClickableNode.prototype.onDblClick = function () {
	var command = ve.ui.commandRegistry.getCommandForNode( this );
	if ( command ) {
		command.execute( this.surface.getSurface() );
	}
	console.log( 'tool name', ve.ui.toolFactory.getToolForNode( this.getModel() ) );
	/*
	var surface = this.getRoot().getSurface(),
		surfaceView = surface.getSurface(),
		name = ve.ui.toolFactory.getToolForNode( this.getModel() );

	if ( ve.ui.dialogFactory.lookup( name ) ) {
		surfaceView.execute( 'dialog', 'open', name );
	} else if ( ve.ui.inspectorFactory.lookup( name ) ) {
		surfaceView.execute( 'inspector', 'open', name );
	}
	*/
};
