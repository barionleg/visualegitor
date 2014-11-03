/*!
 * VisualEditor UserInterface plain text file drop handler class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Plain text file drop handler.
 *
 * @class
 * @extends ve.ui.FileDropHandler
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {File} file
 */
ve.ui.PlainTextFileDropHandler = function VeUiPlainTextFileDropHandler() {
	// Parent constructor
	ve.ui.FileDropHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.PlainTextFileDropHandler, ve.ui.FileDropHandler );

/* Static properties */

ve.ui.PlainTextFileDropHandler.static.name = 'plainText';

ve.ui.PlainTextFileDropHandler.static.types = ['text/plain'];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.PlainTextFileDropHandler.prototype.insert = function ( fragment ) {
	var reader = new FileReader();

	reader.onload = function () {
		var i, l,
			content = [],
			lines = reader.result.split( /[\r\n]+/ );
		for ( i = 0, l = lines.length; i < l; i++ ) {
			if ( lines[i].length ) {
				content.push( { type: 'paragraph' } );
				content = content.concat( lines[i].split( '' ) );
				content.push( { type: '/paragraph' } );
			}
		}
		fragment.collapseToEnd().insertContent( content );
	};

	reader.readAsText( this.file );
};

/* Registration */

ve.ui.fileDropHandlerFactory.register( ve.ui.PlainTextFileDropHandler );
