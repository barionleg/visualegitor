/*!
 * VisualEditor DataModel TableCellNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel table cell node.
 *
 * @class
 * @extends ve.dm.BranchNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 * @param {ve.dm.Node[]} [children]
 */
ve.dm.TableCellNode = function VeDmTableCellNode() {
	// Parent constructor
	ve.dm.BranchNode.apply( this, arguments );

	/* Events */

	this.connect( this, {
		attach: 'onAttach',
		detach: 'onDetach',
		attributeChange: 'onAttributeChange'
	} );
};

/* Inheritance */

OO.inheritClass( ve.dm.TableCellNode, ve.dm.BranchNode );

/* Static Properties */

ve.dm.TableCellNode.static.name = 'tableCell';

ve.dm.TableCellNode.static.parentNodeTypes = [ 'tableRow' ];

ve.dm.TableCellNode.static.defaultAttributes = { style: 'data' };

ve.dm.TableCellNode.static.matchTagNames = [ 'td', 'th' ];

// blacklisting 'colspan' and 'rowspan' as they are managed explicitly
ve.dm.TableCellNode.static.storeHtmlAttributes = {
	blacklist: ['colspan', 'rowspan']
};

ve.dm.TableCellNode.static.toDataElement = function ( domElements ) {
	var style = domElements[0].nodeName.toLowerCase() === 'th' ? 'header' : 'data',
		colspan = domElements[0].getAttribute( 'colspan' ),
		rowspan = domElements[0].getAttribute( 'rowspan' );

	return {
		type: this.name,
		attributes: {
			style: style,
			colspan: colspan !== null && colspan !== '' ? Number( colspan ) : null,
			rowspan: rowspan !== null && rowspan !== '' ? Number( rowspan ) : null
		}
	};
};

ve.dm.TableCellNode.static.toDomElements = function ( dataElement, doc ) {
	var attributes = dataElement.attributes || {},
		tag = attributes.style === 'header' ? 'th' : 'td',
		colspan = attributes.colspan,
		rowspan = attributes.rowspan,
		el = doc.createElement( tag );

	if ( colspan !== null && colspan > 1 ) {
		el.setAttribute( 'colspan', colspan );
	}
	if ( rowspan !== null && rowspan > 1 ) {
		el.setAttribute( 'rowspan', rowspan );
	}

	return [ el ];
};

/**
 * Creates data that can be inserted into the model to create a new table cell.
 *
 * @param {Object} [attributes] An object with property 'style' which can be either 'header' or 'data'.
 * @return {Array} Model data for a new table cell
 */
ve.dm.TableCellNode.static.createData = function ( attributes ) {
	return [
		{
			type: 'tableCell',
			attributes: {
				style: ( attributes || {} ).style || 'data'
			}
		},
		{ type: 'paragraph' },
		{ type: '/paragraph' },
		{ type: '/tableCell' }
	];
};

/* Methods */

/**
 * Get the colspan of the table cell node, defaulting to 1
 *
 * @returns {number} Colspan
 */
ve.dm.TableCellNode.prototype.getColspan = function () {
	return this.getAttribute( 'colspan' ) || 1;
};

/**
 * Get the rowspan of the table cell node, defaulting to 1
 *
 * @returns {number} Rowspan
 */
ve.dm.TableCellNode.prototype.getRowspan = function () {
	return this.getAttribute( 'rowspan' ) || 1;
};

/**
 * Get the style of the table cell node ('data' or 'header'), defaulting to 'data
 *
 * @returns {string} Style
 */
ve.dm.TableCellNode.prototype.getStyle = function () {
	return this.getAttribute( 'style' ) || 'data';
};

/**
 * Handle being attached.
 *
 * @param {Node} to The node to which this is being attached.
 * @method
 */
ve.dm.TableCellNode.prototype.onAttach = function ( to ) {
	if ( to.onStructureChange ) {
		to.onStructureChange( { cell: this } );
	}
};

/**
 * Handle being dettached.
 *
 * @param {Node} from The node from which this is being dettached.
 * @method
 */
ve.dm.TableCellNode.prototype.onDetach = function ( from ) {
	if ( from.onStructureChange ) {
		from.onStructureChange( { cell: this } );
	}
};

/**
 * Handle attribute changes.
 *
 * @method
 */
ve.dm.TableCellNode.prototype.onAttributeChange = function ( key ) {
	if ( this.parent && ( key === 'colspan' || key === 'rowspan' ) ) {
		this.parent.onStructureChange( { cell: this } );
	}
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.TableCellNode );
