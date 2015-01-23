/*!
 * VisualEditor UserInterface Plain text string transfer handler class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Plain text string transfer handler.
 *
 * @class
 * @extends ve.ui.PlainTextStringTransferHandler
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {ve.ui.DataTransferItem} item
 */
ve.ui.GoogleMapsURLTransferHandler = function VeUiGoogleMapsURLTransferHandler() {
	// Parent constructor
	ve.ui.GoogleMapsURLTransferHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.GoogleMapsURLTransferHandler, ve.ui.PlainTextStringTransferHandler );

/* Static properties */

ve.ui.GoogleMapsURLTransferHandler.static.name = 'googleMapsURL';

ve.ui.GoogleMapsURLTransferHandler.static.handlesPaste = true;

ve.ui.GoogleMapsURLTransferHandler.static.patterns = [
	/^https?:\/\/(?:www\.|maps\.)google(?:\.[a-z]+)+\/(?:maps\/?)?.*[?&]s?ll=([0-9.-]+),([0-9.-]+).*[?&]z=([0-9.-]+)/i,
	/^https?:\/\/(?:www\.|maps\.)google(?:\.[a-z]+)+\/(?:maps\/?)?.*@([0-9.-]+),([0-9.-]+),([0-9.-]+)z/i
];

ve.ui.GoogleMapsURLTransferHandler.static.matchFunction = function ( item ) {
	return !!this.matchText( item.getAsString() );
};

ve.ui.GoogleMapsURLTransferHandler.static.matchText = function ( text ) {
	var i, l, matches;
	for ( i = 0, l = this.patterns.length; i < l; i++ ) {
		if ( ( matches = text.match( this.patterns[ i ] ) ) !== null ) {
			return {
				latitude: +matches[ 1 ],
				longitude: +matches[ 2 ],
				zoom: +matches[ 3 ] || 10
			};
		}
	}
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.GoogleMapsURLTransferHandler.prototype.process = function () {
	var matches = this.constructor.static.matchText( this.item.getAsString() );
	if ( matches ) {
		this.insertableDataDeferred.resolve( [
			{
				type: ve.dm.GoogleMapsNode.static.name,
				attributes: {
					base: '//maps.googleapis.com/maps/api/staticmap',
					mapType: 'roadmap',
					latitude: matches.latitude,
					longitude: matches.longitude,
					align: 'center',
					width: 500,
					height: 300,
					zoom: matches.zoom
				}
			},
			{ type: '/' + ve.dm.GoogleMapsNode.static.name }
		] );
	}
};

/* Registration */

ve.ui.dataTransferHandlerFactory.register( ve.ui.GoogleMapsURLTransferHandler );
