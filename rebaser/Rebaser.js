Rebaser = function () {
	this.transactionsForDoc = new Map();
};

Rebaser.prototype.applyChange = function ( doc, author, remote ) {
	var txs, local, resolved;

	if ( remote.clear ) {
		this.transactionsForDoc = new Map();
	}

	if ( !this.transactionsForDoc.has( doc ) ) {
		this.transactionsForDoc.set( doc, [] );
	}
	transactions = this.transactionsForDoc.get( doc );

	if ( remote.start > transactions.length ) {
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
