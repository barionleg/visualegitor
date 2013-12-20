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
	var ceSurface = this.getRoot().getSurface(),
		uiSurface = ceSurface.getSurface(),
		name;

	name = ve.ui.toolFactory.getToolForNode(
		ceSurface.getFocusedNode().getModel()
	);
	if ( ve.ui.dialogFactory.lookup( name ) ) {
		uiSurface.execute( 'dialog', 'open', name );
	} else if ( ve.ui.inspectorFactory.lookup( name ) ) {
		uiSurface.execute( 'inspector', 'open', name );
	}
};
