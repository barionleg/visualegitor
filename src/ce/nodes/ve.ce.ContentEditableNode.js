/*!
 * VisualEditor ContentEditable ContentEditableNode class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
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
	this.$element.prop( { contentEditable: 'true', spellcheck: true } );
	this.contentEditableParent = null;
	this.connect( this, {
		attach: 'onNodeAttach',
		detach: 'onNodeDetach'
	} );
};

/* Inheritance */

OO.initClass( ve.ce.ContentEditableNode );
// Assumes ve.ce.Node as a base class

/* Methods */

ve.ce.ContentEditableNode.prototype.onNodeAttach = function () {
	var node = this.parent;

	while ( node && !node.isContentEditable ) {
		node = node.parent;
	}
	this.contentEditableParent = node;
	if ( this.contentEditableParent ) {
		this.contentEditableParent.connect( this, {
			contentEditable: 'onContentEditableParentContentEditable'
		} );
	}
	// TODO: A giant hole in this logic is that attaching the parent to a grandparent won't
	// trigger 'attach' and so won't set this.contentEditableParent
};

ve.ce.ContentEditableNode.prototype.onNodeDetach = function () {
	if ( this.contentEditableParent ) {
		this.contentEditableParent.disconnect( this, {
			contentEditable: 'onContentEditableParentContentEditable'
		} );
	}
	this.contentEditableParent = null;
	// TODO: A giant hole in this logic is that detaching the parent from the grandparent
	// won't trigger 'detach' and so won't clear this.contentEditableParent
};

/**
 * Called when the documentNode is enabled / disabled
 */
ve.ce.ContentEditableNode.prototype.onContentEditableParentContentEditable = function () {
	this.setContentEditable( this.contentEditableParent.isContentEditable() );
};

/**
 * Enable or disable editing on this node
 *
 * @param {boolean} enabled Whether to enable editing
 */
ve.ce.ContentEditableNode.prototype.setContentEditable = function ( enabled ) {
	if ( enabled === this.isContentEditable() ) {
		return;
	}
	this.$element.prop( 'contentEditable', enabled ? 'true' : 'false' );
	this.emit( 'contentEditable' );
};

/**
 * Get whether editing is enabled on this node
 *
 * @return {boolean} Whether to editing is enabled
 */
ve.ce.ContentEditableNode.prototype.isContentEditable = function () {
	return this.$element.prop( 'contentEditable' ) === 'true';
};
