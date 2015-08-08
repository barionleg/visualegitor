/*!
 * VisualEditor UserInterface DataTransferHandlerFactory tests.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

QUnit.module( 've.ui.DataTransferHandlerFactory' );

/* Stubs */
function makeStubHandler( name, handlesPaste, types, kinds, extensions ) {
	function StubHandler() {
		StubHandler.super.apply( this, arguments );
	}
	OO.inheritClass( StubHandler, extensions ? ve.ui.FileTransferHandler : ve.ui.DataTransferHandler );
	StubHandler.static.name = name;
	StubHandler.static.handlesPaste = !!handlesPaste;
	StubHandler.static.kinds = kinds;
	StubHandler.static.types = types || [];
	StubHandler.static.extensions = extensions;
	return StubHandler;
}
function makeStubItem( type, kind, extension ) {
	return {
		type: type,
		kind: kind,
		getExtension: function () { return extension; }
	};
}

ve.ui.StubHandlerFileHtml1 = makeStubHandler( 'filehtml1', true, [ 'text/html' ], [ 'file' ], [ 'html' ] );
ve.ui.StubHandlerFileHtml2 = makeStubHandler( 'filehtml2', false, [ 'text/html' ], [ 'file' ], [ 'html' ] );
ve.ui.StubHandlerStringHtml = makeStubHandler( 'stringhtml', false, [ 'text/html' ], [ 'string' ] );
ve.ui.StubHandlerHtml1 = makeStubHandler( 'html1', true, [ 'text/html' ] );
ve.ui.StubHandlerHtml2 = makeStubHandler( 'html2', false, [ 'text/html' ] );
// The `html3` handler should never show up
ve.ui.StubHandlerHtml3 = makeStubHandler( 'html3', true, [ 'text/html' ] );
ve.ui.StubHandlerHtml3.static.matchFunction = function () { return false; };

/* Tests */
QUnit.test( 'getHandlerNameForItem', 14, function ( assert ) {
	var factory = new ve.ui.DataTransferHandlerFactory(),
		stubItemTypeHtml = makeStubItem( 'text/html' ),
		stubItemFileHtml = makeStubItem( 'text/html', 'file', 'html' ),
		stubItemStringHtml = makeStubItem( 'text/html', 'string', 'html' ),
		stubItemExtHtml = makeStubItem( null, null, 'html' ),
		stubItemProto = makeStubItem( '__proto__', '__proto__', '__proto__' );

	// The factory should start out empty and __proto__ shouldn't cause a crash
	assert.deepEqual( factory.getHandlerNameForItem( stubItemTypeHtml, false ), undefined );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemFileHtml, false ), undefined );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemStringHtml, false ), undefined );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemExtHtml, false ), undefined );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemProto, false ), undefined );

	factory.register( ve.ui.StubHandlerFileHtml1 );
	factory.register( ve.ui.StubHandlerFileHtml2 );
	factory.register( ve.ui.StubHandlerStringHtml );
	factory.register( ve.ui.StubHandlerHtml1 );
	factory.register( ve.ui.StubHandlerHtml2 );
	factory.register( ve.ui.StubHandlerHtml3 );

	// Ensure that __proto__ doesn't cause a crash
	assert.deepEqual( factory.getHandlerNameForItem( stubItemProto, false ), undefined );

	// 1. Match by kind + type
	assert.deepEqual( factory.getHandlerNameForItem( stubItemFileHtml, false ), 'filehtml2' );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemFileHtml, true ), 'filehtml1' );
	// 2. Match by just type (note that html3 doesn't show up)
	assert.deepEqual( factory.getHandlerNameForItem( stubItemTypeHtml, false ), 'html2' );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemTypeHtml, true ), 'html1' );
	// 3. Match by file extension
	assert.deepEqual( factory.getHandlerNameForItem( stubItemExtHtml, false ), 'filehtml2' );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemExtHtml, true ), 'filehtml1' );

	// Match by (1) kind and type, then fall through & match by (2) just type.
	assert.deepEqual( factory.getHandlerNameForItem( stubItemStringHtml, false ), 'stringhtml' );
	assert.deepEqual( factory.getHandlerNameForItem( stubItemStringHtml, true ), 'html1' );
} );
