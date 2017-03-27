/*!
 * VisualEditor DataModel TreeModifier tests.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.TreeModifier' );

QUnit.test( 'modify', 1, function ( assert ) {
	var origData, surface, doc, tx, expectedTreeDump, actualTreeDump;

	function appendNodeLines( node, lines, indent ) {
		var sp = ' '.repeat( 4 * indent );
		if ( node instanceof ve.dm.TextNode ) {
			lines.push( sp + 'VeDmTextNode(' + node.getLength() + ')' );
			return lines;
		}
		lines.push( sp + node.constructor.name + '(' + node.getOuterLength() + ') {' );
		( node.children || [] ).map( function ( childNode ) {
			appendNodeLines( childNode, lines, indent + 1 );
		} );
		lines.push( sp + '}' );
		return lines;
	}

	function dumpTree( doc ) {
		return appendNodeLines( doc.documentNode, [], 0 ).join( '\n' );
	}

	origData = [
		{ type: 'paragraph' },
		'a',
		'b',
		'c',
		'd',
		{ type: '/paragraph' },
		{ type: 'paragraph' },
		'e',
		'f',
		'g',
		{ type: '/paragraph' },
		{ type: 'internalList' },
		{ type: '/internalList' }
	];
	surface = new ve.dm.Surface(
		ve.dm.example.createExampleDocumentFromData( origData )
	);
	doc = surface.documentModel;

	tx = new ve.dm.Transaction( [
		{ type: 'retain', length: 2 },
		{
			type: 'replace',
			remove: [ 'b' ],
			insert: [ 'X', 'Y' ],
			insertedDataOffset: 0,
			insertedDataLength: 2
		},
		{ type: 'retain', length: 2 },
		{
			type: 'replace',
			remove: [ { type: '/paragraph' }, { type: 'paragraph' }, 'e' ],
			insert: [ 'Z' ],
			insertedDataOffset: 0,
			insertedDataLength: 0
		},
		{ type: 'retain', length: 5 }
	] );

	doc.commit( tx );
	expectedTreeDump = dumpTree( doc );
	doc.commit( tx.reversed() );
	new ve.dm.TreeModifier( doc, tx ).modify();
	actualTreeDump = dumpTree( doc );
	assert.strictEqual(
		actualTreeDump,
		expectedTreeDump,
		'Modified tree matches rebuilt tree'
	);
} );
