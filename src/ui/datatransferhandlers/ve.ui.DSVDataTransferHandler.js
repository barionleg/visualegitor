/*!
 * VisualEditor UserInterface delimiter-separated values data transfer handler class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Delimiter-separated values data transfer handler.
 *
 * @class
 * @extends ve.ui.DataTransferHandler
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {File} file
 */
ve.ui.DSVDataTransferHandler = function VeUiDSVDataTransferHandler() {
	// Parent constructor
	ve.ui.DSVDataTransferHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.DSVDataTransferHandler, ve.ui.DataTransferHandler );

/* Static properties */

ve.ui.DSVDataTransferHandler.static.name = 'dsv';

ve.ui.DSVDataTransferHandler.static.types = [ 'text/csv', 'text/tab-separated-values' ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.DSVDataTransferHandler.prototype.process = function () {
	this.createProgress( this.insertableDataDeferred.promise() );
	this.reader.readAsText( this.file );
};

/**
 * @inheritdoc
 */
ve.ui.DSVDataTransferHandler.prototype.onFileProgress = function ( e ) {
	if ( e.lengthComputable ) {
		this.setProgress( 100 * e.loaded / e.total );
	} else {
		this.setProgress( false );
	}
};

/**
 * @inheritdoc
 */
ve.ui.DSVDataTransferHandler.prototype.onFileLoad = function () {
	var i, j, line,
		data = [],
		input = Papa.parse( this.reader.result );

	if ( input.meta.aborted || ( input.data.length <= 0 ) ) {
		this.insertableDataDeffered.reject();
		return;
	}

	data.push( { type: 'table' } );
	data.push( { type: 'tableSection', attributes: { style: 'body' } } );

	for ( i = 0; i < input.data.length; i++ ) {
		data.push( { type: 'tableRow' } );
		line = input.data[i];
		for ( j = 0; j < line.length; j++ ) {
			data.push( { type: 'tableCell', attributes: { style: ( i === 0 ? 'header' : 'data' ) } } );
			data.push( { type: 'paragraph', internal: { generated: 'wrapper' } } );
			data = data.concat( line[j].split( '' ) );
			data.push( { type: '/paragraph' } );
			data.push( { type: '/tableCell' } );
		}
		data.push( { type: '/tableRow' } );
	}

	data.push( { type: '/tableSection' } );
	data.push( { type: '/table' } );

	this.insertableDataDeferred.resolve( data );
	this.setProgress( 100 );
};

/**
 * @inheritdoc
 */
ve.ui.DSVDataTransferHandler.prototype.onFileLoadEnd = function () {
	// 'loadend' fires after 'load'/'abort'/'error'.
	// Reject the deferred if it hasn't already resolved.
	this.insertableDataDeferred.reject();
};

/**
 * @inheritdoc
 */
ve.ui.DSVDataTransferHandler.prototype.abort = function () {
	// Parent method
	ve.ui.DSVDataTransferHandler.super.prototype.abort.call( this );

	this.reader.abort();
};

/* Registration */

ve.ui.dataTransferHandlerFactory.register( ve.ui.DSVDataTransferHandler );
