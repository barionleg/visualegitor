/*!
 * VisualEditor DataModel Rebaser class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel rebaser.
 *
 * @class
 *
 * @constructor
 * @param {ve.dm.Surface} surface Surface
 */
ve.dm.Rebaser = function VeDmRebaser( surface ) {
	// Properties
	this.surface = surface;
	this.doc = surface.documentModel;
};

/* Inheritance */

OO.initClass( ve.dm.Rebaser );

/* Methods */

/**
 * Attempt to apply remote change on top of local history
 *
 * If rebasing fails, discard the remote change, and return null. Else return the rebased
 * change.
 *
 * @param {ve.dm.Change} remote Incoming remote change
 * @return {ve.dm.Change|null} Resolved change for synchronization, or null if discarded
 */
ve.dm.Rebaser.prototype.applyUncommittedChange = function ( remote ) {
	var local, resolved;

	local = this.doc.getChangeSince( remote.start );
	resolved = remote.rebaseOnto( local );
	if ( resolved ) {
		resolved.applyTo( this.surface );
	}
	return resolved;
};

/**
 * Attempt to apply remote change underneath local history
 *
 * If rebasing fails, discard the local change. Else return the resulting resolved local
 * history as uncommitted.
 *
 * @param {ve.dm.Change} remote Incoming remote change
 * @param {Object} [original] Details of original change that this replaces
 * @return {ve.dm.Change} Unsynchronized resolved local history for sending
 */
ve.dm.Rebaser.prototype.applyCommittedChange = function ( remote, original ) {
	var local, replaced, unreplaced, backout, rebasedRemote;

	local = this.doc.getChangeSince( remote.start );

	if ( original && original.authorId === this.authorId ) {
		// The remote change replaces the bottom segment of localTransactions
		replaced = local.slice( 0, original.length );
		unreplaced = local.slice( original.length );
		if ( original.reverted ) {
			// Try to backout just the replaced changes
			backout = replaced.reversed().rebaseOnto( unreplaced );
			if ( backout ) {
				backout.applyTo( this.surface );
				unreplaced = unreplaced.rebaseUnder( replaced );
			} else {
				// Rebase failed: backout all local changes
				local.reversed().applyTo( this.surface );
				unreplaced = new ve.dm.Change( remote.start, [] );
			}
			// Rewrite history
			this.doc.completeHistory.length = remote.start;
			unreplaced.addToHistory( this.doc.completeHistory );
			rebasedRemote = remote.rebaseOnto( unreplaced );
		} else {
			// The modified replace is the top of remote.transactions
			unreplaced = unreplaced.rebaseUnder( replaced );
			rebasedRemote = remote.slice( 0, original.offset ).rebaseOnto( local );
		}
	} else {
		rebasedRemote = remote.rebaseOnto( local );
		unreplaced = local;
	}

	if ( !rebasedRemote ) {
		// Revert local history in favour of remote
		local.reversed().applyTo( this.surface );
		this.doc.completeHistory.length = remote.start;
		remote.applyTo( this.surface );
		return new ve.dm.Change( this.doc.completeHistory.length, [] );
	}

	rebasedRemote.applyTo( this.surface );

	// Now rewrite history to agree with remote
	this.doc.completeHistory.length = remote.start;
	remote.addToHistory( this.doc.completeHistory );
	unreplaced = unreplaced.rebaseOnto( remote );
	unreplaced.addToHistory( this.doc.completeHistory );
	return unreplaced;
};
