/*!
 * VisualEditor ContentEditable ContentEditableNode class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * A ContentEditableNode maintains its own contentEditable=true property
 *
 * @class
 * @abstract
 *
 * @constructor
 */
ve.ce.ContentEditableNode = function VeCeContentEditableNode() {
	this.$element.prop( { contentEditable: 'true', spellcheck: true } );
};

/* Inheritance */

OO.initClass( ve.ce.ContentEditableNode );
// Assumes ve.ce.Node as a base class

/* Methods */

ve.ce.ContentEditableNode.prototype.setRoot = function ( newRoot ) {
	var setRoot,
		oldRoot = this.getRoot();

	if ( newRoot === oldRoot ) {
		return;
	}
	if ( oldRoot ) {
		oldRoot.disconnect( this, { setDisabled: 'onRootSetDisabled' } );
	}

	// Get the base setRoot method (the one below this mixin in the class hierarchy)
	setRoot = ve.getSuperMethod(
		this.constructor,
		'setRoot',
		ve.ce.ContentEditableNode.prototype.setRoot
	);
	setRoot.call( this, newRoot );

	if ( newRoot ) {
		newRoot.connect( this, { setDisabled: 'onRootSetDisabled' } );
	}
};

/**
 * Called when the documentNode is enabled / disabled
 */
ve.ce.ContentEditableNode.prototype.onRootSetDisabled = function () {
	this.setDisabled( this.getRoot().isDisabled() );
};

/**
 * Enable or disable editing on this node
 *
 * @param {boolean} disabled Whether to disable editing
 */
ve.ce.ContentEditableNode.prototype.setDisabled = function ( disabled ) {
	this.$element.prop( 'contentEditable', disabled ? 'false' : 'true' );
};
