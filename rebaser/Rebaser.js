/*global Map*/
/*global module*/
var Rebaser = function () {
	this.changeForDoc = new Map();
};

/**
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
	return local;
};

module.exports = Rebaser;
