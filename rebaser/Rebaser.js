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
	var state, change, selections, local, resolved, author, newState;

	if ( !this.stateForDoc.has( doc ) ) {
		this.stateForDoc.set( doc, {
			change: new remote.constructor(
				remote.transactionStart,
				[],
				remote.storeStart,
				new remote.store.constructor()
			),
			selections: {}
		} );
	}
	state = this.stateForDoc.get( doc );
	change = state.change;
	selections = state.selections;

	if ( remote.start > change.transactions.length ) {
		throw new Error( 'Remote start ' + remote.start + ' is beyond committed history' );
	}
	local = change.mostRecent( remote.transactionStart, remote.storeStart );
	resolved = change.constructor.static.rebaseChanges( local, remote )[ 1 ];
	if ( !resolved ) {
		return null;
	}
	change.store.merge( resolved.store );
	Array.prototype.push.apply( change.transactions, resolved.transactions );
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

module.exports = Rebaser;
