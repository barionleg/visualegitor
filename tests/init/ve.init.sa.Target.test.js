/*!
 * VisualEditor tests for ve.init.sa.Target.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.test( 'static.createModelFromDom, ….parseDocument (source mode)', function ( assert ) {
	const testCases = [
		{
			name: 'empty',
			sourceBody: '',
			htmlBody: '<html><body></body></html>',
			expectedParsedDocument: '',
			expectedModel: [ { type: 'paragraph' }, { type: '/paragraph' }, { type: 'internalList' }, { type: '/internalList' } ]
		},
		{
			name: 'basic',
			sourceBody: 'A? B! CD.',
			expectedParsedDocument: 'A? B! CD.',
			expectedModel: [ { type: 'paragraph' }, 'A', '?', ' ', 'B', '!', ' ', 'C', 'D', '.', { type: '/paragraph' }, { type: 'internalList' }, { type: '/internalList' } ]
		},
		{
			name: 'complex',
			sourceBody: 'A?\nB\n<!-- C! -->\n\nD.',
			expectedParsedDocument: 'A?\nB\n<!-- C! -->\n\nD.',
			expectedModel: [ { type: 'paragraph' }, 'A', '?', { type: '/paragraph' }, { type: 'paragraph' }, 'B', { type: '/paragraph' }, { type: 'paragraph' }, '<', '!', '-', '-', ' ', 'C', '!', ' ', '-', '-', '>', { type: '/paragraph' }, { type: 'paragraph' }, { type: '/paragraph' }, { type: 'paragraph' }, 'D', '.', { type: '/paragraph' }, { type: 'internalList' }, { type: '/internalList' } ]
		},
		{
			name: 'unicode',
			sourceBody: '維基百科ㅋㅏ난다韓國語',
			expectedParsedDocument: '維基百科ㅋㅏ난다韓國語',
			expectedModel: [ { type: 'paragraph' }, '維', '基', '百', '科', 'ㅋ', 'ㅏ', '난', '다', '韓', '國', '語', { type: '/paragraph' }, { type: 'internalList' }, { type: '/internalList' } ]
		}
	];

	for ( const testCase of testCases ) {
		const document = ve.init.sa.Target.static.createModelFromDom( testCase.sourceBody, 'source' );

		assert.ok(
			document instanceof ve.dm.Document,
			'Source "' + testCase.name + '" document returns a Document'
		);
		assert.deepEqual(
			document.getData(),
			testCase.expectedModel,
			'Source "' + testCase.name + '" document has the correct content'
		);

		// eslint-disable-next-line one-var
		const parseDocument = ve.init.sa.Target.static.parseDocument( testCase.sourceBody, 'source' );
		assert.strictEqual(
			parseDocument,
			testCase.expectedParsedDocument,
			'Source "' + testCase.name + '" document is returned intact by parseDocument'
		);

		/*
		const document = ve.init.sa.Target.static.createModelFromDom( testCase.htmlBody, 'html' );

		assert.ok(
			document instanceof ve.dm.Document,
			'HTML "' + testCase.name + '" document returns a Document'
		);
		assert.deepEqual(
			document.getData(),
			testCase.expectedModel,
			'HTML "' + testCase.name + '" document has the correct content'
		);

		// eslint-disable-next-line one-var
		const parseDocument = ve.init.sa.Target.static.parseDocument( testCase.body, 'html' );
		assert.strictEqual(
			parseDocument,
			testCase.expectedParsedDocument,
			'HTML "' + testCase.name + '" document is returned intact by parseDocument'
		);
		*/
	}
} );
