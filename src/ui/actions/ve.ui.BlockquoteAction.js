/*!
 * VisualEditor UserInterface BlockquoteAction class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Blockquote action.
 *
 * @class
 * @extends ve.ui.Action
 * @constructor
 * @param {ve.ui.Surface} surface Surface to act on
 */
ve.ui.BlockquoteAction = function VeUiBlockquoteAction() {
	// Parent constructor
	ve.ui.BlockquoteAction.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.BlockquoteAction, ve.ui.Action );

/* Static Properties */

ve.ui.BlockquoteAction.static.name = 'blockquote';

/**
 * List of allowed methods for the action.
 *
 * @static
 * @property
 */
ve.ui.BlockquoteAction.static.methods = [ 'wrap', 'unwrap', 'toggle' ];

/* Methods */

/**
 * Check if the current selection is wrapped in a blockquote.
 *
 * @method
 * @return {boolean} Current selection is wrapped in a blockquote
 */
ve.ui.BlockquoteAction.prototype.isWrapped = function () {
	var fragment = this.surface.getModel().getFragment();
	return fragment.hasMatchingAncestor( 'blockquote' );
};

/**
 * Toggle a blockquote around content.
 *
 * @method
 * @return {boolean} Action was executed
 */
ve.ui.BlockquoteAction.prototype.toggle = function () {
	return this[ this.isWrapped() ? 'unwrap' : 'wrap' ]();
};

/**
 * Add a blockquote around content (only if it has no blockquote already).
 *
 * @method
 * @return {boolean} Action was executed
 */
ve.ui.BlockquoteAction.prototype.wrap = function () {
	var
		surfaceModel = this.surface.getModel(),
		selection = surfaceModel.getSelection(),
		fragment = surfaceModel.getFragment( null, true );

	if ( !( selection instanceof ve.dm.LinearSelection ) ) {
		return false;
	}

	// Expand to cover entire paragraphs
	fragment = fragment.expandLinearSelection( 'siblings' );
	if ( fragment.getSelectedNode() && fragment.getSelectedNode().isContent() ) {
		fragment = fragment.expandLinearSelection( 'parent' );
	}

	// Wrap everything in a blockquote
	fragment.wrapAllNodes( { type: 'blockquote' } );

	return true;
};

/**
 * Remove blockquote around content (if present).
 *
 * @method
 * @return {boolean} Action was executed
 */
ve.ui.BlockquoteAction.prototype.unwrap = function () {
	var
		surfaceModel = this.surface.getModel(),
		selection = surfaceModel.getSelection(),
		fragment = surfaceModel.getFragment( null, true );

	if ( !( selection instanceof ve.dm.LinearSelection ) ) {
		return false;
	}

	if ( !this.isWrapped() ) {
		return false;
	}

	fragment
		// Expand to cover entire blockquote
		.expandLinearSelection( 'closest', ve.dm.BlockquoteNode )
		// Unwrap it
		.unwrapNodes( 0, 1 );

	return true;
};

/* Registration */

ve.ui.actionFactory.register( ve.ui.BlockquoteAction );
