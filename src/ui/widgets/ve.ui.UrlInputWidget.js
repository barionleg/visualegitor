/*!
 * VisualEditor UserInterface UrlInputWidget class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * URL input widget, suggests protocols for easier typing (especially on mobile)
 *
 * @class
 * @extends OO.ui.TextInputWidget
 * @mixins OO.ui.mixin.LookupElement
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {string[]} [protocols] List of protocols to auto-complete (defaults to static property)
 */
ve.ui.UrlInputWidget = function VeUiUrlInputWidget( config ) {
	config = config || {};

	// Parent method
	ve.ui.UrlInputWidget.super.call( this, ve.extendObject( {
		type: 'url'
	}, config ) );

	// Mixin method
	OO.ui.mixin.LookupElement.call( this, ve.extendObject( {
		showPendingRequest: false,
		showSuggestionsOnFocus: false,
		allowSuggestionsWhenEmpty: false,
		highlightFirst: false
	}, config ) );

	this.protocols = config.protocols || this.constructor.static.protocols;
};

/* Inheritance */

OO.inheritClass( ve.ui.UrlInputWidget, OO.ui.TextInputWidget );

OO.mixinClass( ve.ui.UrlInputWidget, OO.ui.mixin.LookupElement );

/* Static properties */

ve.ui.UrlInputWidget.static.protocols = [ 'http://', 'https://' ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.UrlInputWidget.prototype.getLookupRequest = function () {
	var value = this.getValue(),
		data = this.protocols.filter( function ( protocol ) {
			return protocol.indexOf( value ) === 0 && protocol !== value;
		} );
	return ve.createDeferred().resolve( data ).promise();
};

/**
 * @inheritdoc
 */
ve.ui.UrlInputWidget.prototype.getLookupCacheDataFromResponse = function ( response ) {
	return response;
};

/**
 * @inheritdoc
 */
ve.ui.UrlInputWidget.prototype.getLookupMenuOptionsFromData = function ( data ) {
	return data.map( function ( item ) {
		return new OO.ui.MenuOptionWidget( {
			label: item,
			data: item
		} );
	} );
};
