/*!
 * VisualEditor DataModel Converter tests.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.dm.Converter' );

/* Tests */

QUnit.test( 'getModelFromDom', function ( assert ) {
	var msg, cases = ve.dm.example.domToDataCases;

	for ( msg in cases ) {
		ve.test.utils.runGetModelFromDomTest( assert, ve.copy( cases[ msg ] ), msg );
	}
} );

QUnit.test( 'getModelFromDom throws', function ( assert ) {
	ve.test.utils.runGetModelFromDomTest( assert, {
		body: '<p></p><p></p>',
		data: [
			{ type: 'paragraph' },
			{ type: '/paragraph' },
			{ type: 'paragraph' },
			{ type: '/paragraph' },
			{ type: 'internalList' },
			{ type: '/internalList' }
		]
	}, 'plain paragraph does not throw' );

	assert.throws( function () {
		ve.test.utils.runGetModelFromDomTest( assert, {
			body: '<p about="oops"></p><p about="oops"></p>'
		} );
	}, /cannot have an about-group/, 'plain paragraph with "about" throws' );

	ve.test.utils.runGetModelFromDomTest( assert, {
		body: '<p about="oops"></p>',
		data: [
			{ type: 'paragraph' },
			{ type: '/paragraph' },
			{ type: 'internalList' },
			{ type: '/internalList' }
		]
	}, 'single plain paragraph does not throw (it should, but that breaks MW Cite)' );

	ve.test.utils.runGetModelFromDomTest( assert, {
		body: '<p about="oops" rel="ve:Alien"></p><p about="oops"></p>',
		data: [
			{ type: 'alienBlock' },
			{ type: '/alienBlock' },
			{ type: 'internalList' },
			{ type: '/internalList' }
		]
	}, 'alien paragraph with "about" does not throw' );
} );

QUnit.test( 'getModelFromDom with store argument', function ( assert ) {
	var model,
		store = new ve.dm.HashValueStore();
	model = ve.dm.converter.getModelFromDom(
		ve.createDocumentFromHtml( '<p>foo</p>' ),
		{ lang: 'en', dir: 'ltr' },
		store
	);
	assert.strictEqual( model.getStore() === store, true, 'Document store is reference-equal to store argument' );
} );

QUnit.test( 'getDomFromModel', function ( assert ) {
	var msg, cases = ve.dm.example.domToDataCases;

	for ( msg in cases ) {
		ve.test.utils.runGetDomFromModelTest( assert, ve.copy( cases[ msg ] ), msg );
	}
} );

QUnit.test( 'getFullData', function ( assert ) {
	var cases = [
		{
			msg: 'Metadata in ContentBranchNode gets moved outside by any change',
			beforeHtml: '<!-- w --><meta foo="x"><p>ab<meta foo="y">cd</p><p>ef<meta foo="z">gh</p>',
			transaction: function ( doc ) {
				return ve.dm.TransactionBuilder.static.newFromRemoval( doc, new ve.Range( 10, 11 ) );
			},
			afterHtml: '<!-- w --><meta foo="x"><p>abc</p><meta foo="y"><p>ef<meta foo="z">gh</p>'
		},
		{
			msg: 'Removable metadata (empty annotation) in ContentBranchNode is removed by any change',
			beforeHtml: '<p>ab<i></i>cd</p><p>efgh</p>',
			transaction: function ( doc ) {
				return ve.dm.TransactionBuilder.static.newFromRemoval( doc, new ve.Range( 4, 5 ) );
			},
			afterHtml: '<p>abc</p><p>efgh</p>'
		}
	];

	cases.forEach( function ( caseItem ) {
		var doc = ve.dm.converter.getModelFromDom( ve.createDocumentFromHtml( '<body>' + caseItem.beforeHtml ) ),
			tx = caseItem.transaction( doc );

		doc.commit( tx );
		assert.strictEqual(
			ve.dm.converter.getDomFromModel( doc ).body.innerHTML,
			caseItem.afterHtml,
			caseItem.msg
		);

		doc.commit( tx.reversed() );
		assert.strictEqual(
			ve.dm.converter.getDomFromModel( doc ).body.innerHTML,
			caseItem.beforeHtml,
			caseItem.msg + ' (undo)'
		);
	} );
} );

QUnit.test( 'roundTripMetadata', function ( assert ) {
	var doc, tx,
		beforeHtml = '<!-- w --><meta foo="x"><p>ab<meta foo="y">cd</p><p>ef<meta foo="z">gh</p>',
		afterHtml = '<!-- w --><meta foo="x"><p>abc</p><meta foo="y"><p>ef<meta foo="z">gh</p>';

	doc = ve.dm.converter.getModelFromDom( ve.createDocumentFromHtml( '<body>' + beforeHtml ) );
	tx = ve.dm.TransactionBuilder.static.newFromRemoval( doc, new ve.Range( 10, 11 ) );
	doc.commit( tx );
	assert.strictEqual(
		ve.dm.converter.getDomFromModel( doc ).body.innerHTML,
		afterHtml,
		'Metadata in ContentBranchNode gets moved outside by change to ContentBranchNode'
	);
	doc.commit( tx.reversed() );
	assert.strictEqual(
		ve.dm.converter.getDomFromModel( doc ).body.innerHTML,
		beforeHtml,
		'Undo restores metadata to inside ContentBranchNode'
	);
} );
