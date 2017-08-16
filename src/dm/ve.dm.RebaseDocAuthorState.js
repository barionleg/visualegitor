/*!
 * VisualEditor DataModel rebase document author state class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-env node, es6 */

/**
 * DataModel rebase document state
 *
 * @class
 *
 * @constructor
 * @param {Object} data
 * @param {string} data.displayName Display name
 * @param {number} data.rejections Number of unacknowledged rejections
 * @param {ve.dm.Change|null} data.continueBase Continue base
 * @param {string} data.token Secret token for usurping sessions
 * @param {boolean} data.active Whether the author is active
 */
ve.dm.RebaseDocAuthorState = function VeDmRebaseDocAuthorState( data ) {
	this.displayName = data.displayName;
	this.rejections = data.rejections;
	this.continueBase = data.continueBase;
	this.token = data.token;
	this.active = data.active;
};

/* Inheritance */

OO.initClass( ve.dm.RebaseDocAuthorState );

/* Static methods */

/**
 * Get new empty author state
 *
 * @return {ve.dm.RebaseDocAuthorState} New empty author data object
 */
ve.dm.RebaseDocAuthorState.static.newAuthor = function () {
	return this.deserialize( {
		displayName: '',
		rejections: 0,
		continueBase: null,
		// TODO use cryptographic randomness here and convert to hex
		token: Math.random().toString(),
		active: true
	} );
};

/**
 * Deserialize the author state
 *
 * @param {Object} data Author state data to deserialize
 * @param {boolean} [preserveStoreValues] Keep store values verbatim instead of deserializing
 * @return {ve.dm.RebaseDocAuthorState} Deserialized author state
 */
ve.dm.RebaseDocAuthorState.static.deserialize = function ( data, preserveStoreValues ) {
	return new ve.dm.RebaseDocAuthorState( {
		displayName: data.displayName,
		rejections: data.rejections,
		continueBase: data.continueBase && ve.dm.Change.static.deserialize(
			data.continueBase,
			undefined,
			preserveStoreValues
		),
		token: data.token,
		active: data.active
	} );
};

/* Methods */

/**
 * Serialize the author state
 *
 * @param {boolean} [preserveStoreValues] Keep store values verbatim instead of deserializing
 * @return {Object} Serialized author state
 */
ve.dm.RebaseDocAuthorState.prototype.serialize = function ( preserveStoreValues ) {
	return {
		displayName: this.displayName,
		rejections: this.rejections,
		continueBase: this.continueBase.serialize( preserveStoreValues ),
		token: this.token,
		active: this.active
	};
};
