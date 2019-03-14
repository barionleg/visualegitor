/*!
 * VisualEditor ContentEditable ContentEditableNode class.
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * A ContentEditableNode maintains its own contentEditable property
 *
 * @class
 * @abstract
 *
 * @constructor
 */
ve.ce.ContentEditableNode = function VeCeContentEditableNode() {
	this.ceSurface = null;
	this.setContentEditable( true );

	this.connect( this, {
		root: 'onNodeRoot',
		unroot: 'onNodeUnroot'
	} );
};

/* Inheritance */

OO.initClass( ve.ce.ContentEditableNode );
// Assumes ve.ce.Node as a base class

/* Methods */

/**
 * Handle root events on the node
 *
 * @param {ve.ce.BranchNode} root Root node
 */
ve.ce.ContentEditableNode.prototype.onNodeRoot = function ( root ) {
	this.ceSurface = root.getSurface().getSurface();
	this.ceSurface.connect( this, { readOnly: 'onSurfaceReadOnly' } );
	// Set initial state
	this.setReadOnly( this.ceSurface.isReadOnly() );
};

/**
 * Handle unroot events on the node
 *
 * @param {ve.ce.BranchNode} oldRoot Old root node
 */
ve.ce.ContentEditableNode.prototype.onNodeUnroot = function () {
	this.ceSurface.disconnect( this, { readOnly: 'onSurfaceReadOnly' } );
	this.ceSurface = null;
};

/**
 * Handle readOnly events from the surface
 *
 * @param {boolean} readOnly Surface is read-only
 */
ve.ce.ContentEditableNode.prototype.onSurfaceReadOnly = function ( readOnly ) {
	this.setReadOnly( readOnly );
};

/**
 * Called when the surface read-only state changes
 *
 * @param {boolean} readOnly Surface is read-only
 */
ve.ce.ContentEditableNode.prototype.setReadOnly = function ( readOnly ) {
	this.$element.prop( 'spellcheck', !readOnly );
};

/**
 * Enable or disable editing on this node
 *
 * @param {boolean} enabled Whether to enable editing
 */
ve.ce.ContentEditableNode.prototype.setContentEditable = function ( enabled ) {
	this.$element.prop( 'contentEditable', ( !!enabled ).toString() );
};

/**
 * Check if the node is currently editable
 *
 * @return {boolean} Node is currently editable
 */
ve.ce.ContentEditableNode.prototype.isContentEditable = function () {
	return this.$element.prop( 'contentEditable' ) === 'true';
};
