/*!
 * VisualEditor DataModel ResourceQueue class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Resource Queue object.
 *
 * @class
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.dm.ResourceQueue = function VeDmResourceQueue( config ) {
	config = config || {};

	this.fileRepoPromise = null;
	this.providers = [];
	this.providerPromises = [];
	this.queue = [];

	this.params = {};

	this.limit = config.limit || 20;
	this.threshhold = config.threshhold || 10;

	// Mixin constructors
	OO.EventEmitter.call( this );
};

/* Setup */
OO.initClass( ve.dm.ResourceQueue );
OO.mixinClass( ve.dm.ResourceQueue, OO.EventEmitter );

/* Methods */

/**
 * Set up the queue and its resources
 *
 * @abstract
 * @return {jQuery.Promise} Promise that resolves when the resources are set up
 */
ve.dm.ResourceQueue.prototype.setup = function () {
	return $.Deferred().resolve();
};

/**
 * Get items from the queue
 *
 * @param {number} [howMany] How many items to retrieve
 * @return {jQuery.Promise} Promise that resolves into an array of items
 */
ve.dm.ResourceQueue.prototype.get = function ( howMany, config ) {
	var me = this,
		prepared = [];

	howMany = howMany || this.limit;

	// Check if the queue has enough items
	if ( this.queue.length < howMany + this.threshhold ) {
		// Call for more results
		prepared.push(
			this.queryProviders( $.extend( { howMany: howMany + this.threshhold }, config ) )
				.then( function ( items ) {
					// Add to the queue
					me.queue = me.queue.concat.apply( me.queue, items );
				} )
		);
	}

	return $.when.apply( $, prepared )
		.then( function () {
			return me.queue.splice( 0, howMany );
		} );

};

/**
 * Get results from all providers
 * @return {jQuery.Promise} Promise that is resolved into an array of fetched items.
 */
ve.dm.ResourceQueue.prototype.queryProviders = function ( howMany ) {
	var i, len,
		queue = this;

	// Make sure there are resources set up
	return this.setup()
		.then( function () {
			queue.providerPromises = [];
			// Set up the query to all providers
			for ( i = 0, len = queue.providers.length; i < len; i++ ) {
				if ( !queue.providers[i].isDepleted() ) {
					queue.providerPromises.push(
						queue.providers[i].getResults( howMany )
					);
				}
			}

			return $.when.apply( $, queue.providerPromises )
				.then( Array.prototype.concat.bind( [] ) );
		} );
};

/**
 * Set the search query for all the providers.
 *
 * This also makes sure to abort any previous promises.
 *
 * @param {Object} params API Search parameters
 */
ve.dm.ResourceQueue.prototype.setParams = function ( params ) {
	var i, len;
	if ( !ve.compare( params, this.params, true ) ) {
		this.params = ve.extendObject( this.params, params );
		// Reset queue
		this.queue = [];
		// Reset promises
		for ( i = 0, len = this.providerPromises.length; i < len; i++ ) {
			this.providerPromises[i].abort();
		}
		// Change queries
		for ( i = 0, len = this.providers.length; i < len; i++ ) {
			this.providers[i].setParams( this.params );
		}
	}
};

/**
 * Get the data parameters sent to the API
 *
 * @returns {Object} params API Search parameters
 */
ve.dm.ResourceQueue.prototype.getParams = function () {
	return this.params;
};

/**
 * Set the providers
 * @param {ve.dm.ResourceProvider[]} providers An array of providers
 */
ve.dm.ResourceQueue.prototype.setProviders = function ( providers ) {
	this.providers = providers;
};

/**
 * Add a provbider to the group
 *
 * @param {ve.dm.ResourceProvider} provider A provider object
 */
ve.dm.ResourceQueue.prototype.addProvider = function ( provider ) {
	this.providers.push( provider );
};

/**
 * Set the providers
 *
 * @returns {ve.dm.ResourceProvider[]} providers An array of providers
 */
ve.dm.ResourceQueue.prototype.getProviders = function () {
	return this.providers;
};

/**
 * Get the queue size
 *
 * @return {number} Queue size
 */
ve.dm.ResourceQueue.prototype.getQueueSize = function () {
	return this.queue.length;
};

/**
 * Set queue threshhold
 *
 * @param {number} threshhold Queue threshhold, below which we will
 *  request more items
 */
ve.dm.ResourceQueue.prototype.setThreshhold = function ( threshhold ) {
	this.threshhold = threshhold;
};

/**
 * Get queue threshhold
 *
 * @returns {number} threshhold Queue threshhold, below which we will
 *  request more items
 */
ve.dm.ResourceQueue.prototype.getThreshhold = function () {
	return this.threshhold;
};
