/*!
 * VisualEditor ContentEditable AlienNode class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable alien node.
 *
 * @class
 * @abstract
 * @extends ve.ce.LeafNode
 * @mixins ve.ce.FocusableNode
 *
 * @constructor
 * @param {ve.dm.AlienNode} model
 * @param {Object} [config]
 */
ve.ce.AlienNode = function VeCeAlienNode() {
	// Parent constructor
	ve.ce.AlienNode.super.apply( this, arguments );

	// DOM changes
	this.$element = $( ve.copyDomElements( this.model.getOriginalDomElements( this.model.getDocument().getStore() ), document ) );

	// Mixin constructors
	ve.ce.FocusableNode.call( this, this.$element, {
		classes: [ 've-ce-alienNode-highlights' ]
	} );

	// Re-initialize after $element changes
	this.initialize();
};

/* Inheritance */

OO.inheritClass( ve.ce.AlienNode, ve.ce.LeafNode );

OO.mixinClass( ve.ce.AlienNode, ve.ce.FocusableNode );

/* Static Properties */

ve.ce.AlienNode.static.name = 'alien';

ve.ce.AlienNode.static.iconWhenInvisible = 'puzzle';

// Support: Chrome, IE, Edge
// We have to keep this in the JS code to dump it into the main document, because Chrome and
// Internet Explorer do not support using fill patterns from external SVG files (or data: URIs).
// Used by ve.ce.FocusableNode.
ve.ce.AlienNode.static.fillPatterns =
	'<pattern id="ve-ce-alienNode-pattern-hover" patternUnits="userSpaceOnUse" width="14" height="14">' +
		'<rect width="14" height="14" fill="white" />' +
		'<path d="m 0,0 0,7 7,-7 z M 14,0 0,14 l 7,0 7,-7 L 14,7 z" fill="#95d14f" />' +
	'</pattern>' +
	'<pattern id="ve-ce-alienNode-pattern-focus" patternUnits="userSpaceOnUse" width="14" height="14">' +
		'<rect width="14" height="14" fill="#6da9f7" />' +
		'<path d="m 0,0 0,7 7,-7 z M 14,0 0,14 l 7,0 7,-7 L 14,7 z" fill="#95d14f" />' +
	'</pattern>' +
	'<pattern id="ve-ce-alienNode-pattern-deactivated" patternUnits="userSpaceOnUse" width="14" height="14">' +
		'<rect width="14" height="14" fill="#000" />' +
		'<path d="m 0,0 0,7 7,-7 z M 14,0 0,14 l 7,0 7,-7 L 14,7 z" fill="#666" />' +
	'</pattern>';

/* Methods */

/**
 * @inheritdoc
 */
ve.ce.AlienNode.static.getDescription = function () {
	return ve.msg( 'visualeditor-aliennode-tooltip' );
};
