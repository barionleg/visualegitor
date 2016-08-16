/*!
 * VisualEditor IndexValueStore class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global SparkMD5 */

/**
 * Hash-keyed value store
 *
 * Values are objects, strings or Arrays, and are hashed using an algorithm with low collision
 * probability: values with the same hash can be assumed equal.
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
	// maps values to hashes
	this.hashStore = {};
};

/* Methods */

/**
 * Get the index of a value in the store.
 *
 * If the hash is not found the value is added to the store.
 *
 * @method
 * @param {Object|string|Array} value Value to lookup or store
 * @param {string} [hash] Value hash. Uses OO.getHash( value ) if not provided.
 * @param {boolean} [overwrite=false] Overwrite the value in the store if the hash is already in use
 * @return {number} The index of the value in the store
 */
ve.dm.IndexValueStore.prototype.index = function ( value, hash, overwrite ) {
	hash = this.indexOfValue( value, hash );
	if ( !this.hashStore[ hash ] || overwrite ) {
		if ( Array.isArray( value ) ) {
			this.hashStore[ hash ] = ve.copy( value );
		} else if ( typeof value === 'object' ) {
			this.hashStore[ hash ] = ve.cloneObject( value );
		} else {
			this.hashStore[ hash ] = value;
		}
	}

	return hash;
};

/**
 * Store a value, if not already stored
 *
 * @return {string} Hash value with low collision probability
 */
ve.dm.IndexValueStore.prototype.indexOfValue = function ( value, hash ) {
	if ( typeof hash !== 'string' ) {
		hash = OO.getHash( value );
	}

	// We don't need cryptographically strong hashes, just low collision probability. Given
	// effectively random hash distribution, for n values hashed into a space of m hash
	// strings, the probability of a collision is roughly n^2 / (2m). We use 16 hex digits
	// of MD5 i.e. 2^64 possible hash strings, so given 2^16 stored values the collision
	// probability is about 2^-33 =~ 0.0000000001 , i.e. negligible.
	//
	// Prefix with a letter to prevent all numeric hashes, and to constrain the space of
	// possible object property values.
	return 'h' + SparkMD5.hash( hash ).slice( 0, 16 );
};

/**
 * Get the indexes of values in the store
 *
 * Same as index but with arrays.
 *
 * @method
 * @param {Object[]} values Values to lookup or store
 * @return {Array} The indexes of the values in the store
 */
ve.dm.IndexValueStore.prototype.indexes = function ( values ) {
	var i, length, indexes = [];
	for ( i = 0, length = values.length; i < length; i++ ) {
		indexes.push( this.index( values[ i ] ) );
	}
	return indexes;
};

/**
 * Get the value at a particular index
 *
 * @method
 * @param {number} index Index to lookup
 * @return {Object|undefined} Value at this index, or undefined if out of bounds
 */
ve.dm.IndexValueStore.prototype.value = function ( index ) {
	return this.hashStore[ index ];
};

/**
 * Get the values at a set of indexes
 *
 * Same as value but with arrays.
 *
 * @method
 * @param {number[]} indexes Indices to lookup
 * @return {Array} Values at these indexes, or undefined if out of bounds
 */
ve.dm.IndexValueStore.prototype.values = function ( indexes ) {
	var i, length, values = [];
	for ( i = 0, length = indexes.length; i < length; i++ ) {
		values.push( this.value( indexes[ i ] ) );
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
	var key, clone = new this.constructor();
	for ( key in this.hashStore ) {
		clone.hashStore[ key ] = this.hashStore[ key ];
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
 * Objects added to the store are added by reference, not cloned like in .index()
 *
 * @param {ve.dm.IndexValueStore} other Store to merge into this one
 */
ve.dm.IndexValueStore.prototype.merge = function ( other ) {
	var key;

	for ( key in other.hashStore ) {
		if ( !Object.prototype.hasOwnProperty.call( this.hashStore, key ) ) {
			this.hashStore[ key ] = other.hashStore[ key ];
		}
	}
};
