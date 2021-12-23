/*!
 * VisualEditor DiffElement tests.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.ui.DiffElement' );

/* Tests */

QUnit.test( 'Diffing', function ( assert ) {
	var spacer = '<div class="ve-ui-diffElement-spacer">⋮</div>',
		comment = ve.dm.example.commentNodePreview,
		cases = [
			{
				msg: 'Simple text change',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo car baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo ' +
							'<del data-diff-action="remove">bar</del><ins data-diff-action="insert">car</ins>' +
							' baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Complex text change',
				oldDoc: '<p>foo quux at bar</p>',
				newDoc: '<p>foo, quux at the bar</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo' +
							'<ins data-diff-action="insert">,</ins>' +
							' quux at' +
							'<ins data-diff-action="insert"> the</ins>' +
							' bar' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Forced time out',
				forceTimeout: true,
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo car baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">' +
							'foo bar baz' +
						'</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">' +
							'foo car baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Minimal text change',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo bar! baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar' +
							'<ins data-diff-action="insert">!</ins>' +
							' baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Minimal text change at start of paragraph',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo! bar baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo' +
							'<ins data-diff-action="insert">!</ins>' +
							' bar baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Minimal text change at end of paragraph',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo bar !baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar ' +
							'<ins data-diff-action="insert">!</ins>' +
							'baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Non semantic whitespace change (no diff)',
				oldDoc: '<p>foo</p>',
				newDoc: '<p>  foo  </p>',
				expected: '<div class="ve-ui-diffElement-no-changes">' + ve.msg( 'visualeditor-diff-no-changes' ) + '</div>'
			},
			{
				msg: 'Simple text change with non-whitespace word break boundaires',
				oldDoc: '<p>foo"bar"baz</p>',
				newDoc: '<p>foo"bXr"baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo"' +
							'<del data-diff-action="remove">bar</del><ins data-diff-action="insert">bXr</ins>' +
							'"baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Text change in script with no whitespace',
				oldDoc: '<p>粵文係粵語嘅書面語</p>',
				newDoc: '<p>粵文唔係粵語嘅書面語</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'粵文' +
							'<ins data-diff-action="insert">唔</ins>' +
							'係粵語嘅書面語' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Consecutive word partial changes',
				oldDoc: '<p>foo bar baz hello world quux whee</p>',
				newDoc: '<p>foo bar baz hellish work quux whee</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar baz ' +
							'<del data-diff-action="remove">hello world</del>' +
							'<ins data-diff-action="insert">hellish work</ins>' +
							' quux whee' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Only change-adjacent paragraphs are shown',
				oldDoc: '<p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<p>boo</p><p>bar</p><p>baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">foo</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">boo</p>' +
					'</div>' +
					'<p data-diff-action="none">bar</p>' +
					spacer
			},
			{
				msg: 'Heading context always shown',
				oldDoc: '<p>lead</p><h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<p>lead</p><h2>context</h2><p>foo</p><p>bar</p><p>baq</p>',
				expected:
					spacer +
					'<h2 data-diff-action="none">context</h2>' +
					spacer +
					'<p data-diff-action="none">bar</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">baz</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">baq</p>' +
					'</div>'
			},
			{
				msg: 'Heading context shown with small inline change',
				oldDoc: '<p>lead</p><h2>context</h2><p>foo</p><p>bar</p><p>baz quux whee</p>',
				newDoc: '<p>lead</p><h2>context</h2><p>foo</p><p>bar</p><p>baz quux whee 123</p>',
				expected:
					spacer +
					'<h2 data-diff-action="none">context</h2>' +
					spacer +
					'<p data-diff-action="none">bar</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>baz quux whee<ins data-diff-action="insert"> 123</ins></p>' +
					'</div>'
			},
			{
				msg: 'No spacer above heading context when it is the 0th child',
				oldDoc: '<h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<h2>context</h2><p>foo</p><p>bar</p><p>baq</p>',
				expected:
					'<h2 data-diff-action="none">context</h2>' +
					spacer +
					'<p data-diff-action="none">bar</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">baz</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">baq</p>' +
					'</div>'
			},
			{
				msg: 'No spacer below heading context when next child is already context',
				oldDoc: '<h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<h2>context</h2><p>foo</p><p>baq</p><p>baz</p>',
				expected:
					'<h2 data-diff-action="none">context</h2>' +
					'<p data-diff-action="none">foo</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">bar</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">baq</p>' +
					'</div>' +
					'<p data-diff-action="none">baz</p>'
			},
			{
				msg: 'Second heading is context',
				oldDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foo</p><p>bar</p><p>baq</p>',
				expected:
					spacer +
					'<h2 data-diff-action="none">context</h2>' +
					spacer +
					'<p data-diff-action="none">bar</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">baz</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">baq</p>' +
					'</div>'
			},
			{
				msg: 'Modification in first section',
				oldDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<h2>first heading</h2><p>wheeb</p><h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				expected:
					'<h2 data-diff-action="none">first heading</h2>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">whee</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">wheeb</p>' +
					'</div>' +
					'<h2 data-diff-action="none">context</h2>' +
					spacer
			},
			{
				msg: 'Modification at start of second section',
				oldDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foob</p><p>bar</p><p>baz</p>',
				expected:
					spacer +
					'<h2 data-diff-action="none">context</h2>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">foo</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">foob</p>' +
					'</div>' +
					'<p data-diff-action="none">bar</p>' +
					spacer
			},
			{
				msg: 'Modification in middle of second section',
				oldDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foo</p><p>barb</p><p>baz</p>',
				expected:
					spacer +
					'<h2 data-diff-action="none">context</h2>' +
					'<p data-diff-action="none">foo</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">bar</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">barb</p>' +
					'</div>' +
					'<p data-diff-action="none">baz</p>'
			},
			{
				msg: 'No extra context shown when second heading modified',
				oldDoc: '<h2>first heading</h2><p>whee</p><h2>context</h2><p>foo</p><p>bar</p><p>baz</p>',
				newDoc: '<h2>first heading</h2><p>whee</p><h2>context!</h2><p>foo</p><p>bar</p><p>baz</p>',
				expected:
					spacer +
					'<p data-diff-action="none">whee</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<h2>context<ins data-diff-action="insert">!</del></h2>' +
					'</div>' +
					'<p data-diff-action="none">foo</p>' +
					spacer
			},
			{
				msg: 'Wrapper paragraphs are made concrete',
				oldDoc: 'foo',
				newDoc: 'boo',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">foo</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">boo</p>' +
					'</div>'
			},
			{
				msg: 'Attributes added to ClassAttributeNodes',
				oldDoc: '<figure><img src="http://example.org/foo.jpg" alt="foo"><figcaption>bar</figcaption></figure>',
				newDoc: '<figure><img src="http://example.org/foo.jpg" alt="bar"><figcaption>bar</figcaption></figure>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<figure data-diff-action="structural-change" data-diff-id="0"><img src="http://example.org/foo.jpg" alt="bar"><figcaption>bar</figcaption></figure>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-changed,alt,<del>foo</del>,<ins>bar</ins></div>'
				]
			},
			{
				msg: 'Attributes added to ClassAttributeNodes with classes',
				oldDoc: '<figure class="ve-align-right"><img src="http://example.org/foo.jpg" alt="foo"><figcaption>bar</figcaption></figure>',
				newDoc: '<figure class="ve-align-right"><img src="http://example.org/foo.jpg" alt="bar"><figcaption>bar</figcaption></figure>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<figure class="ve-align-right" data-diff-action="structural-change" data-diff-id="0"><img src="http://example.org/foo.jpg" alt="bar"><figcaption>bar</figcaption></figure>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-changed,alt,<del>foo</del>,<ins>bar</ins></div>'
				]
			},
			{
				msg: 'Changed src on an image is considered a delete + insert',
				oldDoc: '<figure class="ve-align-right"><img src="http://example.org/foo.jpg"><figcaption>bar</figcaption></figure>',
				newDoc: '<figure class="ve-align-right"><img src="http://example.org/bar.jpg"><figcaption>bar</figcaption></figure>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<figure class="ve-align-right" data-diff-action="remove"><img src="http://example.org/foo.jpg"><figcaption>bar</figcaption></figure>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<figure class="ve-align-right" data-diff-action="insert"><img src="http://example.org/bar.jpg"><figcaption>bar</figcaption></figure>' +
					'</div>'
			},
			{
				msg: 'Node inserted',
				oldDoc: '<p>foo</p>',
				newDoc: '<p>foo</p><div rel="ve:Alien">Alien</div>',
				expected:
					'<p data-diff-action="none">foo</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<div rel="ve:Alien" data-diff-action="insert">Alien</div>' +
					'</div>'
			},
			{
				msg: 'Node removed',
				oldDoc: '<p>foo</p><div rel="ve:Alien">Alien</div>',
				newDoc: '<p>foo</p>',
				expected:
					'<p data-diff-action="none">foo</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<div rel="ve:Alien" data-diff-action="remove">Alien</div>' +
					'</div>'
			},
			{
				msg: 'Node replaced',
				oldDoc: '<div rel="ve:Alien">Alien</div>',
				newDoc: '<p>Foo</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<div rel="ve:Alien" data-diff-action="remove">Alien</div>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">Foo</p>' +
					'</div>'
			},
			{
				msg: 'Multi-node insert',
				oldDoc: '',
				newDoc: '<p>foo</p><p>bar</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove"></p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">foo</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">bar</p>' +
					'</div>'
			},
			{
				msg: 'Multi-node remove',
				oldDoc: '<p>foo</p><p>bar</p>',
				newDoc: '',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">foo</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="remove">bar</p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert"></p>' +
					'</div>'
			},
			{
				msg: 'About-grouped node inserted',
				oldDoc: '<p>Foo</p>',
				newDoc: '<p>Foo</p>' +
					'<div rel="ve:Alien" about="#group1">A</div>' +
					'<div rel="ve:Alien" about="#group1">B</div>' +
					'<div rel="ve:Alien" about="#group1">C</div>',
				expected:
					'<p data-diff-action="none">Foo</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<div data-diff-action="insert" rel="ve:Alien" about="#group1">A</div>' +
						'<div data-diff-action="insert" rel="ve:Alien" about="#group1">B</div>' +
						'<div data-diff-action="insert" rel="ve:Alien" about="#group1">C</div>' +
					'</div>'
			},
			{
				msg: 'Inline node inserted',
				oldDoc: '<p>foo bar baz quux</p>',
				newDoc: '<p>foo bar <!--whee--> baz quux</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar ' +
							'<ins data-diff-action="insert">' + comment( 'whee' ) + ' </ins>' +
							'baz quux' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Inline node removed',
				oldDoc: '<p>foo bar <!--whee--> baz quux</p>',
				newDoc: '<p>foo bar baz quux</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar ' +
							'<del data-diff-action="remove">' + comment( 'whee' ) + ' </del>' +
							'baz quux' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Inline node modified',
				oldDoc: '<p>foo bar <!--whee--> baz quux</p>',
				newDoc: '<p>foo bar <!--wibble--> baz quux</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar ' +
							'<span data-diff-action="change-remove">' + comment( 'whee' ) + '</span>' +
							'<span data-diff-action="change-insert" data-diff-id="0">' + comment( 'wibble' ) + '</span>' +
							' baz quux' +
						'</p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-comment-diff,<span>w<del>he</del><ins>ibbl</ins>e</span></div>'
				]
			},
			{
				msg: 'Alien node modified',
				oldDoc: '<p>foo</p><div rel="ve:Alien">Alien old</div>',
				newDoc: '<p>foo</p><div rel="ve:Alien">Alien new</div>',
				expected:
					'<p data-diff-action="none">foo</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<div rel="ve:Alien" data-diff-action="remove">Alien old</div>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<div rel="ve:Alien" data-diff-action="insert">Alien new</div>' +
					'</div>'
			},
			{
				msg: '`about` attribute ignored inside alien nodes',
				oldDoc: '<div rel="ve:Alien"><span about="old">Alien</span></div>',
				newDoc: '<div rel="ve:Alien"><span about="new">Alien</span></div>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<div rel="ve:Alien"><span about="new">Alien</span></div>' +
					'</div>'
			},
			{
				msg: 'Paragraphs moved',
				oldDoc: '<p>foo</p><p>bar</p>',
				newDoc: '<p>bar</p><p>foo</p>',
				expected:
					'<p data-diff-action="none" data-diff-move="up" data-diff-id="0">bar</p>' +
					'<p data-diff-action="none">foo</p>',
				expectedDescriptions: [
					'<div>visualeditor-diff-moved-up</div>'
				]
			},
			{
				msg: 'Paragraphs moved, with insert',
				oldDoc: '<p>foo</p><p>bar</p>',
				newDoc: '<p>baz</p><p>bar</p><p>foo</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change"><p data-diff-action="insert">baz</p></div>' +
					'<p data-diff-action="none" data-diff-move="up" data-diff-id="0">bar</p>' +
					'<p data-diff-action="none">foo</p>',
				expectedDescriptions: [
					'<div>visualeditor-diff-moved-up</div>'
				]
			},
			{
				msg: 'Paragraphs moved, with remove',
				oldDoc: '<p>baz</p><p>foo</p><p>bar</p>',
				newDoc: '<p>bar</p><p>foo</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change"><p data-diff-action="remove">baz</p></div>' +
					'<p data-diff-action="none" data-diff-move="up" data-diff-id="0">bar</p>' +
					'<p data-diff-action="none">foo</p>',
				expectedDescriptions: [
					'<div>visualeditor-diff-moved-up</div>'
				]
			},
			{
				msg: 'Paragraphs moved and modified',
				oldDoc: '<p>foo bar baz</p><p>quux whee</p>',
				newDoc: '<p>quux whee!</p><p>foo bar baz!</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-move="up" data-diff-id="0">quux whee<ins data-diff-action="insert">!</ins></p>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo bar baz<ins data-diff-action="insert">!</ins></p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-diff-moved-up</div>'
				]
			},
			{
				msg: 'Insert table column',
				oldDoc: '<table><tr><td>A</td></tr><tr><td>C</td></tr></table>',
				newDoc: '<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<table><tbody>' +
							'<tr><td>A</td>' +
							'<td data-diff-action="structural-insert"><p data-diff-action="insert">B</p></td></tr>' +
							'<tr><td>C</td>' +
							'<td data-diff-action="structural-insert"><p data-diff-action="insert">D</p></td></tr>' +
						'</tbody></table>' +
					'</div>'
			},
			{
				msg: 'Remove table column',
				oldDoc: '<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>',
				newDoc: '<table><tr><td>A</td></tr><tr><td>C</td></tr></table>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<table><tbody>' +
							'<tr><td>A</td><td data-diff-action="structural-remove"><p data-diff-action="remove">B</p></td></tr>' +
							'<tr><td>C</td><td data-diff-action="structural-remove"><p data-diff-action="remove">D</p></td></tr>' +
						'</tbody></table>' +
					'</div>'
			},
			{
				msg: 'Table row removed and cells edited',
				oldDoc: '<table>' +
						'<tr><td>A</td><td>B</td><td>C</td></tr>' +
						'<tr><td>D</td><td>E</td><td>F</td></tr>' +
						'<tr><td>G</td><td>H</td><td>I</td></tr>' +
					'</table>',
				newDoc: '<table>' +
						'<tr><td>A</td><td>B</td><td>X</td></tr>' +
						'<tr><td>G</td><td>H</td><td>Y</td></tr>' +
					'</table>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<table><tbody>' +
							'<tr><td>A</td><td>B</td><td><del data-diff-action="remove">C</del><ins data-diff-action="insert">X</ins></td></tr>' +
							'<tr data-diff-action="structural-remove">' +
								'<td data-diff-action="structural-remove"><p data-diff-action="remove">D</p></td>' +
								'<td data-diff-action="structural-remove"><p data-diff-action="remove">E</p></td>' +
								'<td data-diff-action="structural-remove"><p data-diff-action="remove">F</p></td>' +
							'</tr>' +
							'<tr><td>G</td><td>H</td><td><del data-diff-action="remove">I</del><ins data-diff-action="insert">Y</ins></td></tr>' +
						'</tbody></table>' +
					'</div>'
			},
			{
				msg: 'Annotation insertion',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo <b>bar</b> baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <span data-diff-action="change-remove">bar</span><span data-diff-action="change-insert" data-diff-id="0"><b>bar</b></span> baz</p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-textstyle-added,visualeditor-annotationbutton-bold-tooltip</div>'
				]
			},
			{
				msg: 'Annotation removal',
				oldDoc: '<p>foo <b>bar</b> baz</p>',
				newDoc: '<p>foo bar baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <span data-diff-action="change-remove"><b>bar</b></span><span data-diff-action="change-insert" data-diff-id="0">bar</span> baz</p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-textstyle-removed,visualeditor-annotationbutton-bold-tooltip</div>'
				]
			},
			{
				msg: 'Annotation attribute change',
				oldDoc: '<p>foo <a href="http://example.org/quuz">bar</a> baz</p>',
				newDoc: '<p>foo <a href="http://example.org/whee">bar</a> baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <span data-diff-action="change-remove"><a href="http://example.org/quuz">bar</a></span><span data-diff-action="change-insert" data-diff-id="0"><a href="http://example.org/whee">bar</a></span> baz</p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-link-href-diff,<span>http://example.org/<del>quuz</del><ins>whee</ins></span></div>'
				]
			},
			{
				msg: 'Annotation insertion (no desc)',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo <dfn>bar</dfn> baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <span data-diff-action="change-remove">bar</span><span data-diff-action="change-insert"><dfn>bar</dfn></span> baz</p>' +
					'</div>'
			},
			{
				msg: 'Annotation removal (no desc)',
				oldDoc: '<p>foo <dfn>bar</dfn> baz</p>',
				newDoc: '<p>foo bar baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <span data-diff-action="change-remove"><dfn>bar</dfn></span><span data-diff-action="change-insert">bar</span> baz</p>' +
					'</div>'
			},
			{
				msg: 'Link insertion',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo <a href="http://example.org/">bar</a> baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <span data-diff-action="change-remove">bar</span><span data-diff-action="change-insert" data-diff-id="0"><a href="http://example.org/">bar</a></span> baz</p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-link-added,http://example.org/</div>'
				]
			},
			{
				msg: 'Link removal',
				oldDoc: '<p>foo <a href="http://example.org/">bar</a> baz</p>',
				newDoc: '<p>foo bar baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <span data-diff-action="change-remove"><a href="http://example.org/">bar</a></span><span data-diff-action="change-insert" data-diff-id="0">bar</span> baz</p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-link-removed,http://example.org/</div>'
				]
			},
			{
				msg: 'Nested annotation change',
				oldDoc: '<p><a href="http://example.org/">foo bar baz</a></p>',
				newDoc: '<p><a href="http://example.org/">foo <b>bar</b> baz</a></p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p><a href="http://example.org/">foo <span data-diff-action="change-remove">bar</span><span data-diff-action="change-insert" data-diff-id="0"><b>bar</b></span> baz</a></p>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-textstyle-added,visualeditor-annotationbutton-bold-tooltip</div>'
				]
			},
			{
				msg: 'Annotation insertion with text change',
				oldDoc: '<p>foo car baz</p>',
				newDoc: '<p>foo <b>bar</b> baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <del data-diff-action="remove">car</del><ins data-diff-action="insert"><b>bar</b></ins> baz</p>' +
					'</div>'
			},
			{
				msg: 'Annotation removal with text change',
				oldDoc: '<p>foo <b>bar</b> baz</p>',
				newDoc: '<p>foo car baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo <del data-diff-action="remove"><b>bar</b></del><ins data-diff-action="insert">car</ins> baz</p>' +
					'</div>'
			},
			{
				msg: 'Comment insertion',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo bar<!--comment--> baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar' +
							'<ins data-diff-action="insert">' + comment( 'comment' ) + '</ins>' +
							' baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Comment removal',
				oldDoc: '<p>foo bar<!--comment--> baz</p>',
				newDoc: '<p>foo bar baz</p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>' +
							'foo bar' +
							'<del data-diff-action="remove">' + comment( 'comment' ) + '</del>' +
							' baz' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'List item insertion',
				oldDoc: '<ul><li>foo</li><li>baz</li></ul>',
				newDoc: '<ul><li>foo</li><li>bar</li><li>baz</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li><p data-diff-action="none">foo</p></li>' +
							'<li><p data-diff-action="insert">bar</p></li>' +
							'<li><p data-diff-action="none">baz</p></li>' +
						'</ul>' +
					'</div>'
			},
			{
				msg: 'List item removal',
				oldDoc: '<ul><li>foo</li><li>bar</li><li>baz</li></ul>',
				newDoc: '<ul><li>foo</li><li>baz</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li><p data-diff-action="none">foo</p></li>' +
							'<li><p data-diff-action="remove">bar</p></li>' +
							'<li><p data-diff-action="none">baz</p></li>' +
						'</ul>' +
					'</div>'
			},
			{
				msg: 'List item removal from both ends',
				oldDoc: '<ul><li>foo</li><li>bar</li><li>baz</li></ul>',
				newDoc: '<ul><li>bar</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li><p data-diff-action="remove">foo</p></li>' +
							'<li><p data-diff-action="none">bar</p></li>' +
							'<li><p data-diff-action="remove">baz</p></li>' +
						'</ul>' +
					'</div>'
			},
			{
				msg: 'List item move up',
				oldDoc: '<ul><li>foo</li><li>bar</li><li>baz</li><li>quux</li></ul>',
				newDoc: '<ul><li>baz</li><li>foo</li><li>bar</li><li>quux</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li><p data-diff-action="none" data-diff-move="up" data-diff-id="0">baz</p></li>' +
							'<li><p data-diff-action="none">foo</p></li>' +
							'<li><p data-diff-action="none">bar</p></li>' +
							'<li><p data-diff-action="none">quux</p></li>' +
						'</ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-diff-moved-up</div>'
				]
			},
			{
				msg: 'List item move down',
				oldDoc: '<ul><li>foo</li><li>bar</li><li>baz</li><li>quux</li></ul>',
				newDoc: '<ul></li><li>foo</li><li>baz<li>quux</li><li>bar</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li><p data-diff-action="none">foo</p></li>' +
							'<li><p data-diff-action="none">baz</p></li>' +
							'<li><p data-diff-action="none">quux</p></li>' +
							'<li><p data-diff-action="none" data-diff-move="down" data-diff-id="0">bar</p></li>' +
						'</ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-diff-moved-down</div>'
				]
			},
			{
				msg: 'List item move and change',
				oldDoc: '<ul><li>foo</li><li>bar</li><li>baz baz</li><li>quux</li></ul>',
				newDoc: '<ul><li>baz bat</li><li>foo</li><li>bar</li><li>quux</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li><p data-diff-move="up" data-diff-id="0">baz <del data-diff-action="remove">baz</del><ins data-diff-action="insert">bat</ins></p></li>' +
							'<li><p data-diff-action="none">foo</p></li>' +
							'<li><p data-diff-action="none">bar</p></li>' +
							'<li><p data-diff-action="none">quux</p></li>' +
						'</ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-diff-moved-up</div>'
				]
			},
			{
				msg: 'List item indentation',
				oldDoc: '<ul><li>foo</li><li>bar</li><li>baz</li></ul>',
				newDoc: '<ul><li>foo<ul><li>bar</li></ul></li><li>baz</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li>' +
								'<p data-diff-action="none">foo</p>' +
								'<ul>' +
									'<li data-diff-id="0">' +
										'<p data-diff-action="structural-change">bar</p>' +
									'</li>' +
								'</ul>' +
							'</li>' +
							'<li>' +
								'<p data-diff-action="none">baz</p>' +
							'</li>' +
						'</ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-list-indent</div>'
				]
			},
			{
				msg: 'List item deindentation',
				oldDoc: '<ul><li>foo<ul><li>bar</li></ul></li><li>baz</li></ul>',
				newDoc: '<ul><li>foo</li><li>bar</li><li>baz</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li>' +
								'<p data-diff-action="none">foo</p>' +
							'</li>' +
							'<li data-diff-id="0">' +
								'<p data-diff-action="structural-change">bar</p>' +
							'</li>' +
							'<li>' +
								'<p data-diff-action="none">baz</p>' +
							'</li>' +
						'</ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-list-outdent</div>'
				]
			},
			{
				msg: 'List item deindentation from numbered list to bullet',
				oldDoc: '<ul><li>Foo<ol><li>Bar</li><li>Baz</li></ol></li></ul>',
				newDoc: '<ul><li>Foo<ol><li>Bar</li></ol></li><li>Baz</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li><p data-diff-action="none">Foo</p>' +
								'<ol>' +
									'<li><p data-diff-action="none">Bar</p></li>' +
								'</ol>' +
							'</li>' +
							'<li data-diff-id="0"><p data-diff-action="structural-change">Baz</p></li>' +
						'</ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-list-outdent</div>',
					'<div>visualeditor-changedesc-no-key,<del>visualeditor-listbutton-number-tooltip</del>,<ins>visualeditor-listbutton-bullet-tooltip</ins></div>'
				]
			},
			{
				msg: 'Full list replacement',
				oldDoc: '<ul><li>one</li><li>two</li><li>three</li></ul>',
				newDoc: '<ul><li>four</li><li>five</li><li>six</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul data-diff-action="remove">' +
							'<li>one</li>' +
							'<li>two</li>' +
							'<li>three</li>' +
						'</ul>' +
					'</div>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul data-diff-action="insert">' +
							'<li>four</li>' +
							'<li>five</li>' +
							'<li>six</li>' +
						'</ul>' +
					'</div>'
			},
			{
				msg: 'List node type change',
				oldDoc: '<ul><li>Foo</li><li>Bar</li><li>Baz</li></ul>',
				newDoc: '<ol><li>Foo</li><li>Bar</li><li>Baz</li></ol>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ol data-diff-id="0"><li><p data-diff-action="structural-change">Foo</p></li><li><p data-diff-action="structural-change">Bar</p></li><li><p data-diff-action="structural-change">Baz</p></li></ol>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-no-key,<del>visualeditor-listbutton-bullet-tooltip</del>,<ins>visualeditor-listbutton-number-tooltip</ins></div>'
				]
			},
			{
				msg: 'List node type change with indentation',
				oldDoc: '<ul><li>Foo</li><li>Bar</li><li>Baz</li></ul>',
				newDoc: '<ol><li>Foo<ul><li>Bar</li></ul></li><li>Baz</li></ol>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ol data-diff-id="0">' +
							'<li><p data-diff-action="structural-change">Foo</p>' +
								'<ul><li data-diff-id="1"><p data-diff-action="structural-change">Bar</p></li></ul>' +
							'</li>' +
							'<li><p data-diff-action="structural-change">Baz</p></li>' +
						'</ol>' +
					'</div>',
				expectedDescriptions: [
					// TODO: This should show only one list node type change
					'<div>visualeditor-changedesc-no-key,<del>visualeditor-listbutton-bullet-tooltip</del>,<ins>visualeditor-listbutton-number-tooltip</ins></div>',
					'<div>visualeditor-changedesc-list-indent</div>',
					'<div>visualeditor-changedesc-no-key,<del>visualeditor-listbutton-bullet-tooltip</del>,<ins>visualeditor-listbutton-number-tooltip</ins></div>'
				]
			},
			{
				msg: 'List item node type change',
				oldDoc: '<dl><dt>Foo</dt><dd>Bar</dd></dl>',
				newDoc: '<dl><dd>Foo</dd><dd>Bar</dd></dl>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<dl>' +
							'<dd data-diff-id="0"><p data-diff-action="structural-change">Foo</p></dd>' +
							'<dd><p data-diff-action="none">Bar</p></dd>' +
						'</dl>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-changed,style,<del>term</del>,<ins>definition</ins></div>'
				]
			},
			{
				msg: 'List item indentation with child type change',
				oldDoc: '<ul><li>foo</li><li><h2>bar</h2></li><li>baz</li></ul>',
				newDoc: '<ul><li>foo<ul><li><h3>bar</h3></li></ul></li><li>baz</li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul>' +
							'<li>' +
								'<p data-diff-action="none">foo</p>' +
								'<ul>' +
									'<li data-diff-id="1">' +
										'<h3 data-diff-action="structural-change" data-diff-id="0">bar</h3>' +
									'</li>' +
								'</ul>' +
							'</li>' +
							'<li>' +
								'<p data-diff-action="none">baz</p>' +
							'</li>' +
						'</ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-no-key,<del>visualeditor-formatdropdown-format-heading2</del>,<ins>visualeditor-formatdropdown-format-heading3</ins></div>',
					'<div>visualeditor-changedesc-list-indent</div>'
				]
			},
			{
				msg: 'Inline widget with same type but not diff comparable is marked as a remove/insert',
				oldDoc: '<p>Foo bar baz<span rel="test:inlineWidget" data-name="FooWidget"></span></p>',
				newDoc: '<p>Foo bar baz<span rel="test:inlineWidget" data-name="BarWidget"></span></p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>Foo bar baz' +
							'<del data-diff-action="remove"><span rel="test:inlineWidget" data-name="FooWidget"></span></del>' +
							'<ins data-diff-action="insert"><span rel="test:inlineWidget" data-name="BarWidget"></span></ins>' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Adjacent inline node removed with common prefix modified',
				oldDoc: '<p>foo bar <!--whee--><!--wibble--></p>',
				newDoc: '<p>foo quux bar <!--whee--></p>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p>foo ' +
							'<ins data-diff-action="insert">quux </ins>' +
							'bar ' +
							comment( 'whee' ) +
							'<del data-diff-action="remove">' + comment( 'wibble' ) + '</del>' +
						'</p>' +
					'</div>'
			},
			{
				msg: 'Similar item added to list and indented (T187632)',
				oldDoc:
					'<ul>' +
						'<li>foo</li>' +
						'<li>bar baz quux whee one</li>' +
					'</ul>',
				newDoc:
					'<ul>' +
						'<li>foo</li>' +
						'<li>bar baz quux whee one' +
							'<ul><li>bar baz quux whee won</li></ul>' +
						'</li>' +
					'</ul>',
				expected: '<div class="ve-ui-diffElement-doc-child-change">' +
					'<ul>' +
						'<li><p data-diff-action="none">foo</p></li>' +
						'<li><p data-diff-action="none">bar baz quux whee one</p>' +
							'<ul><li><p data-diff-action="insert">bar baz quux whee won</p></li></ul>' +
						'</li>' +
					'</ul>' +
				'</div>'
			},
			{
				msg: 'Newlines and tabs are substituted in a paragraph',
				oldDoc: '<p>Quux</p>',
				newDoc: '<p>Quux</p><p>Foo\n\tBar</p>',
				expected: '<p data-diff-action="none">Quux</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<p data-diff-action="insert">Foo↵➞Bar</p>' +
					'</div>'
			},
			{
				msg: 'Newlines and tabs not substitued in nodes with signficant whitespace',
				oldDoc: '<p>Quux</p>',
				newDoc: '<p>Quux</p><pre>Foo\n\tBar</pre>',
				expected: '<p data-diff-action="none">Quux</p>' +
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<pre data-diff-action="insert">Foo\n\tBar</pre>' +
					'</div>'
			},
			{
				msg: 'Metadata change inside paragraph (no diff)',
				oldDoc: '<p>foo bar baz<meta foo="a"></p>',
				newDoc: '<p>foo bar baz<meta foo="b"></p>',
				expected: '<div class="ve-ui-diffElement-no-changes">' + ve.msg( 'visualeditor-diff-no-changes' ) + '</div>'
			},
			{
				msg: 'Metadata change between list items (no diff)',
				oldDoc: '<ul><li>foo</li><meta foo="a"><li>baz</li></ul>',
				newDoc: '<ul><li>foo</li><meta foo="b"><li>baz</li></ul>',
				expected: '<div class="ve-ui-diffElement-no-changes">' + ve.msg( 'visualeditor-diff-no-changes' ) + '</div>'
			},
			{
				msg: 'Insert metadata inside paragraph (no diff)',
				oldDoc: '<p>foo bar baz</p>',
				newDoc: '<p>foo bar baz<meta foo="a"></p>',
				expected: '<div class="ve-ui-diffElement-no-changes">' + ve.msg( 'visualeditor-diff-no-changes' ) + '</div>'
			},
			{
				msg: 'Remove metadata inside paragraph (no diff)',
				oldDoc: '<p>foo bar baz<meta foo="a"></p>',
				newDoc: '<p>foo bar baz</p>',
				expected: '<div class="ve-ui-diffElement-no-changes">' + ve.msg( 'visualeditor-diff-no-changes' ) + '</div>'
			},
			{
				msg: 'Header attribute change in list',
				oldDoc: '<ul><li><h2>Foo</h2></li></ul>',
				newDoc: '<ul><li><h3>Foo</h3></li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul><li><h3 data-diff-action="structural-change" data-diff-id="0">Foo</h3></li></ul>' +
					'</div>',
				expectedDescriptions: [
					'<div>visualeditor-changedesc-no-key,<del>visualeditor-formatdropdown-format-heading2</del>,<ins>visualeditor-formatdropdown-format-heading3</ins></div>'
				]
			},
			{
				msg: 'Table change in list',
				oldDoc: '<ul><li><table><tr><td>Foo</td><td>Bar</td><td>Baz1</td></tr></table></li></ul>',
				newDoc: '<ul><li><table><tr><td>Foo</td><td>Bar</td><td>Baz2</td></tr></table></li></ul>',
				expected:
					'<div class="ve-ui-diffElement-doc-child-change">' +
						'<ul><li>' +
							'<table><tbody><tr><td>Foo</td><td>Bar</td><td><del data-diff-action="remove">Baz1</del><ins data-diff-action="insert">Baz2</ins></td></tr></tbody></table>' +
						'</li></ul>' +
					'</div>'
			}
		];

	function InlineWidgetNode() {
		InlineWidgetNode.super.apply( this, arguments );
	}
	OO.inheritClass( InlineWidgetNode, ve.dm.LeafNode );
	InlineWidgetNode.static.name = 'testInlineWidget';
	InlineWidgetNode.static.matchTagNames = [ 'span' ];
	InlineWidgetNode.static.matchRdfaTypes = [ 'test:inlineWidget' ];
	InlineWidgetNode.static.isContent = true;
	InlineWidgetNode.static.toDataElement = function ( domElements ) {
		return {
			type: this.name,
			attributes: {
				name: domElements[ 0 ].getAttribute( 'data-name' )
			}
		};
	};
	InlineWidgetNode.static.isDiffComparable = function ( element, other ) {
		return element.attributes.name === other.attributes.name;
	};
	ve.dm.modelRegistry.register( InlineWidgetNode );

	cases.forEach( function ( caseItem ) {
		ve.test.utils.runDiffElementTest( assert, caseItem );
	} );

	ve.dm.modelRegistry.unregister( InlineWidgetNode );
} );

