// Simple example

var t1 = new treeDiff.treeNode( new treeDiff.abstractNode( 'f' ) );
t1.addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'd' ) ) );
t1.addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'e' ) ) );
t1.children[0].addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'a' ) ) );
t1.children[0].addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'c' ) ) );
t1.children[0].children[1].addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'b' ) ) );
var tree1 = new treeDiff.tree( diff.t1 );

var t2 = new treeDiff.treeNode( new treeDiff.abstractNode( 'f' ) );
t2.addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'c' ) ) );
t2.addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'e' ) ) );
t2.children[0].addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'd' ) ) );
t2.children[0].children[0].addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'a' ) ) );
t2.children[0].children[0].addChild( new treeDiff.treeNode( new treeDiff.abstractNode( 'b' ) ) );
var tree2 = new treeDiff.tree( diff.t2 );

var difference = new treeDiff.differ( diff.tree1, diff.tree2 );
