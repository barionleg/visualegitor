/*!
 * VisualEditor DataModel ResourceProvider class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Resource Provider object.
 *
 * @class
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {string} apiurl The URL to the api
 * @param {Object} [config] Configuration options
 */
ve.dm.ResourceProvider = function VeDmResourceProvider( config ) {
	config = config || {};

	this.setAPIurl( config.apiurl );
	this.fetchLimit = config.fetchLimit || 30;
	this.lang = config.lang;
	this.offset = config.offset || 0;
	this.ajaxSettings = config.ajaxSettings || {};

	this.staticParams = config.staticParams || {};
	this.params = {};

	this.toggleDepleted( false );

	// Mixin constructors
	OO.EventEmitter.call( this );
};

/* Setup */
OO.initClass( ve.dm.ResourceProvider );
OO.mixinClass( ve.dm.ResourceProvider, OO.EventEmitter );

/* Methods */

/**
 * Get results from the source
 *
 * @param {number} howMany Number of results to ask for
 * @return {jQuery.Promise} Promise that is resolved into an array
 * of available results, or is rejected if no results are available.
 */
ve.dm.ResourceProvider.prototype.getResults = function () {
	var xhr,
		deferred = $.Deferred(),
		allParams = $.extend( {}, this.getStaticParams(), this.getParams() );

	xhr = $.getJSON( this.getAPIurl(), allParams )
		.done( function ( data ) {
			if (
				$.type( data ) !== 'array' ||
				(
					$.type( data ) === 'array' &&
					data.length === 0
				)
			) {
				deferred.resolve();
			} else {
				deferred.resolve( data );
			}
		} );
	return deferred.promise( { abort: xhr.abort } );
};

/**
 * Set api url
 *
 * @param {string} API url
 */
ve.dm.ResourceProvider.prototype.setAPIurl = function ( url ) {
	this.apiurl = url;
};

/**
 * Set api url
 *
 * @returns {string} API url
 */
ve.dm.ResourceProvider.prototype.getAPIurl = function () {
	return this.apiurl;
};

/**
 * Get the static, non-changing data parameters sent to the API
 *
 * @returns {Object} Data parameters
 */
ve.dm.ResourceProvider.prototype.getStaticParams = function () {
	return this.staticParams;
};

/**
 * Get the user-inputted dybamic data parameters sent to the API
 *
 * @returns {Object} Data parameters
 */
ve.dm.ResourceProvider.prototype.getParams = function () {
	return this.params;
};

/**
 * Set the data parameters sent to the API
 *
 * @param {Object} Data parameters
 */
ve.dm.ResourceProvider.prototype.setParams = function ( params ) {
	// Assymetrically compare (params is subset of this.params)
	if ( !ve.compare( params, this.params, true ) ) {
		this.params = $.extend( {}, this.params, params );
		// Reset offset
		this.setOffset( 0 );
		// Reset depleted status
		this.toggleDepleted( false );
	}
};

/**
 * Get fetch limit or 'page' size. This is the number
 * of results per request.
 *
 * @returns {number} limit
 */
ve.dm.ResourceProvider.prototype.getDefaultFetchLimit = function () {
	return this.limit;
};

/**
 * Set limit
 *
 * @param {number} limit
 */
ve.dm.ResourceProvider.prototype.setDefaultFetchLimit = function ( limit ) {
	this.limit = limit;
};

/**
 * Get lang
 *
 * @returns {string} lang
 */
ve.dm.ResourceProvider.prototype.getLang = function () {
	return this.lang;
};

/**
 * Set lang
 *
 * @param {string} lang
 */
ve.dm.ResourceProvider.prototype.setLang = function ( lang ) {
	this.lang = lang;
};

/**
 * Get Offset
 *
 * @returns {number} Offset
 */
ve.dm.ResourceProvider.prototype.getOffset = function () {
	return this.offset;
};

/**
 * Set Offset
 *
 * @param {number} Offset
 */
ve.dm.ResourceProvider.prototype.setOffset = function ( offset ) {
	this.offset = offset;
};

/**
 * Check whether the provider is depleted
 *
 * @returns {boolean} depleted
 */
ve.dm.ResourceProvider.prototype.isDepleted = function () {
	return this.depleted;
};

/**
 * Toggle depleted state
 *
 * @param {boolean} depleted
 */
ve.dm.ResourceProvider.prototype.toggleDepleted = function ( isDepleted ) {
	this.depleted = isDepleted !== undefined ? isDepleted : !this.depleted;
};

/**
 * Get the default ajax settings
 *
 * @returns {Object} Ajax settings
 */
ve.dm.ResourceProvider.prototype.getAjaxSettings = function () {
	return this.ajaxSettings;
};

/**
 * Get the default ajax settings
 *
 * @param {Object} Ajax settings
 */
ve.dm.ResourceProvider.prototype.setAjaxSettings = function ( settings ) {
	this.ajaxSettings = settings;
};
