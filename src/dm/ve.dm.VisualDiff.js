/*!
 * VisualEditor DataModel VisualDiff
 *  class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * VisualDiff
 *
 * Gets the diff between two VisualEditor DataModel DocumentNodes
 *
 * @class
 * @constructor
 * @param {ve.dm.Document} oldDoc
 * @param {ve.dm.Document} newDoc
 */
ve.dm.VisualDiff = function VeDmVisualDiff( oldDoc, newDoc ) {
	// Properties
	this.oldDoc = oldDoc;
	this.newDoc = newDoc;
	this.oldDocNode = oldDoc.documentNode;
	this.newDocNode = newDoc.documentNode;
	this.oldDocChildren = this.oldDocNode.children;
	this.newDocChildren = this.newDocNode.children;
	// HACK: To be included properly
	this.treeDiffer = window.diff;
	// HACK: To be included properly
	this.linearDiffer = new diff_match_patch( this.oldDoc.getStore(), this.newDoc.getStore() );
	this.diff = null;

	// isEqual override
	var visualDiff = this;
	this.treeDiffer.treeNode.prototype.isEqual = function ( otherNode ) {

		// Nodes are considered equal if they have the same types and element.attributes
		// Content branch nodes are only equal if they also have the same content
		// TODO: put in better order
		// if ( this.node.node instanceof ve.dm.ContentBranchNode && otherNode.node.node instanceof ve.dm.ContentBranchNode ) {
		// 	return JSON.stringify( visualDiff.oldDoc.getData( this.node.node.getOuterRange() ) ) ===
		// 		JSON.stringify( newDoc.getData( visualDiff.otherNode.node.node.getOuterRange() ) );
		// } else {
		// 	return ( this.node.node.element.type === otherNode.node.node.element.type &&
		// 		ve.compare( this.node.node.element.attributes, otherNode.node.node.element.attributes ) );
		// }
		if ( this.node instanceof ve.dm.ContentBranchNode && otherNode.node instanceof ve.dm.ContentBranchNode ) {
			return JSON.stringify( visualDiff.oldDoc.getData( this.node.getOuterRange() ) ) ===
				JSON.stringify( newDoc.getData( otherNode.node.getOuterRange() ) );
		} else {
			return ( this.node.element.type === otherNode.node.element.type &&
				ve.compare( this.node.element.attributes, otherNode.node.element.attributes ) );
		}

	};
};

ve.dm.VisualDiff.prototype.getDiff = function () {
	var i, ilen, j, jlen,
		oldDocChildrenToDiff = [],
		newDocChildrenToDiff = [];

	this.diff = {
		docChildrenOldToNew: {},
		docChildrenNewToOld: {},
		docChildrenRemove: [],
		docChildrenInsert: []
	};

	// STEP 1: Find identical nodes

	for ( i = 0, ilen = this.oldDocChildren.length; i < ilen; i++ ) {
		for ( j = 0, jlen = this.newDocChildren.length; j < jlen; j++ ) {
			if ( !this.diff.docChildrenNewToOld.hasOwnProperty( j ) &&
				this.compareDocChildren( this.oldDocChildren[ i ], this.newDocChildren[ j ] ) ) {

				this.diff.docChildrenOldToNew[ i ] = j;
				this.diff.docChildrenNewToOld[ j ] = i;
				break;

			}
			// If no new nodes equalled the old node, add it to nodes to diff
			if ( j === jlen - 1 ) {
				oldDocChildrenToDiff.push( i );
			}
		}
	}

	for ( j = 0; j < jlen; j++ ) {
		if ( !this.diff.docChildrenNewToOld.hasOwnProperty( j ) ) {
			newDocChildrenToDiff.push( j );
		}
	}

	// STEP 2: Find removed, inserted and modified nodes

	if ( oldDocChildrenToDiff.length !== 0 || newDocChildrenToDiff.length !== 0 ) {

		if ( oldDocChildrenToDiff.length === 0 ) {

			// Everything new is an insert
			this.diff.docChildrenInsert = newDocChildrenToDiff;

		} else if ( newDocChildrenToDiff.length === 0 ) {

			// Everything old is a remove
			this.diff.docChildrenRemove = oldDocChildrenToDiff;

		} else {

			// Find out which remaining docChildren are removed, inserted or modified
			this.findModifiedDocChildren( oldDocChildrenToDiff, newDocChildrenToDiff );

		}
	}

	return this.diff;
};

