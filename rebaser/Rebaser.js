/*global Map*/
/*global module*/
var Rebaser = function () {
	this.changeForDoc = new Map();
};

/**
 * Get the history of a document by name.
 *
 * @param {string} name Name of a document
 * @return {ve.dm.Change|null} History (as one big Change object), or null if no such document
 */
Rebaser.prototype.getDoc = function ( name ) {
	if ( !this.changeForDoc.has( name ) ) {
		return null;
	}
	return this.changeForDoc.get( name );
};

/**
 * Attempt to apply a (possibly outdated) change to a document.
 *
 * @param {string} doc Document name
 * @param {string} author Author ID
 * @param {ve.dm.Change} remote Change to apply
 * @return {ve.dm.Change|null} Rebased version of the applied change, or null if conflict
 */
Rebaser.prototype.applyChange = function ( doc, author, remote ) {
	var change, local, resolved;

	if ( !this.changeForDoc.has( doc ) ) {
		this.changeForDoc.set( doc, new remote.constructor(
			remote.transactionStart,
			[],
			remote.storeStart,
			new remote.store.constructor()
		) );
	}
	change = this.changeForDoc.get( doc );

	if ( remote.start > change.transactions.length ) {
		throw new Error( 'Remote start ' + remote.start + ' is beyond committed history' );
	}
	local = change.mostRecent( remote.transactionStart, remote.storeStart );
	resolved = change.constructor.static.rebaseChanges( local, remote )[ 1 ];
	if ( resolved ) {
		change.store.merge( resolved.store );
		Array.prototype.push.apply( change.transactions, resolved.transactions );
	}
	return resolved;
};

module.exports = Rebaser;
