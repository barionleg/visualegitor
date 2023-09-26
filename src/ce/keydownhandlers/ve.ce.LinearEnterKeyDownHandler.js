/*!
 * VisualEditor ContentEditable linear enter key down handler
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* istanbul ignore next */
/**
 * Enter key down handler for linear selections.
 *
 * @class
 * @extends ve.ce.KeyDownHandler
 *
 * @constructor
 */
ve.ce.LinearEnterKeyDownHandler = function VeCeLinearEnterKeyDownHandler() {
	// Parent constructor - never called because class is fully static
	// ve.ui.LinearEnterKeyDownHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ce.LinearEnterKeyDownHandler, ve.ce.KeyDownHandler );

/* Static properties */

ve.ce.LinearEnterKeyDownHandler.static.name = 'linearEnter';

ve.ce.LinearEnterKeyDownHandler.static.keys = [ OO.ui.Keys.ENTER ];

ve.ce.LinearEnterKeyDownHandler.static.supportedSelections = [ 'linear' ];

/* Static methods */

/**
 * @inheritdoc
 */
ve.ce.LinearEnterKeyDownHandler.static.execute = function ( surface, e ) {
	e.preventDefault();
	// HACK: Add ⓪ ① ② ③  to illustrate the different sentence boundary points
	var cursor = surface.getModel().getSelection().getRange().from;
	var nodeRange = surface.getModel().getDocument().getBranchNodeFromOffset( cursor ).getRange();
	var nodeText = surface.getModel().getDocument().data.getText( true, nodeRange );
	if ( nodeText.match( /[⓪⓿]/ ) ) {
		// This CBN is already decorated
		return;
	}
	var boundaries = unicodeJS.sentencebreak.getBoundaries( nodeText );
	var operations = [];
	var offset = 0;
	var boundary, i, iLen;
	operations.push( { type: 'retain', length: nodeRange.start } );
	for ( i = 0, iLen = boundaries.length; i < iLen; i++ ) {
		boundary = boundaries[ i ];
		var digits;
		if ( boundary.ambiguous ) {
			digits = '⓪①②③';
		} else {
			digits = '⓿❶❷❸';
		}
		if ( offset < boundary.startIndex ) {
			operations.push( { type: 'retain', length: boundary.startIndex - offset } );
		}
		operations.push( { type: 'replace', remove: [], insert: [ digits[ 0 ] ] } );
		if ( boundary.content[ 0 ].value.length > 0 ) {
			operations.push( { type: 'retain', length: boundary.content[ 0 ].value.length } );
		}
		operations.push( { type: 'replace', remove: [], insert: [ digits[ 1 ] ] } );
		if ( boundary.content[ 1 ].value.length > 0 ) {
			operations.push( { type: 'retain', length: boundary.content[ 1 ].value.length } );
		}
		operations.push( { type: 'replace', remove: [], insert: [ digits[ 2 ] ] } );
		if ( boundary.content[ 2 ].value.length > 0 ) {
			operations.push( { type: 'retain', length: boundary.content[ 2 ].value.length } );
		}
		operations.push( { type: 'replace', remove: [], insert: [ digits[ 3 ] ] } );
		offset = boundary.endIndex;
	}
	var tx = new ve.dm.Transaction( operations );
	surface.changeModel( tx );
	return true;
};

/* Registration */

ve.ce.keyDownHandlerFactory.register( ve.ce.LinearEnterKeyDownHandler );
