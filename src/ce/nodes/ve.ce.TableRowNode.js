/*!
 * VisualEditor ContentEditable TableRowNodw class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable table row node.
 *
 * @class
 * @extends ve.ce.BranchNode
 * @constructor
 * @param {ve.dm.TableRowNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.TableRowNode = function VeCeTableRowNode( model, config ) {
	// Parent constructor
	ve.ce.BranchNode.call( this, model, config );
};

/* Inheritance */

OO.inheritClass( ve.ce.TableRowNode, ve.ce.BranchNode );

/* Static Properties */

ve.ce.TableRowNode.static.name = 'tableRow';

ve.ce.TableRowNode.static.tagName = 'tr';

ve.ce.TableRowNode.static.mergeOnDelete = false;

/* Registration */

ve.ce.nodeFactory.register( ve.ce.TableRowNode );
