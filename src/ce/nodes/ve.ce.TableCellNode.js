/*!
 * VisualEditor ContentEditable TableCellNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable table cell node.
 *
 * @class
 * @extends ve.ce.BranchNode
 * @constructor
 * @param {ve.dm.TableCellNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TableCellNode = function VeCeTableCellNode( model, config ) {
	// Parent constructor
	ve.ce.BranchNode.call( this, model, config );

	// Events
	this.model.connect( this, {
		update: 'onUpdate',
		attributeChange: 'onAttributeChange'
	} );

	// DOM changes
	this.$element
		.addClass( 've-ce-tableCellNode' )
		.attr( {
			rowspan: this.model.getRowspan(),
			colspan: this.model.getColspan()
		} );
};

/* Inheritance */

OO.inheritClass( ve.ce.TableCellNode, ve.ce.BranchNode );

/* Static Properties */

ve.ce.TableCellNode.static.name = 'tableCell';

/* Methods */

/**
 * Get the HTML tag name.
 *
 * Tag name is selected based on the model's style attribute.
 *
 * @returns {string} HTML tag name
 * @throws {Error} Invalid style
 */
ve.ce.TableCellNode.prototype.getTagName = function () {
	var style = this.model.getAttribute( 'style' ),
		types = { data: 'td', header: 'th' };

	if ( !( style in types ) ) {
		throw new Error( 'Invalid style' );
	}
	return types[style];
};

/**
 * Handle model update events.
 *
 * If the style changed since last update the DOM wrapper will be replaced with an appropriate one.
 *
 * @method
 */
ve.ce.TableCellNode.prototype.onUpdate = function () {
	this.updateTagName();
};

/**
 * Handle attribute changes to keep the life HTML element updated.
 */
ve.ce.TableCellNode.prototype.onAttributeChange = function ( key, from, to ) {
	if ( key === 'colspan' || key === 'rowspan' ) {
		if ( to > 1 ) {
			this.$element.attr( key, to );
		} else {
			this.$element.removeAttr( key );
		}
	}
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableCellNode );
