/*global Map*/
/*global module*/
var Rebaser = function () {
	this.stateForDoc = new Map();
};

/**
 * Get the state of a document by name.
 *
 * @param {string} name Name of a document
 * @return {Object|null} Document state (history and selections)
 * @return {ve.dm.Change} return.change History as one big Change
 * @return {Object} return.selections Each author ID (key) mapped to latest ve.dm.Selection
 */
Rebaser.prototype.getStateForDoc = function ( name ) {
	if ( !this.stateForDoc.has( name ) ) {
		return null;
	}
	return this.stateForDoc.get( name );
};

/**
 * Attempt to apply a (possibly outdated) change to a document.
 *
 * @param {string} doc Document name
 * @param {string} remoteAuthor Remote author ID
 * @param {ve.dm.Change} remote Change to apply
 * @param {ve.dm.Selection} selection New remote selection
 * @return {Object|null} New state: Rebased change and updated selections, or null if conflict
 * @return {ve.dm.Change} return.change Rebased version of the applied change
 * @return {Object} return.selections Each author ID (key) mapped to rebased ve.dm.Selection
 */
Rebaser.prototype.applyChange = function ( doc, remoteAuthor, remote, selection ) {
	var state, change, selections, local, rebases, resolved, author, newState;

	if ( !this.stateForDoc.has( doc ) ) {
		this.stateForDoc.set( doc, {
			change: new remote.constructor(
				remote.transactionStart,
				[],
				remote.storeStart,
				new remote.store.constructor()
			),
			selections: {},
			continueBases: new Map()
		} );
	}
	state = this.stateForDoc.get( doc );
	change = state.change;
	selections = state.selections;

	if ( remote.start > change.transactions.length ) {
		throw new Error( 'Remote start ' + remote.start + ' is beyond committed history' );
	}
	local = change.mostRecent( remote.transactionStart, remote.storeStart );
	rebases = change.constructor.static.rebaseChanges( local, remote );
	resolved = rebases[ 1 ];
	if ( !resolved ) {
		return null;
	}
	change.store.merge( resolved.store );
	Array.prototype.push.apply( change.transactions, resolved.transactions );
	state.continueBases.set( author, rebases[ 0 ] );
	for ( author in selections ) {
		if ( author === remoteAuthor ) {
			continue;
		}
		selections[ author ] = selections[ author ].translateByChange( resolved, author );
	}
	selection = selections[ remoteAuthor ] = selection.translateByChange( local, remoteAuthor );
	newState = {
		change: resolved,
		selections: {}
	};
	newState.selections[ remoteAuthor ] = selection;
	return newState;
};

Rebaser.prototype.continueChange = function ( doc, author, change ) {
	var basePlusNew, rebases,
		state = this.stateForDoc.get( doc ),
		allChanges = state.change,
		base = state.continueBases.get( author );
	if ( !base ) {
		return null;
	}

	// The author has submitted a change (B) on top of a previous change (A).
	// The committed history is X, followed by A' (=A/X), followed by Y. We have to find B',
	// which is B rebased to follow Y.
	// Let cb = X\A, then B' = B/(-A+X+A/X+Y) = B/(X\A + Y) = B/(cb + Y).
	// We can now set cb := (cb + Y)\B and that will allow us to rebase a C based on B the same way.
	// TODO prove that last statement with some kind of induction proof

	// base is the other side of the most recent rebase we did for this author (cb)
	// basePlusNew is base plus any other changes that happened after this author's last change (cb + Y)
	basePlusNew = allChanges.mostRecent( base.transactionStart, base.storeStart );
	rebases = ve.dm.Change.static.rebaseChanges( basePlusNew, change );
	if ( !rebases[ 0 ] ) {
		// Clear this author's continue base, so that future continuations will fail until
		// a successful rebase happens
		state.continueBases.delete( author );
		return null;
	}
	state.continueBases.set( author, rebases[ 0 ] ); // (cb + Y)\B
	return rebases[ 1 ]; // B/(cb + Y))
};

module.exports = Rebaser;
