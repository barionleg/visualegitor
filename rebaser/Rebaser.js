Rebaser = function () {
	this.changeForDoc = new Map();
};

/**
 */
Rebaser.prototype.applyChange = function ( doc, author, remote ) {
	var txs, local, resolved;

	if ( !this.changeForDoc.has( doc ) ) {
		this.changeForDoc.set( doc, new remote.constructor( 0, [], new remote.store.constructor() ) );
	}
	change = this.changeForDoc.get( doc );

	if ( remote.start > change.transactions.length ) {
		throw new Error( 'Remote start ' + remote.start + ' is beyond committed history' );
	}
	local = new remote.constructor( remote.start, transactions.slice( remote.start ) );
	resolved = remote.rebaseOnto( local );
	if ( resolved ) {
		Array.prototype.push.apply( transactions, resolved.transactions );
		console.log( JSON.stringify( transactions ) );
	}
	return { reverted: !resolved, parallel: local };
};

module.exports = Rebaser;
