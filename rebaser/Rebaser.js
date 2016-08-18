var ve = { dm: {} };
require( '../src/dm/ve.dm.Change' )( ve );

Collab = function () {
	this.transactionsForDoc = new Map();
};

Collab.prototype.applyChange = function ( doc, author, remote ) {
	var txs, local, resolved;

	if ( remote.clear ) {
		this.transactionsForDoc = new Map();
	}
	remote = new ve.dm.Change( remote.start, remote.transactions );

	if ( !this.transactionsForDoc.has( doc ) ) {
		this.transactionsForDoc.set( doc, [] );
	}
	transactions = this.transactionsForDoc.get( doc );

	if ( remote.start > transactions.length ) {
		throw new Error( 'Remote start ' + remote.start + ' is beyond committed history' );
	}
	local = new ve.dm.Change( remote.start, transactions.slice( remote.start ) );
	resolved = remote.rebaseOnto( local );
	if ( resolved ) {
		Array.prototype.push.apply( transactions, resolved.transactions );
		console.log( JSON.stringify( transactions ) );
	}
	return { reverted: !resolved, parallel: local };
};

module.exports = Collab;