ve.dm.VisualDiff.prototype.compareDocChildren = function ( oldDocChild, newDocChild ) {
	var oldData, newData;

	if ( oldDocChild.length !== newDocChild.length || oldDocChild.type !== newDocChild.type ) {
		return false;
	}

	oldData = this.oldDoc.getData( oldDocChild.getOuterRange() );
	newData = this.newDoc.getData( newDocChild.getOuterRange() );

	if ( JSON.stringify( oldData ) === JSON.stringify( newData ) ) {
		return true;
	}

	// If strings are not equal, the nodes may still be the same as far as
	// we are concerned so should compare them.
	return this.compareData( oldData, newData );
};

ve.dm.VisualDiff.prototype.compareData = function ( oldData, newData ) {
	var i, ilen,
		oldStore = this.oldDoc.getStore(),
		newStore = this.newDoc.getStore();

	if ( oldData.length !== newData.length ) {
		return false;
	}

	for ( i = 0, ilen = oldData.length; i < ilen; i++ ) {
		if ( oldData[ i ] !== newData[ i ] &&
			!ve.dm.ElementLinearData.static.compareElements( oldData[ i ], newData[ i ], oldStore, newStore ) ) {
			return false;
		}
	}

	return true;
};

ve.dm.VisualDiff.prototype.findModifiedDocChildren = function ( oldDocChildren, newDocChildren ) {
	var diff, i, j,
		ilen = oldDocChildren.length,
		jlen = newDocChildren.length;

	for ( i = 0; i < ilen; i++ ) {
		for ( j = 0; j < jlen; j++ ) {

			if ( oldDocChildren[ i ] !== null && newDocChildren[ j ] !== null ) {

				// Try to diff the nodes. If they are too different, diff will be false
				diff = this.getDocChildDiff(
					this.oldDocChildren[ oldDocChildren[ i ] ],
					this.newDocChildren[ newDocChildren[ j ] ]
				);

				if ( diff ) {
					this.diff.docChildrenOldToNew[ oldDocChildren[ i ] ] = {
						node: newDocChildren[ j ],
						diff: diff
					};
					this.diff.docChildrenNewToOld[ newDocChildren[ j ] ] = {
						node: oldDocChildren[ i ]
					};

					oldDocChildren[ i ] = null;
					newDocChildren[ j ] = null;
					break;
				}

			}

		}
	}

	// Any nodes remaining in the 'toDiff' arrays are removes and inserts
	for ( i = 0; i < ilen; i++ ) {
		if ( oldDocChildren[ i ] !== null ) {
			this.diff.docChildrenRemove.push( oldDocChildren[ i ] );
		}
	}
	for ( j = 0; j < jlen; j++ ) {
		if ( newDocChildren[ j ] !== null ) {
			this.diff.docChildrenInsert.push( newDocChildren[ j ] );
		}
	}

};

ve.dm.VisualDiff.prototype.getTree = function ( rootNode ) {
	var treeRootNode;

	function wrapNodes( parentNode ) {
		var i, ilen, childNode;

		// If node is ContentBranchNode, treat it as a leaf
		if ( parentNode.node.children && !( parentNode.node instanceof ve.dm.ContentBranchNode ) ) {
			for ( i = 0, ilen = parentNode.node.children.length; i < ilen; i++ ) {

				// Wrap this node
				childNode = new this.treeDiffer.treeNode( parentNode.node.children[ i ] );
				parentNode.addChild( childNode );

				// Wrap this node's children
				wrapNodes.call( this, childNode );

			}
		}
	}

	treeRootNode = new this.treeDiffer.treeNode( rootNode );
	wrapNodes.call( this, treeRootNode );

	return new this.treeDiffer.tree( treeRootNode );

};

