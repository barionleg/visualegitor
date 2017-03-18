/*!
 * VisualEditor DataModel Converter tests.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.Converter' );

/* Tests */

QUnit.test( 'getModelFromDom', function ( assert ) {
	var msg, cases = ve.dm.example.domToDataCases;

	QUnit.expect( ve.test.utils.countGetModelFromDomTests( cases ) );

	for ( msg in cases ) {
		ve.test.utils.runGetModelFromDomTest( assert, ve.copy( cases[ msg ] ), msg );
	}
} );

QUnit.test( 'getDomFromModel', function ( assert ) {
	var msg, cases = ve.dm.example.domToDataCases;

	QUnit.expect( 3 * Object.keys( cases ).length );

	for ( msg in cases ) {
		ve.test.utils.runGetDomFromModelTest( assert, ve.copy( cases[ msg ] ), msg );
	}
} );

QUnit.test( 'annotation merging', 2, function ( assert ) {
	var doc = ve.dm.converter.getModelFromDom(
		ve.createDocumentFromHtml( '<p><b>abc</b>X<b>def</b><i>ghi</i></p>' )
	);

	assert.deepEqual( doc.getData(), [
		{ type: 'paragraph', originalDomElementsIndex: 'h841a1f79a29e5a49' },
		[ 'a', [ ve.dm.example.domBoldIndex ] ],
		[ 'b', [ ve.dm.example.domBoldIndex ] ],
		[ 'c', [ ve.dm.example.domBoldIndex ] ],
		'X',
		[ 'd', [ ve.dm.example.domBoldIndex ] ],
		[ 'e', [ ve.dm.example.domBoldIndex ] ],
		[ 'f', [ ve.dm.example.domBoldIndex ] ],
		[ 'g', [ ve.dm.example.domItalicIndex ] ],
		[ 'h', [ ve.dm.example.domItalicIndex ] ],
		[ 'i', [ ve.dm.example.domItalicIndex ] ],
		{ type: '/paragraph' },
		{ type: 'internalList' },
		{ type: '/internalList' }
	], 'model is correct' );

	doc.commit( ve.dm.TransactionBuilder.static.newFromRemoval(
		doc,
		new ve.Range( 4, 5 )
	) );
	assert.strictEqual(
		ve.dm.converter.getDomFromModel( doc ).body.innerHTML,
		'<p><b>abcdef</b><i>ghi</i></p>',
		'html serialization is correct'
	);
} );
