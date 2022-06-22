ve.init.createListStorage = function ( storage ) {
	var conflictKey = '__conflictId';
	var EXPIRY_PREFIX = '_EXPIRY_';

	/**
	 * Efficient append-only list storage extending a ve.init.SafeStorage instance
	 *
	 * ListStorage also implements conflict handling for localStorage.
	 * Any time the storage is used and it is detected that another process has
	 * modified the underlying data, all the managed keys are restored from an
	 * in-memory cache. There is no merging of data, all managed keys are either
	 * completely overwritten, or deleted if they were not originally set.
	 *
	 * This would be namespaced ve.init.ListStorage, but as a generated class
	 * it is never exported.
	 *
	 * @class ve.init.ListStorage
	 * @extends ve.init.SafeStorage
	 *
	 * @constructor
	 * @param {Storage|undefined} store The Storage instance to wrap around
	 */
	function ListStorage() {
		// Parent constructor
		ListStorage.super.apply( this, arguments );

		this.storageMayConflict = false;
		this.conflictBackup = {};
		this.conflictableKeys = {};
		this.conflictId = null;
	}

	/* Inheritance */

	// Dynamically extend the class of the storage object, in case
	// it is a sub-class of SafeStorage.
	var ParentStorage = storage.constructor;
	OO.inheritClass( ListStorage, ParentStorage );

	function getLengthKey( key ) {
		return key + '__length';
	}

	function getIndexKey( key, i ) {
		return key + '__' + i;
	}

	/* Methods */

	/**
	 * @inheritdoc
	 */
	ListStorage.prototype.set = function ( key, value ) {
		if ( key === conflictKey ) {
			throw new Error( 'Can\'t set key ' + conflictKey + ' directly.' );
		}
		if ( this.storageMayConflict ) {
			if ( this.isConflicted() ) {
				this.overwriteFromBackup();
			}
			if ( Object.prototype.hasOwnProperty.call( this.conflictableKeys, key ) ) {
				this.conflictBackup[ key ] = value;
			}
		}

		// Parent method
		return ListStorage.super.prototype.set.apply( this, arguments );
	};

	/**
	 * @inheritdoc
	 */
	ListStorage.prototype.remove = function ( key ) {
		if ( key === conflictKey ) {
			throw new Error( 'Can\'t remove key ' + conflictKey + ' directly.' );
		}
		if ( this.storageMayConflict ) {
			if ( this.isConflicted() ) {
				this.overwriteFromBackup();
			}
			if ( Object.prototype.hasOwnProperty.call( this.conflictableKeys, key ) ) {
				delete this.conflictBackup[ key ];
			}
		}

		// Parent method
		return ListStorage.super.prototype.remove.apply( this, arguments );
	};

	/**
	 * @inheritdoc
	 */
	ListStorage.prototype.get = function () {
		if ( this.isConflicted() ) {
			this.overwriteFromBackup();
		}

		// Parent method
		return ListStorage.super.prototype.get.apply( this, arguments );
	};

	/**
	 * @inheritdoc
	 */
	ListStorage.prototype.setExpires = function ( key ) {
		// Parent method
		ListStorage.super.prototype.setExpires.apply( this, arguments );

		if ( this.storageMayConflict ) {
			if ( Object.prototype.hasOwnProperty.call( this.conflictableKeys, key ) ) {
				var expiryAbsolute = null;
				try {
					expiryAbsolute = this.store.getItem( EXPIRY_PREFIX + key );
				} catch ( e ) {}

				if ( expiryAbsolute ) {
					this.conflictBackup[ EXPIRY_PREFIX + key ] = expiryAbsolute;
				} else {
					delete this.conflictBackup[ EXPIRY_PREFIX + key ];
				}
			}
		}
	};

	/**
	 * Check if another process has written to the shared storage, leaving
	 * our data in a conflicted state.
	 *
	 * @return {boolean} Data is conflicted
	 */
	ListStorage.prototype.isConflicted = function () {
		if ( !this.storageMayConflict ) {
			return false;
		}
		// Read directly from store to avoid any caching used by sub-classes
		try {
			return this.store.getItem( conflictKey ) !== this.conflictId;
		} catch ( e ) {
			return false;
		}
	};

	/**
	 * Overwrite data in the store from our in-memory backup
	 *
	 * Only keys added in #addConflictableKeys are restored
	 */
	ListStorage.prototype.overwriteFromBackup = function () {
		// Call parent method directly when setting conflict key
		ListStorage.super.prototype.set.call( this, conflictKey, this.conflictId );

		for ( var key in this.conflictableKeys ) {
			var expiryKey, expiryAbsolute, expiry = null;
			if ( this.conflictableKeys[ key ] === 'list' ) {
				var listToRestore = ( this.conflictBackup[ key ] || [] ).slice();
				this.removeList( key );

				// The expiry value should be the same for all keys in the list
				expiryKey = EXPIRY_PREFIX + getLengthKey( key );
				expiryAbsolute = this.conflictBackup[ expiryKey ];
				if ( expiryAbsolute ) {
					expiry = expiryAbsolute - Math.floor( Date.now() / 1000 );
				}

				while ( listToRestore.length ) {
					this.appendToList( key, listToRestore.shift(), expiry );
				}
			} else {
				expiryKey = EXPIRY_PREFIX + key;
				expiryAbsolute = this.conflictBackup[ expiryKey ];
				if ( expiryAbsolute ) {
					expiry = expiryAbsolute - Math.floor( Date.now() / 1000 );
				}

				// Call parent methods directly when restoring
				if ( Object.prototype.hasOwnProperty.call( this.conflictBackup, key ) && this.conflictBackup[ key ] !== null ) {
					ListStorage.super.prototype.set.call( this, key, this.conflictBackup[ key ], expiry );
				} else {
					ListStorage.super.prototype.remove.call( this, key, this.conflictBackup[ key ] );
				}
			}
		}
	};

	/**
	 * Add keys which will need to be conflict-aware
	 *
	 * @param {Object} keys Object with conflict-aware keys as keys, and a
	 *  value of `true` for regular items, and 'list' for items we manage
	 *  as a append-only list, e.g. { 've-html': true, 've-changes': 'list' }
	 */
	ListStorage.prototype.addConflictableKeys = function ( keys ) {
		ve.extendObject( this.conflictableKeys, keys );

		this.storageMayConflict = true;

		if ( !this.conflictId ) {
			this.conflictId = Math.random().toString( 36 ).slice( 2 );
			// Call parent method directly when setting conflict key
			ListStorage.super.prototype.set.call( this, conflictKey, this.conflictId );
		}

		for ( var key in keys ) {
			if ( Object.prototype.hasOwnProperty.call( keys, key ) ) {
				if ( keys[ key ] === 'list' ) {
					this.conflictBackup[ key ] = this.getList( key );
				} else {
					this.conflictBackup[ key ] = this.get( key );
				}
			}
		}

	};

	/**
	 * Append a value to a list stored in storage
	 *
	 * @param {string} key Key of list to set value for
	 * @param {string} value Value to set
	 * @param {number} expiry Number of seconds after which this list can be deleted
	 * @return {boolean} The value was set
	 */
	ListStorage.prototype.appendToList = function ( key, value, expiry ) {
		var length = this.getListLength( key );

		if ( this.conflictableKeys[ key ] === 'list' ) {
			this.conflictBackup[ key ] = this.conflictBackup[ key ] || [];
			this.conflictBackup[ key ].push( value );
		}

		if ( this.set( getIndexKey( key, length ), value, expiry ) ) {
			// Update expiry on previous items
			for ( var i = 0; i < length; i++ ) {
				this.setExpires( getIndexKey( key, i ), expiry );
			}
			length++;
			return this.set( getLengthKey( key ), length.toString(), expiry );
		}
		return false;
	};

	/**
	 * Get the length of a list in storage
	 *
	 * @param {string} key Key of list
	 * @return {number} List length, 0 if the list doesn't exist
	 */
	ListStorage.prototype.getListLength = function ( key ) {
		return +this.get( getLengthKey( key ) ) || 0;
	};

	/**
	 * Get a list stored in storage
	 *
	 * Internally this will use items with the keys:
	 *  - key__length
	 *  - key__0 … key__N
	 *
	 * @param {string} key Key of list
	 * @return {string[]} List
	 */
	ListStorage.prototype.getList = function ( key ) {
		var list = [],
			length = this.getListLength( key );

		for ( var i = 0; i < length; i++ ) {
			list.push( this.get( getIndexKey( key, i ) ) );
		}
		return list;
	};

	/**
	 * Remove a list stored in storage
	 *
	 * @param {string} key Key of list
	 */
	ListStorage.prototype.removeList = function ( key ) {
		var length = this.getListLength( key );

		for ( var i = 0; i < length; i++ ) {
			this.remove( getIndexKey( key, i ) );
		}
		this.remove( getLengthKey( key ) );
		if ( this.storageMayConflict ) {
			delete this.conflictBackup[ key ];
		}
	};

	return new ListStorage( storage.store );
};
