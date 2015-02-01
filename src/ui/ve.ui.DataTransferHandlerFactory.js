/*!
 * VisualEditor DataTransferHandlerFactory class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Drop handler Factory.
 *
 * @class
 * @extends OO.Factory
 * @constructor
 */
ve.ui.DataTransferHandlerFactory = function VeUiDataTransferHandlerFactory() {
	// Parent constructor
	ve.ui.DataTransferHandlerFactory.super.apply( this, arguments );

	// Handlers which match all kinds and a specific type
	this.handlerNamesByType = {};
	// Handlers which match a specific kind and type
	this.handlerNamesByKindAndType = {};
};

/* Inheritance */

OO.inheritClass( ve.ui.DataTransferHandlerFactory, OO.Factory );

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.DataTransferHandlerFactory.prototype.register = function ( constructor ) {
	// Parent method
	ve.ui.DataTransferHandlerFactory.super.prototype.register.call( this, constructor );

	var i, j, ilen, jlen,
		kinds = constructor.static.kinds,
		types = constructor.static.types;

	if ( !kinds ) {
		for ( j = 0, jlen = types.length; j < jlen; j++ ) {
			this.handlerNamesByType[types[j]] = constructor.static.name;
		}
	} else {
		for ( i = 0, ilen = kinds.length; i < ilen; i++ ) {
			for ( j = 0, jlen = types.length; j < jlen; j++ ) {
				this.handlerNamesByKindAndType[kinds[i]] = this.handlerNamesByKindAndType[kinds[i]] || {};
				this.handlerNamesByKindAndType[kinds[i]][types[j]] = constructor.static.name;
			}
		}
	}
};

/**
 * Returns the primary command for for node.
 *
 * @param {DataTransferItem} item Data transfer item
 * @returns {string|undefined} Handler name, or undefined if not found
 */
ve.ui.DataTransferHandlerFactory.prototype.getHandlerNameForItem = function ( item ) {
	return ( this.handlerNamesByKindAndType[item.kind] && this.handlerNamesByKindAndType[item.kind][item.type] ) ||
		this.handlerNamesByType[item.type];
};

/* Initialization */

ve.ui.dataTransferHandlerFactory = new ve.ui.DataTransferHandlerFactory();

/**
 * Fake data transfer item from a blob or data URI
 *
 * @class
 * @constructor
 * @param {Blob|string} blobOrDataUri Data transfer blob or data URI
 */
ve.ui.DataTransferItem = function VeUiDataTransferItem( blobOrDataUri ) {
	if ( typeof blobOrDataUri === 'string' ) {
		// Data URI: extra metadata, but don't convert until
		// getAsFile is called
		this.dataUri = blobOrDataUri;
		this.type = blobOrDataUri.match( /^data:([^;,]+)/ )[1];
	} else {
		this.blob = blobOrDataUri;
		this.type = blobOrDataUri.type;
	}
	this.kind = 'file';
};

/**
 * Get file blob
 *
 * Generically getAsFile returns a Blob, which could be a File.
 *
 * @return {Blob} File blob
 */
ve.ui.DataTransferItem.prototype.getAsFile = function () {
	var parts, binary, array, i;
	if ( !this.blob ) {
		parts = this.dataUri.split( ',' );
		delete this.dataUri;
		binary = atob( parts[1] );
		array = [];
		for ( i = 0; i < binary.length; i++ ) {
			array.push( binary.charCodeAt( i ) );
		}
		this.blob = new Blob(
			[ new Uint8Array( array ) ],
			{ type: this.type }
		);
	}
	return this.blob;
};
