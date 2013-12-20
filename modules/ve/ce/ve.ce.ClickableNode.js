/*!
 * VisualEditor ContentEditable ClickableNode class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable clickable node.
 * Whatever node this is being mixed into must emit a dblclick event
 *
 * @class
 * @abstract
 *
 * @constructor
 */
ve.ce.ClickableNode = function VeCeClickableNode() {
	// Events
	this.connect( this, { 'dblclick': 'onDblClick' } );

};
/**
 * Finds and opens the tool for the double clicked node
 *
 */
ve.ce.ClickableNode.prototype.onDblClick = function () {
	var surface = this.getRoot().getSurface(),
		surfaceView = surface.getSurface(),
		name = ve.ui.toolFactory.getToolForNode(
			surface.getFocusedNode().getModel()
		);
	if ( ve.ui.dialogFactory.lookup( name ) ) {
		surfaceView.execute( 'dialog', 'open', name );
	} else if ( ve.ui.inspectorFactory.lookup( name ) ) {
		surfaceView.execute( 'inspector', 'open', name );
	}
};
