/*!
 * VisualEditor ContentEditable linear enter down handler tests.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.ce.LinearEnterKeyDownHandler', {
	// See https://github.com/platinumazure/eslint-plugin-qunit/issues/68
	// eslint-disable-next-line qunit/resolve-async
	beforeEach: function ( assert ) {
		var done = assert.async();
		return ve.init.platform.getInitializedPromise().then( done );
	}
} );

QUnit.test( 'special key down: linear enter', function ( assert ) {
	var done = assert.async(),
		noChange = function () {},
		promise = $.Deferred().resolve().promise(),
		emptyList = '<ul><li><p></p></li></ul>',
		cases = [
			{
				rangeOrSelection: new ve.Range( 57 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						57, 0,
						{ type: '/paragraph' },
						{ type: 'paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 59 ),
				msg: 'End of paragraph split by enter'
			},
			{
				rangeOrSelection: new ve.Range( 57 ),
				keys: [ 'ENTER' ],
				htmlOrDoc: ( function () {
					var view = ve.test.utils.createSurfaceViewFromDocument( ve.dm.example.createExampleDocument() );
					view.surface.isMultiline = function () { return false; };
					return view;
				}() ),
				expectedData: noChange,
				expectedRangeOrSelection: new ve.Range( 57 ),
				msg: 'Enter does nothing in single line mode'
			},
			{
				rangeOrSelection: new ve.Range( 57 ),
				keys: [ 'SHIFT+ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						57, 0,
						{ type: '/paragraph' },
						{ type: 'paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 59 ),
				msg: 'End of paragraph split by shift+enter'
			},
			{
				rangeOrSelection: new ve.Range( 56 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						56, 0,
						{ type: '/paragraph' },
						{ type: 'paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 58 ),
				msg: 'Start of paragraph split by enter'
			},
			{
				rangeOrSelection: new ve.Range( 3 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						3, 0,
						{ type: '/heading' },
						{ type: 'heading', attributes: { level: 1 } }
					);
				},
				expectedRangeOrSelection: new ve.Range( 5 ),
				msg: 'Heading split by enter'
			},
			{
				rangeOrSelection: new ve.Range( 2, 3 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						2, 1,
						{ type: '/heading' },
						{ type: 'heading', attributes: { level: 1 } }
					);
				},
				expectedRangeOrSelection: new ve.Range( 4 ),
				msg: 'Selection in heading removed, then split by enter'
			},
			{
				rangeOrSelection: new ve.Range( 1 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						0, 0,
						{ type: 'paragraph' },
						{ type: '/paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 3 ),
				msg: 'Start of heading split into a plain paragraph'
			},
			{
				rangeOrSelection: new ve.Range( 4 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						5, 0,
						{ type: 'paragraph' },
						{ type: '/paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 6 ),
				msg: 'End of heading split into a plain paragraph'
			},
			{
				rangeOrSelection: new ve.Range( 16 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						16, 0,
						{ type: '/paragraph' },
						{ type: '/listItem' },
						{ type: 'listItem' },
						{ type: 'paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 20 ),
				msg: 'List item split by enter'
			},
			{
				rangeOrSelection: new ve.Range( 16 ),
				keys: [ 'SHIFT+ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						16, 0,
						{ type: '/paragraph' },
						{ type: 'paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 18 ),
				msg: 'List item not split by shift+enter'
			},
			{
				rangeOrSelection: new ve.Range( 30 ),
				keys: [ 'ENTER', 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						33, 0,
						{ type: 'paragraph' },
						{ type: '/paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 34 ),
				msg: 'Two enters breaks out of a list and starts a new paragraph'
			},
			{
				rangeOrSelection: new ve.Range( 21 ),
				keys: [ 'ENTER', 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						24, 0,
						{ type: '/listItem' },
						{ type: 'listItem' },
						{ type: 'paragraph' },
						{ type: '/paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 27 ),
				msg: 'Two enters in nested list breaks out of inner list and starts a new list item'
			},
			{
				htmlOrDoc: '<p>foo</p>' + emptyList + '<p>bar</p>',
				rangeOrSelection: new ve.Range( 8 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice( 5, 6 );
				},
				expectedRangeOrSelection: new ve.Range( 6 ),
				msg: 'Enter in an empty list destroys it and moves to next paragraph'
			},
			{
				htmlOrDoc: '<p>foo</p>' + emptyList,
				rangeOrSelection: new ve.Range( 8 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice( 5, 6 );
				},
				expectedRangeOrSelection: new ve.Range( 4 ),
				msg: 'Enter in an empty list at end of document destroys it and moves to previous paragraph'
			},
			{
				htmlOrDoc: emptyList + '<p>bar</p>',
				rangeOrSelection: new ve.Range( 3 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice( 0, 6 );
				},
				expectedRangeOrSelection: new ve.Range( 1 ),
				msg: 'Enter in an empty list at start of document destroys it and moves to next paragraph'
			},
			{
				htmlOrDoc: emptyList,
				rangeOrSelection: new ve.Range( 3 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						0, 6,
						{ type: 'paragraph' },
						{ type: '/paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 1 ),
				msg: 'Enter in an empty list with no adjacent content destroys it and creates a paragraph'
			},
			{
				htmlOrDoc: '<p>foo</p><ul><li>bar' + emptyList + '</li></ul><p>baz</p>',
				rangeOrSelection: new ve.Range( 15 ),
				keys: [ 'ENTER' ],
				expectedData: function ( data ) {
					data.splice(
						12, 6,
						{ type: '/listItem' }, { type: 'listItem' }, { type: 'paragraph' }, { type: '/paragraph' }
					);
				},
				expectedRangeOrSelection: new ve.Range( 15 ),
				msg: 'Enter in a completely empty nested list destroys it and adds a new list item to the parent'
			}
		];

	cases.forEach( function ( caseItem ) {
		promise = promise.then( function () {
			return ve.test.utils.runSurfaceHandleSpecialKeyTest( assert, caseItem );
		} );
	} );

	promise.always( function () { done(); } );
} );
