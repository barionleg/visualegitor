( function ( createClass ) {
	if ( typeof window !== 'undefined' ) {
		// Browser
		createClass( window.ve );
	} else {
		// Node. ve={dm:{}}; require( 'thisFile' )( ve );
		module.exports = createClass;
	}
} ( function ( ve ) {

/*!
 * VisualEditor IndexValueStore class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global SparkMD5 */

/**
 * Ordered append-only hash store, whose values once inserted are immutable
 *
 * Values are objects, strings or Arrays, and are hashed using an algorithm with low collision
 * probability: values with the same hash can be assumed equal.
 *
 * Values are stored in insertion order, and the store can be sliced to get a subset of values
 * inserted consecutively.
 *
 * Two stores can be merged even if they have differently computed hashes, so long as two values
 * will (with high probability) have the same hash only if equal. In this case, equivalent
 * values can have two different hashes.
 *
 * TODO: rename the class to reflect that it is no longer an index-value store
 *
 * @class
 * @constructor
 */
ve.dm.IndexValueStore = function VeDmIndexValueStore() {
	// Maps hashes to values
	this.hashStore = {};
	// Hashes in order of insertion (used for slicing)
	this.hashes = [];
};

/* Methods */

/**
 * Get the number of values in the store
 *
 * @return {number} Number of values in the store
 */
ve.dm.IndexValueStore.prototype.getLength = function () {
	return this.hashes.length;
};

/**
 * Return a new store containing a slice of the values in insertion order
 *
 * @param {number} [start] Include values from position start onwards (default: 0)
 * @param {number} [end] Include values to position end exclusive (default: slice to end)
 * @return {ve.dm.IndexValueStore} Slice of the current store (with non-cloned value references)
 */
ve.dm.IndexValueStore.prototype.slice = function ( start, end ) {
	var i, len, hash,
		sliced = new this.constructor();

	sliced.hashes = this.hashes.slice( start, end );
	for ( i = 0, len = sliced.hashes.length; i < len; i++ ) {
		hash = sliced.hashes[ i ];
		sliced.hashStore[ hash ] = this.hashStore[ hash ];
	}
	return sliced;
};

/**
 * Insert a value into the store
 *
 * @method
 * @param {Object|string|Array} value Value to store
 * @param {string} [stringified] Stringified version of value; default OO.getHash( value )
 * @return {string} Hash value with low collision probability
 */
ve.dm.IndexValueStore.prototype.index = function ( value, stringified ) {
	var hash = this.indexOfValue( value, stringified );

	if ( !this.hashStore[ hash ] ) {
		if ( Array.isArray( value ) ) {
			this.hashStore[ hash ] = ve.copy( value );
		} else if ( typeof value === 'object' ) {
			this.hashStore[ hash ] = ve.cloneObject( value );
		} else {
			this.hashStore[ hash ] = value;
		}
		this.hashes.push( hash );
	}

	return hash;
};

/**
 * Get the hash of a value without inserting it in the store
 *
 * @method
 * @param {Object|string|Array} value Value to hash
 * @param {string} [stringified] Stringified version of value; default OO.getHash( value )
 * @return {string} Hash value with low collision probability
 */
ve.dm.IndexValueStore.prototype.indexOfValue = function ( value, stringified ) {
	if ( typeof stringified !== 'string' ) {
		stringified = OO.getHash( value );
	}

	// We don't need cryptographically strong hashes, just low collision probability. Given
	// effectively random hash distribution, for n values hashed into a space of m hash
	// strings, the probability of a collision is roughly n^2 / (2m). We use 16 hex digits
	// of MD5 i.e. 2^64 possible hash strings, so given 2^16 stored values the collision
	// probability is about 2^-33 =~ 0.0000000001 , i.e. negligible.
	//
	// Prefix with a letter to prevent all numeric hashes, and to constrain the space of
	// possible object property values.
	return 'h' + SparkMD5.hash( stringified ).slice( 0, 16 );
};

/**
 * Get the hashes of values in the store
 *
 * Same as index but with arrays.
 *
 * @method
 * @param {Object[]} values Values to lookup or store
 * @return {string[]} The hashes of the values in the store
 */
ve.dm.IndexValueStore.prototype.indexes = function ( values ) {
	var i, length, hashes = [];
	for ( i = 0, length = values.length; i < length; i++ ) {
		hashes.push( this.index( values[ i ] ) );
	}
	return hashes;
};

/**
 * Get the value stored for a particular hash
 *
 * @method
 * @param {string} hash Hash to look up
 * @return {Object|undefined} Value stored for this hash if present, else undefined
 */
ve.dm.IndexValueStore.prototype.value = function ( hash ) {
	return this.hashStore[ hash ];
};

/**
 * Get the values stored for a list of hashes
 *
 * Same as value but with arrays.
 *
 * @method
 * @param {string[]} hashes Hashes to lookup
 * @return {Array} Values for these hashes (undefined for any not present)
 */
ve.dm.IndexValueStore.prototype.values = function ( hashes ) {
	var i, length, values = [];
	for ( i = 0, length = hashes.length; i < length; i++ ) {
		values.push( this.value( hashes[ i ] ) );
	}
	return values;
};

/**
 * Clone a store.
 *
 * The returned clone is shallow: the valueStore array and the hashStore array are cloned, but
 * the values inside them are copied by reference. These values are supposed to be immutable,
 * though.
 *
 * @return {ve.dm.IndexValueStore} New store with the same contents as this one
 */
ve.dm.IndexValueStore.prototype.clone = function () {
	var hash,
		clone = new this.constructor();

	clone.hashes = this.hashes.slice();
	for ( hash in this.hashStore ) {
		clone.hashStore[ hash ] = this.hashStore[ hash ];
	}
	return clone;
};

/**
 * Merge another store into this store.
 *
 * It is allowed for the two stores to have differently computed hashes, so long as two values
 * will (with high probability) have the same hash only if equal. In this case, equivalent
 * values can have two different hashes.
 *
 * Values are added in the order they appear in the other store. Objects added to the store are
 * added by reference, not cloned, unlike in .index()
 *
 * @param {ve.dm.IndexValueStore} other Store to merge into this one
 */
ve.dm.IndexValueStore.prototype.merge = function ( other ) {
	var i, len, hash;

	for ( i = 0, len = other.hashes.length; i < len; i++ ) {
		hash = other.hashes[ i ];
		if ( !Object.prototype.hasOwnProperty.call( this.hashStore, hash ) ) {
			this.hashStore[ hash ] = other.hashStore[ hash ];
			this.hashes.push( hash );
		}
	}
};

/**
 * Clone this store excluding certain values, like a set difference operation
 *
 * @param {ve.dm.IndexValueStore|Object} omit Store of values to omit, or object whose keys are hashes to emit
 * @return {ve.dm.IndexValueStore} All values in this that do not appear in other
 */
ve.dm.IndexValueStore.prototype.difference = function ( omit ) {
	var i, len, hash,
		store = new this.constructor();

	if ( omit instanceof ve.dm.IndexValueStore ) {
		omit = omit.hashStore;
	}
	for ( i = 0, len = this.hashes.length; i < len; i++ ) {
		hash = this.hashes[ i ];
		if ( !Object.prototype.hasOwnProperty.call( omit, hash ) ) {
			store.hashes.push( hash );
			store.hashStore[ hash ] = this.hashStore[ hash ];
		}
	}
	return store;
};

/**
 * @param {ve.dm.Transaction[]} transactions List of transactions
 * @return {string[]} The stored hashes that occur in the transactions, in the order they occur
 */
ve.dm.IndexValueStore.prototype.filter = function ( transactions ) {
	var t, tLen, operations, o, oLen, op, hash, e, eLen, annotations, a, aLen,
		store = new ve.dm.IndexValueStore();

	for ( t = 0, tLen = transactions.length; t < tLen; t++ ) {
		operations = transactions[ t ].operations;
		for ( o = 0, oLen = operations.length; o < oLen; o++ ) {
			op = operations[ o ];
			if ( op.type === 'annotate' && op.bias === 'start' ) {
				hash = op.index;
				if ( !Object.prototype.hasOwnProperty.call( store.hashSet, hash ) ) {
					store.hashSet[ hash ] = this.hashSet[ hash ];
					store.hashes.push( hash );
				}
			}
			if ( op.type !== 'replace' ) {
				continue;
			}
			for ( e = 0, eLen = op.insert.length; e < eLen; e++ ) {
				annotations = op.insert[ e ][ 1 ];
				if ( !annotations ) {
					continue;
				}
				for ( a = 0, aLen = annotations.length; a < aLen; a++ ) {
					hash = annotations[ a ];
					if ( !Object.prototype.hasOwnProperty.call( store.hashSet, hash ) ) {
						store.hashSet[ hash ] = this.hashSet[ hash ];
						store.hashes.push( hash );
					}
				}
			}
		}
	}
	return store;
};

} ) );
