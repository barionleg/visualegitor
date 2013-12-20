/*!
 * VisualEditor ContentEditable ClickableNode class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable clickable node.
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
ve.ce.ClickableNode.prototype.onDblClick = function () {
	var ceSurface = this.getRoot().getSurface(),
		veSurface = ceSurface.getSurface(),
		name;

	name = ve.ui.toolFactory.getToolForNode(
		ceSurface.getFocusedNode().getModel()
	);

	veSurface.execute( 'dialog', 'open', name );
};