ve.dm.VisualDiff.prototype.getDocChildDiff = function ( oldDocChild, newDocChild ) {
	var i, ilen, j, jlen,
		treeDiff, linearDiff,
		oldNode, newNode,
		oldDocChildTree,
		newDocChildTree,
		removeLength,
		insertLength,
		diffLength = 0,
		keepLength = 0,
		diffInfo = {};

	oldDocChildTree = this.getTree( oldDocChild );
	newDocChildTree = this.getTree( newDocChild );

	treeDiff = new this.treeDiffer.differ( oldDocChildTree, newDocChildTree )
		.transactions[ oldDocChildTree.orderedNodes.length - 1 ][ newDocChildTree.orderedNodes.length - 1 ];

	// Length of old content is length of old node minus
	// the open and close tags for each child node
	keepLength = oldDocChild.length - 2 * ( oldDocChildTree.orderedNodes.length - 1 );

	for ( i = 0, ilen = treeDiff.length; i < ilen; i++ ) {

		removeLength = 0;
		insertLength = 0;

		if ( treeDiff[ i ][ 0 ] !== null && treeDiff[ i ][ 1 ] !== null ) {

			// There is a change
			oldNode = oldDocChildTree.orderedNodes[ treeDiff[ i ][ 0 ] ].node;
			newNode = newDocChildTree.orderedNodes[ treeDiff[ i ][ 1 ] ].node;

			if ( !( oldNode instanceof ve.dm.ContentBranchNode ) &&
				!( newNode instanceof ve.dm.ContentBranchNode ) ) {

				// There is no content change
				diffInfo[ i ] = { type: 'remove-insert' };
				continue;

			} else if ( !( newNode instanceof ve.dm.ContentBranchNode ) ) {

				// Content was removed
				diffInfo[ i ] = { type: 'remove-insert' };
				removeLength = oldNode.length;

			} else if ( !( oldNode instanceof ve.dm.ContentBranchNode ) ) {

				// Content was inserted
				diffInfo[ i ] = { type: 'remove-insert' };
				insertLength = newNode.length;

			// If we got this far, both nodes are CBNs
			} else if ( oldNode.type !== newNode.type ) {

				// For now, type change is treated as remove-insert, regardless of content
				// TODO: check for attribute changes too
				diffInfo[ i ] = { type: 'remove-insert' };
				removeLength = oldNode.length;
				insertLength = newNode.length;

			// If we got this far, they are the same CBN with different content
			} else {

				// Do a linear diff to find out how much content has changed
				linearDiff = this.linearDiffer.diff_main(
					this.oldDoc.getData( oldNode.getRange() ),
					this.newDoc.getData( newNode.getRange() )
				);

				diffInfo[ i ] = { type: 'change', linearDiff: linearDiff };
				for ( j = 0, jlen = linearDiff.length; j < jlen; j++ ) {
					if ( linearDiff[ j ][ 0 ] === 1 ) {
						insertLength += linearDiff[ j ][ 1 ].length;
					} else if ( linearDiff[ j ][ 0 ] === -1 ) {
						removeLength += linearDiff[ j ][ 1 ].length;
					}
				}
			}
		} else if ( treeDiff[ i ][ 0 ] ) {

			// Node was removed
			oldNode = oldDocChildTree.orderedNodes[ treeDiff[ i ][ 0 ] ];
			if ( oldNode instanceof ve.dm.ContentBranchNode ) {
				removeLength = oldNode.length;
			}
		} else {

			// Node was inserted
			newNode = newDocChildTree.orderedNodes[ treeDiff[ i ][ 1 ] ];
			if ( newNode instanceof ve.dm.ContentBranchNode ) {
				insertLength = newNode.length;
			}

		}

		keepLength -= removeLength;
		diffLength += removeLength + insertLength;

	}

	// Only return the diff if enough content has changed
	if ( diffLength === 0 ||  keepLength / diffLength < 0.5 ) {
		return false;
	}
	return {
		treeDiff: treeDiff,
		diffInfo: diffInfo,
		oldTree: oldDocChildTree,
		newTree: newDocChildTree
	};

};
