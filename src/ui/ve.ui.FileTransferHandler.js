/*!
 * VisualEditor UserInterface data transfer handler class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Data transfer handler.
 *
 * @class
 * @extends ve.ui.DataTransferHandler
 * @abstract
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {ve.ui.DataTransferItem} item
 */
ve.ui.FileTransferHandler = function VeUiFileTransferHandler() {
	// Parent constructor
	ve.ui.FileTransferHandler.super.apply( this, arguments );

	// Properties
	this.file = this.item.getAsFile();

	this.reader = new FileReader();

	this.progress = false;
	this.progressBar = null;

	// Events
	this.reader.addEventListener( 'progress', this.onFileProgress.bind( this ) );
	this.reader.addEventListener( 'load', this.onFileLoad.bind( this ) );
	this.reader.addEventListener( 'error', this.onFileError.bind( this ) );
};

/* Inheritance */

OO.inheritClass( ve.ui.FileTransferHandler, ve.ui.DataTransferHandler );

/* Static properties */

ve.ui.FileTransferHandler.static.kinds = [ 'file' ];

/**
 * List of file extensions supported by this handler
 *
 * This is used as a fallback if no types were matched.
 *
 * @static
 * @property {string[]}
 * @inheritable
 */
ve.ui.FileTransferHandler.static.extensions = [];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.FileTransferHandler.prototype.process = function () {
	this.createProgress( this.insertableDataDeferred.promise() );
	this.reader.readAsText( this.file );
};

/**
 * Handle progress events from the file reader
 *
 * @param {Event} e Progress event
 */
ve.ui.FileTransferHandler.prototype.onFileProgress = function ( e ) {
	if ( e.lengthComputable ) {
		this.setProgress( 100 * e.loaded / e.total );
	} else {
		this.setProgress( false );
	}
};

/**
 * Handle load events from the file reader
 *
 * @param {Event} e Load event
 */
ve.ui.FileTransferHandler.prototype.onFileLoad = function () {
	this.setProgress( 100 );
};

/**
 * Handle error events from the file reader
 *
 * @param {Event} e Error event
 */
ve.ui.FileTransferHandler.prototype.onFileError = function () {
	this.abort();
};

/**
 * @inheritdoc
 */
ve.ui.FileTransferHandler.prototype.abort = function () {
	// Parent method
	ve.ui.FileTransferHandler.super.prototype.abort.apply( this, arguments );

	this.reader.abort();
};

/**
 * Create a progress bar with a specified label
 *
 * @param {jQuery.Promise} progressCompletePromise Promise which resolves when the progress action is complete
 * @param {jQuery|string|Function} [label] Progress bar label, defaults to file name
 */
ve.ui.FileTransferHandler.prototype.createProgress = function ( progressCompletePromise, label ) {
	var handler = this;

	this.surface.createProgress( progressCompletePromise, label || this.file.name ).done( function ( progressBar, cancelPromise ) {
		// Set any progress that was achieved before this resolved
		progressBar.setProgress( handler.progress );
		handler.progressBar = progressBar;
		cancelPromise.fail( handler.abort.bind( handler ) );
	} );
};

/**
 * Set progress bar progress
 *
 * Progress is stored in a property in case the progress bar doesn't exist yet.
 *
 * @param {number} progress Progress percent
 */
ve.ui.FileTransferHandler.prototype.setProgress = function ( progress ) {
	this.progress = progress;
	if ( this.progressBar ) {
		this.progressBar.setProgress( this.progress );
	}
};
