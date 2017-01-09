/*!
 * VisualEditor DataModel rebase server class.
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */
/* eslint-env node, es6 */

/**
 * DataModel rebase server
 *
 * @class
 */
ve.dm.RebaseServer = function VeDmRebaseServer() {
	this.stateForDoc = new Map();
};

OO.initClass( ve.dm.RebaseServer );

/* Methods */

/**
 * Get the state of a document by name.
 *
 * @param {string} doc Name of a document
 * @return {Promise<ve.dm.RebaseDocState>} Document state
 */
ve.dm.RebaseServer.prototype.getDocState = function ( doc ) {
	if ( !this.stateForDoc.has( doc ) ) {
		this.stateForDoc.set( doc, new ve.dm.RebaseDocState() );
	}
	return Promise.resolve( this.stateForDoc.get( doc ) );
};

/**
 * Update document history
 *
 * @param {string} doc Name of a document
 * @param {number} author Author ID
 * @param {ve.dm.Change|null} newHistory New history to append
 * @param {number} rejections Unacknowledged rejections for author
 * @param {ve.dm.Change|null} continueBase Continue base for author
 * @return {Promise<undefined>}
 */
ve.dm.RebaseServer.prototype.updateDocState = ve.async( function* updateDocState( doc, author, newHistory, rejections, continueBase ) {
	var state = yield this.getDocState( doc );
	if ( newHistory ) {
		state.history.push( newHistory );
	}
	state.rejections.set( author, rejections );
	if ( continueBase ) {
		state.continueBases.set( author, continueBase );
	}
	return Promise.resolve();
} );

/**
 * Attempt to rebase and apply a change to a document.
 *
 * The change can be a new change, or a continued change. A continuated change means one that
 * follows on immediately from the author's last submitted change, other than possibly being
 * rebased onto some more recent committed history.
 *
 * @param {string} doc Document name
 * @param {number} author Author ID
 * @param {number} backtrack How many transactions are backtracked from the previous submission
 * @param {ve.dm.Change} change Change to apply
 * @return {Promise<ve.dm.Change>} Accepted change (or initial segment thereof), as rebased
 */
ve.dm.RebaseServer.prototype.applyChange = ve.async( function* applyChange( doc, author, backtrack, change ) {
	var base, rejections, result,
		state = yield this.getDocState( doc );

	base = state.continueBases.get( author ) || change.truncate( 0 );
	rejections = state.rejections.get( author ) || 0;
	if ( rejections > backtrack ) {
		// Follow-on does not fully acknowledge outstanding conflicts: reject entirely
		rejections = rejections - backtrack + change.transactions.length;
		yield this.updateDocState( doc, author, null, rejections, null );
		return change.truncate( 0 );
	}
	if ( rejections < backtrack ) {
		throw new Error( 'Backtrack=' + backtrack + ' > ' + rejections + '=rejections' );
	}

	if ( change.start > base.start ) {
		// Remote has rebased some committed changes into its history since base was built.
		// They are guaranteed to be equivalent to the start of base. See mathematical
		// docs for proof (Cuius rei demonstrationem mirabilem sane deteximus hanc marginis
		// exiguitas non caperet).
		base = base.mostRecent( change.start );
	}
	base = base.concat( state.history.mostRecent( base.start + base.getLength() ) );

	result = ve.dm.Change.static.rebaseUncommittedChange( base, change );
	rejections = result.rejected ? result.rejected.getLength() : 0;
	yield this.updateDocState( doc, author, result.rebased, rejections, result.transposedHistory );
	return result.rebased;
} );
