( function () {
	var EXPIRY_PREFIX = '_EXPIRY_';
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
	};

	/**
	 * Retrieve value from device storage.
	 *
	 * @param {string} key Key of item to retrieve
	 * @return {string|null|boolean} String value, null if no value exists, or false
	 *  if storage is not available.
	 */
	ve.init.sa.SafeStorage.prototype.get = function ( key ) {
		this.clearExpired();
		try {
			return this.store.getItem( key );
		} catch ( e ) {}
		return false;
	};

	/**
	 * Set a value in device storage.
	 *
	 * @param {string} key Key name to store under
	 * @param {string} value Value to be stored.
	 * @param {number} [expiry] Number of seconds after which this item can be deleted
	 * @return {boolean} The value was set
	 */
	ve.init.sa.SafeStorage.prototype.set = function ( key, value, expiry ) {
		this.clearExpired();
		if ( key.slice( 0, EXPIRY_PREFIX.length ) === EXPIRY_PREFIX ) {
			throw new Error( 'Key can\'t have a prefix of ' + EXPIRY_PREFIX );
		}
		try {
			this.store.setItem( key, value );
			this.setExpires( key, expiry );
			return true;
		} catch ( e ) {}
		return false;
	};

	/**
	 * Remove a value from device storage.
	 *
	 * @param {string} key Key of item to remove
	 * @return {boolean} Whether the key was removed
	 */
	ve.init.sa.SafeStorage.prototype.remove = function ( key ) {
		try {
			this.store.removeItem( key );
			this.setExpires( key );
			return true;
		} catch ( e ) {}
		return false;
	};

	/**
	 * Retrieve JSON object from device storage.
	 *
	 * @param {string} key Key of item to retrieve
	 * @return {Object|null|boolean} Object, null if no value exists or value
	 *  is not JSON-parseable, or false if storage is not available.
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
	 * Set an object value in device storage by JSON encoding
	 *
	 * @param {string} key Key name to store under
	 * @param {Object} value Object value to be stored
	 * @param {number} [expiry] Number of seconds after which this item can be deleted
	 * @return {boolean} The value was set
	 */
	ve.init.sa.SafeStorage.prototype.setObject = function ( key, value, expiry ) {
		var json;
		try {
			json = JSON.stringify( value );
			return this.set( key, json, expiry );
		} catch ( e ) {}
		return false;
	};

	/**
	 * Set the expiry time for an item in the store
	 *
	 * @param {string} key Key name
	 * @param {number} [expiry] Number of seconds after which this item can be deleted,
	 *  omit to clear the expiry (either making the item never expire, or to clean up
	 *  when deleting a key).
	 */
	ve.init.sa.SafeStorage.prototype.setExpires = function ( key, expiry ) {
		if ( expiry ) {
			this.store.setItem(
				EXPIRY_PREFIX + key,
				Math.floor( Date.now() / 1000 ) + expiry
			);
		} else {
			this.store.removeItem( EXPIRY_PREFIX + key );
		}
	};

	/**
	 * Clear any expired items from the store
	 *
	 * @private
	 */
	ve.init.sa.SafeStorage.prototype.clearExpired = function () {
		var now = Math.floor( Date.now() / 1000 );
		var prefixLength = EXPIRY_PREFIX.length;
		for ( var i = 0, len = this.store ? this.store.length : 0; i < len; i++ ) {
			var key = this.store.key( i );
			if ( key.slice( 0, prefixLength ) === EXPIRY_PREFIX ) {
				var expiry = this.store.getItem( key );
				if ( expiry && expiry < now ) {
					this.remove( key.slice( prefixLength ) );
				}
			}
		}
	};
}() );
