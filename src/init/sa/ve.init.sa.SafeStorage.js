( function () {
	var EXPIRY_KEY = '_mw.storage.expiryIndex';

	/**
	 * Implementation of ve.init.SafeStorage
	 *
	 * Duplicate of mediawiki.storage.
	 *
	 * @class ve.init.sa.SafeStorage
	 * @extends ve.init.SafeStorage
	 *
	 * @constructor
	 * @param {Storage|undefined} store The Storage instance to wrap around
	 */
	ve.init.sa.SafeStorage = function ( store ) {
		this.store = store;
		this.expiryCache = this.getObject( EXPIRY_KEY ) || {};
		// Debounce so that we only update the cache once in an event cycle that does multiple writes.
		this.saveExpiryCacheDebounced = OO.ui.debounce( this.saveExpiryCache.bind( this ) );
	};

	/**
	 * @inheritdoc
	 */
	ve.init.sa.SafeStorage.prototype.get = function ( key ) {
		this.clearExpired();
		try {
			return this.store.getItem( key );
		} catch ( e ) {}
		return false;
	};

	/**
	 * @inheritdoc
	 */
	ve.init.sa.SafeStorage.prototype.set = function ( key, value, expiry ) {
		this.clearExpired();
		try {
			this.store.setItem( key, value );
			if ( expiry ) {
				this.setExpires( key, expiry );
			} else {
				// Item may have previously had an expiry value, so try to clear it
				this.removeExpires( key );
			}
			return true;
		} catch ( e ) {}
		return false;
	};

	/**
	 * @inheritdoc
	 */
	ve.init.sa.SafeStorage.prototype.remove = function ( key ) {
		try {
			this.store.removeItem( key );
			this.removeExpires( key );
			return true;
		} catch ( e ) {}
		return false;
	};

	/**
	 * @inheritdoc
	 */
	ve.init.sa.SafeStorage.prototype.getObject = function ( key ) {
		var json = this.get( key );

		if ( json === false ) {
			return false;
		}

		try {
			return JSON.parse( json );
		} catch ( e ) {}

		return null;
	};

	/**
	 * @inheritdoc
	 */
	ve.init.sa.SafeStorage.prototype.setObject = function ( key, value, expiry ) {
		try {
			var json = JSON.stringify( value );
			return this.set( key, json, expiry );
		} catch ( e ) {}
		return false;
	};

	/**
	 * Set the expiry time for an item in the store
	 *
	 * @param {string} key Key name
	 * @param {number} expiry Number of seconds after which this item can be deleted
	 */
	ve.init.sa.SafeStorage.prototype.setExpires = function ( key, expiry ) {
		this.expiryCache[ key ] = Math.floor( Date.now() / 1000 ) + expiry;
		this.saveExpiryCacheDebounced();
	};

	/**
	 * Remove the expiry time for an item in the store
	 *
	 * @private
	 * @param {string} key Key name
	 */
	ve.init.sa.SafeStorage.prototype.removeExpires = function ( key ) {
		if ( !Object.prototype.hasOwnProperty.call( this.expiryCache, key ) ) {
			return;
		}
		delete this.expiryCache[ key ];
		this.saveExpiryCacheDebounced();
	};

	/**
	 * Clear an expired items from the store
	 *
	 * @private
	 */
	ve.init.sa.SafeStorage.prototype.clearExpired = function () {
		var now = Math.floor( Date.now() / 1000 );
		for ( var key in this.expiryCache ) {
			if ( !Object.prototype.hasOwnProperty.call( this.expiryCache, key ) ) {
				continue;
			}
			if ( this.expiryCache[ key ] < now ) {
				this.remove( key );
			}
		}
	};

	/**
	 * Save the expiry cache to the storage object
	 *
	 * @private
	 */
	ve.init.sa.SafeStorage.prototype.saveExpiryCache = function () {
		this.setObject( EXPIRY_KEY, this.expiryCache );
	};
}() );
