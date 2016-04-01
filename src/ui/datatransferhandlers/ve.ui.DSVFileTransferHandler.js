/*!
 * VisualEditor UserInterface delimiter-separated values file transfer handler class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Delimiter-separated values file transfer handler.
 *
 * @class
 * @extends ve.ui.FileTransferHandler
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {ve.ui.DataTransferItem} item
 */
ve.ui.DSVFileTransferHandler = function VeUiDSVFileTransferHandler() {
	// Parent constructor
	ve.ui.DSVFileTransferHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.DSVFileTransferHandler, ve.ui.FileTransferHandler );

/* Static properties */

ve.ui.DSVFileTransferHandler.static.name = 'dsv';

ve.ui.DSVFileTransferHandler.static.types = [ 'text/csv', 'text/tab-separated-values' ];

ve.ui.DSVFileTransferHandler.static.extensions = [ 'csv', 'tsv' ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.DSVFileTransferHandler.prototype.onFileLoad = function () {
	var i, j, line,
		data = [],
		input = Papa.parse( this.reader.result );

	if ( input.meta.aborted || ( input.data.length <= 0 ) ) {
		this.abort();
	} else {
		data.push(
			{ type: 'table' },
			{ type: 'tableSection', attributes: { style: 'body' } }
		);

		for ( i = 0; i < input.data.length; i++ ) {
			line = input.data[ i ];

			// Skip 'empty' rows, generally at the end of the file
			if ( line.length === 1 && line[ 0 ] === '' )
			{
				 continue;
			}

			data.push( { type: 'tableRow' } );
			for ( j = 0; j < line.length; j++ ) {
				data.push(
					{ type: 'tableCell', attributes: { style: ( i === 0 ? 'header' : 'data' ) } },
					{ type: 'paragraph', internal: { generated: 'wrapper' } }
				);
				data = data.concat( line[ j ].split( '' ) );
				data.push(
					{ type: '/paragraph' },
					{ type: '/tableCell' }
				);
			}
			data.push( { type: '/tableRow' } );
		}

		data.push(
			{ type: '/tableSection' },
			{ type: '/table' }
		);

		this.resolve( data );
	}

	// Parent method
	ve.ui.DSVFileTransferHandler.super.prototype.onFileLoad.apply( this, arguments );
};

/* Registration */

ve.ui.dataTransferHandlerFactory.register( ve.ui.DSVFileTransferHandler );
