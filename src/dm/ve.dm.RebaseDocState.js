/*!
 * VisualEditor DataModel rebase document state class.
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
 * @param {ve.dm.Change} history Canonical history (can start above zero for partial info)
 * @param {Map.<number,ve.dm.RebaseDocAuthorState>} authors Information about each author
 */
ve.dm.RebaseDocState = function VeDmRebaseDocState( history, authors ) {
	this.history = history;
	this.authors = authors;
};

/* Inheritance */

OO.initClass( ve.dm.RebaseDocState );

/* Static methods */

/**
 * Get new empty doc state
 *
 * @return {ve.dm.RebaseDocState} New empty doc state
 */
ve.dm.RebaseDocState.static.newDoc = function () {
	return new ve.dm.RebaseDocState( new ve.dm.Change( 0, [], [], {} ), new Map() );
};

ve.dm.RebaseDocState.static.deserialize = function ( data, preserveStoreValues ) {
	var author,
		history = ve.dm.Change.static.deserialize( data.history, undefined, preserveStoreValues ),
		authors = new Map();
	for ( author in data.authors ) {
		authors.set(
			parseInt( author, 10 ),
			ve.dm.RebaseDocAuthorState.static.deserialize( data.authors[ author ], undefined, preserveStoreValues )
		);
	}
	return new ve.dm.RebaseDocState( history, authors );
};

/* Methods */

ve.dm.RebaseDocState.prototype.serialize = function () {
	var history = this.history.serialize(),
		authors = {};
	this.authors.entries.forEach( function ( state, author ) {
		authors[ author ] = state.serialize();
	} );
	return { history: history, authors: authors };
};

ve.dm.RebaseDocState.prototype.getActiveNames = function () {
	var result = {};
	this.authors.forEach( function ( authorState, authorId ) {
		if ( authorState.active ) {
			result[ authorId ] = authorState.displayName;
		}
	} );
	return result;
};
