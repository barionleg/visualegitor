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

// blacklisting 'colspan' and 'rowspan' as they are managed explicitely
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
	var tag = dataElement.attributes && dataElement.attributes.style === 'header' ? 'th' : 'td',
		colspan = dataElement.attributes.colspan,
		rowspan = dataElement.attributes.rowspan,
		el = doc.createElement( tag );

	if ( colspan !== null ) {
		el.setAttribute( 'colspan', colspan );
	}
	if ( rowspan !== null ) {
		el.setAttribute( 'rowspan', rowspan );
	}

	return [ el ];
};

/* Methods */

ve.dm.TableCellNode.prototype.getRowspan = function () {
	return this.element.attributes.rowspan || 1;
};

ve.dm.TableCellNode.prototype.getColspan = function () {
	return this.element.attributes.colspan || 1;
};

ve.dm.TableCellNode.prototype.getSpans = function () {
	return {
		col: this.getColspan(),
		row: this.getRowspan()
	};
};

ve.dm.TableCellNode.prototype.getStyle = function () {
	return this.element.attributes.style || 'data';
};

ve.dm.TableCellNode.prototype.onAttach = function ( to ) {
	if ( to.onStructureChange ) {
		to.onStructureChange( { cell: this } );
	}
};

ve.dm.TableCellNode.prototype.onDetach = function ( from ) {
	if ( from.onStructureChange ) {
		from.onStructureChange( { cell: this } );
	}
};

ve.dm.TableCellNode.prototype.onAttributeChange = function ( key ) {
	if ( this.parent && ( key === 'colspan' || key === 'rowspan' ) ) {
		this.parent.onStructureChange( { cell: this } );
	}
};

ve.dm.TableCellNode.prototype.canBeMergedWith = function () {
	return false;
};

/**
 * Creates data that can be inserted into the model to create a new table cell.
 *
 * @param {Object} [options] An object with property 'style' which can be either 'header' or 'data'.
 * @return {Array} Model data for a new table cell
 */
ve.dm.TableCellNode.createData = function ( options ) {
	options = options || {};
	return [
		{
			type: 'tableCell',
			attributes: {
				style: options.style || 'data'
			}
		},
		{ type: 'paragraph' },
		{ type: '/paragraph' },
		{ type: '/tableCell' }
	];
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.TableCellNode );
