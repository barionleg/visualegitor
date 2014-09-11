/*!
 * VisualEditor Range tests.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

QUnit.module( 've.Range' );

/* Tests */

QUnit.test( 'Basic usage (isCollapsed, isBackwards, getLength, equals, equalsSelection)', 15, function ( assert ) {
	var range;

	range = new ve.Range( 100, 200 );
	assert.strictEqual( range.isCollapsed(), false );
	assert.strictEqual( range.isBackwards(), false );
	assert.strictEqual( range.getLength(), 100 );
	assert.ok( range.equals( new ve.Range( 100, 200 ) ), 'equals matches identical range' );
	assert.ok( !range.equals( new ve.Range( 200, 100 ) ), 'equals doesn\'t match reverse range' );
	assert.ok( range.equalsSelection( new ve.Range( 200, 100 ) ), 'equalsSelection matches reverse range' );

	range = new ve.Range( 200, 100 );
	assert.strictEqual( range.isCollapsed(), false );
	assert.strictEqual( range.isBackwards(), true );
	assert.strictEqual( range.getLength(), 100 );

	range = new ve.Range( 100 );
	assert.strictEqual( range.isCollapsed(), true );
	assert.strictEqual( range.isBackwards(), false );
	assert.strictEqual( range.getLength(), 0 );

	range = new ve.Range( 200 );
	assert.strictEqual( range.isCollapsed(), true );
	assert.strictEqual( range.isBackwards(), false );
	assert.strictEqual( range.getLength(), 0 );

} );

// TODO: newFromTranslatedRange

// TODO: newCoveringRange

// TODO: clone

// TODO: containsOffset

// TODO: flip

// TODO: truncate