QUnit.test( 'compareAttributes/describeChanges', function ( assert ) {
	var cases = [
		{
			msg: 'LinkAnnotation: Random attribute test (fallback)',
			type: 'link',
			before: {
				href: 'https://www.example.org/foo'
			},
			after: {
				href: 'https://www.example.org/foo',
				foo: '!!'
			},
			expected: [ 'visualeditor-changedesc-set,foo,<ins>!!</ins>' ]
		},
		{
			msg: 'LinkAnnotation: href change',
			type: 'link',
			before: { href: 'https://www.example.org/foo' },
			after: { href: 'https://www.example.org/bar' },
			expected: [ 'visualeditor-changedesc-link-href-diff,<span>https://www.example.org/<del>foo</del><ins>bar</ins></span>' ]
		},
		{
			msg: 'LinkAnnotation: href fragment change',
			type: 'link',
			before: { href: 'https://www.example.org/foo#bar' },
			after: { href: 'https://www.example.org/foo#baz' },
			expected: [ 'visualeditor-changedesc-link-href-diff,<span>https://www.example.org/foo#ba<del>r</del><ins>z</ins></span>' ]
		},
		{
			msg: 'LinkAnnotation: Full href change',
			type: 'link',
			before: { href: 'foo' },
			after: { href: 'bar' },
			expected: [ 'visualeditor-changedesc-link-href,<del>foo</del>,<ins>bar</ins>' ]
		},
		{
			msg: 'LanguageAnnotation: lang change',
			type: 'meta/language',
			before: { nodeName: 'span', lang: 'en', dir: 'ltr' },
			after: { nodeName: 'span', lang: 'fr', dir: 'ltr' },
			expected: [ 'visualeditor-changedesc-language,<del>langname-en</del>,<ins>langname-fr</ins>' ]
		},
		{
			msg: 'LanguageAnnotation: dir change',
			type: 'meta/language',
			before: { nodeName: 'span', lang: 'en', dir: 'ltr' },
			after: { nodeName: 'span', lang: 'en', dir: 'rtl' },
			expected: [ 'visualeditor-changedesc-direction,<del>ltr</del>,<ins>rtl</ins>' ]
		},
		{
			msg: 'LanguageAnnotation: Other attribute change (fallback)',
			type: 'meta/language',
			before: { nodeName: 'span', lang: 'en', dir: 'ltr', foo: 'bar' },
			after: { nodeName: 'span', lang: 'en', dir: 'ltr', foo: 'quux' },
			expected: [ 'visualeditor-changedesc-changed,foo,<del>bar</del>,<ins>quux</ins>' ]
		}
	];

	cases.forEach( function ( caseItem ) {
		var attributeChanges = ve.ui.DiffElement.static.compareAttributes( caseItem.before, caseItem.after );
		var changes = ve.dm.modelRegistry.lookup( caseItem.type ).static.describeChanges(
			attributeChanges, caseItem.after, { type: caseItem.type, attributes: caseItem.after }
		);
		changes.forEach( function ( change, j ) {
			assert.deepEqualWithDomElements(
				change,
				$.parseHTML( caseItem.expected[ j ] ),
				caseItem.msg + ', message ' + j
			);
		} );
	} );
} );
