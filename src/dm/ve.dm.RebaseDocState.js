/*!
 * VisualEditor DataModel rebase document state class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* eslint-env node, es6 */

/**
 * DataModel rebase document state
 *
 * @class
 *
 * @constructor
 * @param {ve.dm.Change} history History as one big change
 * @param {Map.<number,ve.dm.Change>} continueBases Per-author transposed history for rebasing
 * @param {Map.<number,number>} rejections Per-author count of unacknowledged rejections
 */
ve.dm.RebaseDocState = function VeDmRebaseDocState( history, continueBases, rejections ) {
	/**
	 * @property {ve.dm.Change} history History as one big change
	 */
	this.history = history || new ve.dm.Change( 0, [], [], {} );

	/**
	 * @property {Map.<number,ve.dm.Change>} continueBases Per-author transposed history for rebasing
	 */
	this.continueBases = continueBases || new Map();

	/**
	 * @property {Map.<number,number>} Per-author count of unacknowledged rejections
	 */
	this.rejections = rejections || new Map();
};

/* Inheritance */

OO.initClass( ve.dm.RebaseDocState );

ve.dm.RebaseDocState.static.deserialize = function ( data ) {
	var history, continueBases, author, rejections;
	history = ve.dm.Change.static.deserialize( data.history );
	continueBases = new Map();
	for ( author in data.continueBases ) {
		continueBases.set( author, ve.dm.Change.static.deserialize( data.continueBases[ author ] ) );
	}
	rejections = new Map();
	for ( author in data.rejections ) {
		rejections.set( author, data.rejections[ author ] );
	}
	return new ve.dm.RebaseDocState( history, continueBases, rejections );
};
