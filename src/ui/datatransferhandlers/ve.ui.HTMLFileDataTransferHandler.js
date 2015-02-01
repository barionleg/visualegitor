/*!
 * VisualEditor UserInterface HTML file data transfer handler class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * HTML file data transfer handler.
 *
 * @class
 * @extends ve.ui.DataTransferHandler
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {File} file
 */
ve.ui.HTMLFileDataTransferHandler = function VeUiHTMLFileDataTransferHandler() {
	// Parent constructor
	ve.ui.HTMLFileDataTransferHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.HTMLFileDataTransferHandler, ve.ui.DataTransferHandler );

/* Static properties */

ve.ui.HTMLFileDataTransferHandler.static.name = 'html';

ve.ui.HTMLFileDataTransferHandler.static.types = [ 'text/html', 'application/xhtml+xml' ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.HTMLFileDataTransferHandler.prototype.process = function () {
	this.createProgress( this.insertableDataDeferred.promise() );
	this.reader.readAsText( this.file );
};

/**
 * @inheritdoc
 */
ve.ui.HTMLFileDataTransferHandler.prototype.onFileProgress = function ( e ) {
	if ( e.lengthComputable ) {
		this.setProgress( 100 * e.loaded / e.total );
	} else {
		this.setProgress( false );
	}
};

/**
 * @inheritdoc
 */
ve.ui.HTMLFileDataTransferHandler.prototype.onFileLoad = function () {
	this.insertableDataDeferred.resolve(
		this.surface.getModel().getDocument().newFromHtml( this.reader.result )
	);
	this.setProgress( 100 );
};

/**
 * @inheritdoc
 */
ve.ui.HTMLFileDataTransferHandler.prototype.onFileLoadEnd = function () {
	// 'loadend' fires after 'load'/'abort'/'error'.
	// Reject the deferred if it hasn't already resolved.
	this.insertableDataDeferred.reject();
};

/**
 * @inheritdoc
 */
ve.ui.HTMLFileDataTransferHandler.prototype.abort = function () {
	// Parent method
	ve.ui.HTMLFileDataTransferHandler.super.prototype.abort.call( this );

	this.reader.abort();
};

/* Registration */

ve.ui.dataTransferHandlerFactory.register( ve.ui.HTMLFileDataTransferHandler );
