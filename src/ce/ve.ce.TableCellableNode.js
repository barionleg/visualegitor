/*!
 * VisualEditor ContentEditable TableCellableNode class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * ContentEditable node which can behave as a table cell
 *
 * @class
 *
 * @abstract
 * @constructor
 */
ve.ce.TableCellableNode = function VeCeTableCellableNode() {
	if ( this.isCellable() && !this.isCellEditable() ) {
		this.$element.attr( 'title', ve.msg( 'visualeditor-aliennode-tooltip' ) );
	}

	this.$element.addClass( 've-ce-tableCellableNode' );

	// Events
	this.connect( this, { setup: 'updateTableCellableAttributes' } );
	this.model.connect( this, { attributeChange: 'updateTableCellableAttributes' } );
};

/* Inheritance */

OO.initClass( ve.ce.TableCellableNode );

/* Static Methods */

/* Methods */

/**
 * Set the editing mode of a table cell node
 *
 * @param {boolean} enable Enable editing
 */
ve.ce.TableCellableNode.prototype.setEditing = function () {
};

/**
 * Get the HTML tag name.
 *
 * Tag name is selected based on the model's style attribute.
 *
 * @return {string} HTML tag name
 * @throws {Error} Invalid style
 */
ve.ce.TableCellableNode.prototype.getTagName = function () {
	var style = this.model.getAttribute( 'style' ),
		types = { data: 'td', header: 'th' };

	if ( !Object.prototype.hasOwnProperty.call( types, style ) ) {
		throw new Error( 'Invalid style' );
	}
	return types[ style ];
};

/**
 * Update DOM from attributes
 */
ve.ce.TableCellableNode.prototype.updateTableCellableAttributes = function () {
	var align = this.model.getAttribute( 'align' );
	this.$element[ 0 ].style.textAlign = align !== 'default' ? align : '';
};
