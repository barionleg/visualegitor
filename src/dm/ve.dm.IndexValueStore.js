/*!
 * VisualEditor IndexValueStore class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global SparkMD5 */

/**
 * Index-value store
 *
 * @class
 * @constructor
 */
ve.dm.IndexValueStore = function VeDmIndexValueStore() {
	// maps hashes to indexes
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

ve.dm.IndexValueStore.prototype.indexOfValue = function ( value, hash ) {
	if ( typeof hash !== 'string' ) {
		hash = OO.getHash( value );
	}
	// Prefix with a letter to prevent all numeric hashes which seem dangerous.
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
 * Objects that are in other but not in this are added to this, possibly with a different index.
 * Objects present in both stores may have different indexes in each store. An object is returned
 * mapping each index in other to the corresponding index in this.
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
