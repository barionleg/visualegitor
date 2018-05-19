/*!
 * VisualEditor ContentEditable AlienNode, AlienBlockNode and AlienInlineNode classes.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
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
	'</pattern>';

/* Methods */

/**
 * @inheritdoc
 */
ve.ce.AlienNode.static.getDescription = function () {
	return ve.msg( 'visualeditor-aliennode-tooltip' );
};

/* Concrete subclasses */

/**
 * ContentEditable alien block node.
 *
 * @class
 * @extends ve.ce.AlienNode
 *
 * @constructor
 * @param {ve.dm.AlienBlockNode} model
 * @param {Object} [config]
 */
ve.ce.AlienBlockNode = function VeCeAlienBlockNode() {
	// Parent constructor
	ve.ce.AlienBlockNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ce.AlienBlockNode, ve.ce.AlienNode );

/* Static Properties */

ve.ce.AlienBlockNode.static.name = 'alienBlock';

/**
 * ContentEditable alien inline node.
 *
 * @class
 * @extends ve.ce.AlienNode
 *
 * @constructor
 * @param {ve.dm.AlienInlineNode} model
 * @param {Object} [config]
 */
ve.ce.AlienInlineNode = function VeCeAlienInlineNode() {
	// Parent constructor
	ve.ce.AlienInlineNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ce.AlienInlineNode, ve.ce.AlienNode );

/* Static Properties */

ve.ce.AlienInlineNode.static.name = 'alienInline';

/**
 * ContentEditable alien block node.
 *
 * @class
 * @extends ve.ce.AlienNode
 *
 * @constructor
 * @param {ve.dm.AlienTableCellNode} model
 * @param {Object} [config]
 */
ve.ce.AlienTableCellNode = function VeCeAlienTableCellNode() {
	// Parent constructor
	ve.ce.AlienTableCellNode.super.apply( this, arguments );

	// Mixin constructors
	ve.ce.TableCellableNode.call( this );
};

/* Inheritance */

OO.inheritClass( ve.ce.AlienTableCellNode, ve.ce.AlienNode );

OO.mixinClass( ve.ce.AlienTableCellNode, ve.ce.TableCellableNode );

/* Static Properties */

ve.ce.AlienTableCellNode.static.name = 'alienTableCell';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.AlienBlockNode );
ve.ce.nodeFactory.register( ve.ce.AlienInlineNode );
ve.ce.nodeFactory.register( ve.ce.AlienTableCellNode );
