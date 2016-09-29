/*
Tree node
 */

// Tree node, a wrapper node for building trees
treeDiff.treeNode = function ( node ) {
	// Labels determine equality, indices determine order
	this.node = node;
	this.children = [];
};

// Add children to create the tree structure
// For full tree functionality, need to make a diff.tree
treeDiff.treeNode.prototype.addChild = function ( child ) {
	this.children.push( child );
};

// Check if two treeNodes are equal
// Node equality is optionally defined by overriding this method,
// otherwise nodes are not equal by default
treeDiff.treeNode.prototype.isEqual = function ( otherNode ) {
	return false;
};
