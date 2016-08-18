( function ( createClass ) {
	if ( typeof window !== 'undefined' ) {
		// Browser.
		createClass( window.ve );
	} else {
		// Node. ve={dm:{}}; require( 'thisFile' )( ve );
		module.exports = createClass;
	}
} ( function ( ve ) {

/*!
 * VisualEditor DataModel Change class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel change.
 *
 * A change is a list of transactions to be applied sequentially on top of a certain history
 * state. It can be thought of more abstractly as a function f: D1 -> D2 a document in a
 * specific start state D1, modifying parts of the document to produce a specific end state D2.
 *
 * For two changes f: D1 -> D2 and g: D2 -> D3 we define f.concat(g): D1 -> D3 as the change
 * obtained by applying f then g. By associativity of functions,
 * a.concat(b.concat(c)) = a.concat(b).concat(c) for any consecutive changes a, b, c. Writing
 *
 * x * y := x.concat(y) ,
 *
 * we have a * (b * c) = (a * b) * c, so we can just write either as a * b * c.
 *
 * For a change f: D1 -> D2 we define f.reversed() as the change D2 -> D1 such that
 * f.concat(f.reversed()) is the identity change D1 -> D1. Writing
 *
 * inv(x) := x.reversed() ,
 *
 * we have f * inv(f) = the identity change on D1 .
 *
 * Given two changes f: D1 -> D2 and g: D1 -> D3 , We would like to define f.rebaseOnto(g)
 * ("f rebased onto g") as a change that maps D3 onto some D4: conceptually, it is f
 * modified so it can be applied after g. This is a useful concept because it allows changes
 * written in parallel to be sequenced into a linear order. However, for some changes there
 * is no reasonable way to do this; e.g. when f and g both change the same word to something
 * different. In this case we make f.rebaseOnto(g) return null and we say it conflicts.
 *
 * Given f: D1 -> D2 , g: D1 -> D3, and x: D1 -> D4, we give three guarantees about rebasing:
 *
 * 1. g.rebaseOnto(f) conflicts if and only if f.rebaseOnto(g) conflicts.
 * 2. If there is no conflict, f.concat(g.rebaseOnto(f)) equals g.concat(g.rebaseOnto(f)).
 * 3. If there is no conflict, x.rebaseOnto(f).rebaseOnto(g) equals x.rebaseOnto(f + g).
 *
 * We can consider a conflicting transaction starting at some document D to be 0: D->null,
 * and regard any two conflicting transactions starting at D to be equal, and just write 0
 * where D1 is clear from context. Then, writing
 *
 * x|y := x.rebasedOnto(y),
 *
 * we can write our guarantees. Given f: D1 -> D2 , g: D1 -> D3, and x: D1 -> D4:
 *
 * 1. Change conflict well definedness: g|f = 0 if and only if f|g = 0.
 * 2. Change commutativity: f * g|f equals g * f|g .
 * 3. Rebasing piecewise: if (x|f)|g != 0, then (x|f)|g equals x|(f * g) .
 *
 * These guarantees let us reorder non-conflicting changes without affecting the resulting
 * document. They also let us move in the inverse direction ("rebase under"), from sequential
 * changes to parallel ones, for if f: D1 -> D2 and g: D2 -> D3, then g|inv(f)
 * maps from D1 to some D4, and conceptually it is g modified to apply without f having been
 * applied.
 *
 * Note that rebasing piecewise is *not* equivalent for changes that conflict: if you conflict
 * with f you might not conflict with f*g. For example, if x|f = 0 then
 *
 * (x|f)|inv(f) = 0 but x|(f * inv(f)) = x.
 *
 * @class
 * @constructor
 * @param {number} transactionStart Length of the history stack at change start
 * @param {ve.dm.Transaction[]} transactions Transactions to apply
 * @param {number} storeStart Length of the store at change start
 * @param {ve.dm.IndexValueStore} store New store values appearing in this change
 */
ve.dm.Change = function VeDmChange( transactionStart, transactions, storeStart, store ) {
	this.transactionStart = transactionStart;
	this.transactions = transactions;
	this.storeStart = storeStart;
	this.store = store;
};

/* Static methods */

ve.dm.Change.static = {};

ve.dm.Change.static.deserialize = function ( data ) {
	var store = new ve.dm.IndexValueStore();
	store.hashes = data.store.hashes;
	store.hashStore = data.store.hashStore;
	return new ve.dm.Change(
		data.transactionStart,
		data.transactions.map( function ( operations ) {
			return new ve.dm.Transaction( null, operations );
		} ),
		data.storeStart,
		store
	);
};

/**
 * TODO: now unused?
 * @param {ve.dm.Transaction[]} transactions List of transactions
 * @return {string[]} The hashes that occur in the transactions
 */
ve.dm.Change.static.getHashes = function ( transactions ) {
	var t, tLen, operations, o, oLen, op, e, eLen, annotations, a, aLen,
		hashSet = {};

	for ( t = 0, tLen = transactions.length; t < tLen; t++ ) {
		operations = transactions[ t ].operations;
		for ( o = 0, oLen = operations.length; o < oLen; o++ ) {
			op = operations[ o ];
			if ( op.type === 'annotate' && op.bias === 'start' ) {
				hashSet[ op.index ] = true;
			}
			if ( op.type !== 'replace' ) {
				continue;
			}
			for ( e = 0, eLen = op.insert.length; e < eLen; e++ ) {
				annotations = op.insert[ e ][ 1 ];
				if ( !annotations ) {
					continue;
				}
				for ( a = 0, aLen = annotations.length; a < aLen; a++ ) {
					hashSet[ annotations[ a ] ] = true;
				}
			}
		}
	}
	return Object.keys( hashSet );
};

/**
 * Rebase two parallel changes on top of each other
 *
 * Since a change is a stack of transactions, we define change rebasing in terms of transaction
 * rebasing. We require transaction rebasing to meet the three guarantees described above for
 * change rebasing. To be precise, given any transactions a:D1->D2, b:D2->D3 and x:D1->D4, we
 * require that:
 *
 * 1. Transaction conflict well definedness: a|x = 0 if and only if x|a = 0.
 * 2. Transaction commutativity: a * x|a equals x * a|x .
 * 3. Rebasing piecewise: if (x|a)|b != 0, then (x|a)|b equals x|(a * b) .
 *
 * Given two lists of consecutive changes a1,a2,...,aN and b1,b2,...,bM, our approach is to
 * rebase the whole list a1,...,aN over b1, and at the same time rebase b1 onto a1*...*aN.
 * Then we repeat the process for b2, and so on. To rebase a1,...,aN over b1, the
 * the following approach would work:
 *
 * a1' := a1|b1
 * a2' := a2|(inv(a1) * b1 * a1')
 * a3' := a3|(inv(a2) * inv(a1) * b1 * a1' * a2')
 * ...
 *
 * That is, rebase a_i under a_i-1,...,a_1, then over b1,...,bM, then over a'1,...,a_i-1' .
 *
 * However, because of the way transactions are written, it's not actually easy to implement
 * transaction concatenation, so we would want to calculate a2' as piecewise rebases
 *
 * a2' = ((a2|inv(a1))|b1)|a1'
 *
 * which is unsatisfactory because a2|inv(a1) may well conflict even if a2|(inv(a1) * b1 * a1')
 * as a whole would not conflict (e.g. if b1 modifies only parts of the document distant from a1
 * and a2).
 *
 * So observe that by transaction commutivity we can rewrite a2' as:
 *
 * a2' := a2|(inv(a1) * a1 * b1|a1)
 * 	= a2|(b1|a1)
 *
 * and that b1|a1 conflicts only if a1|b1 conflicts (so this introduces no new conflicts). In
 * general we can write:
 *
 * a1' := a1|b1
 * b1' := b1|a1
 * a2' := a2|b1'
 * b1'' := b1'|a2
 * a3' := a3|b1''
 * b1''' := a1''|a3
 *
 * Continuing in this way, we obtain a1',...,aN' rebased over b1, and b1''''''' (N primes)
 * rebased onto a1 * ... * aN . Iteratively we can take the same approach to rebase over
 * b2,...,bM, giving both rebased lists as required.
 *
 * If any of the transaction rebases conflict, then we immediately return a conflict for the
 * whole change rebase.
 *
 * @param {ve.dm.Change} changeA A change
 * @param {ve.dm.Change} changeB Another change
 * @return {ve.dm.Change[]} [ changeAOnChangeB, changeBOnChangeA ], or [ null, null ] if conflict
 * @throws {Error} If changeA and changeB have different starts
 */
ve.dm.Change.static.rebaseChanges = function ( changeA, changeB ) {
	var i, iLen, b, j, jLen, a,
		transactionsA = changeA.transactions.slice(),
		transactionsB = changeB.transactions.slice();

	if ( changeA.transactionStart !== changeB.transactionStart ) {
		throw new Error( 'Different transactionStarts: ' + changeA.transactionStart + ' and ' + changeB.transactionStart );
	}
	if ( changeA.storeStart !== changeB.storeStart ) {
		throw new Error( 'Different storeStarts: ' + changeA.storeStart + ' and ' + changeB.storeStart );
	}

	// For each element b of transactionsB, rebase the whole list transactionsA over b.
	// To rebase changeA transactions a1, a2, a3, ..., aN over b, first we rebase a1 onto
	// b. Then we rebase a2 onto some b', defined as
	//
	// b' := b|a1 , that is b.rebasedOnto(a1)
	//
	// (which as proven above is equivalent to bb := inv(a1) * b1 * a1)
	//
	// Similarly we rebase a3 onto b'' := b'|a2, and so on.
	//
	// The rebased a_i are used for the rebased changeA: they will all get rebased over the
	// rest of transactionsB in the same way.
	// The fully rebased b forms the start of the rebased transactionsB.
	//
	// These identities hold if all the rebases work; if any of them fail, the entire
	// rebase fails and we return null values.
	for ( i = 0, iLen = transactionsB.length; i < iLen; i++ ) {
		b = transactionsB[ i ];
		// Rebase transactions list onto otherTx
		for ( j = 0, jLen = transactionsA.length; j < jLen; j++ ) {
			a = transactionsA[ j ];
			transactionsA[ j ] = ve.dm.Transaction.prototype.rebaseOnto.call( a, b );
			if ( transactionsA[ j ] === null ) {
				return [ null, null ];
			}
			b = ve.dm.Transaction.prototype.rebaseOnto.call( b, a );
			if ( b === null ) {
				return [ null, null ];
			}
		}
		transactionsB[ i ] = b;
	}

	return [
		// These length calculations assume no removal of empty rebased transactions
		new ve.dm.Change(
			changeA.transactionStart + changeB.transactions.length,
			transactionsA,
			changeB.storeStart + changeB.store.getLength(),
			changeA.store.difference( changeB.store )
		),
		new ve.dm.Change(
			changeB.transactionStart + changeA.transactions.length,
			transactionsB,
			changeA.storeStart + changeA.store.getLength(),
			changeB.store.difference( changeA.store )
		)
	];
};

/* Methods */

/**
 * Get the change that backs out this change.
 *
 * Note that applying it will not revert start and store.
 *
 * @return {ve.dm.Change} The change that backs out this change
 */
ve.dm.Change.prototype.reversed = function () {
	return new ve.dm.Change(
		this.transactionStart + this.transactions.length,
		this.transactions.map( function ( tx ) {
			return ve.dm.Transaction.prototype.reversed.call( tx );
		} ).reverse(),
		// Reverting cannot possibly add any new annotations
		this.storeStart + this.store.getLength(),
		new ve.dm.IndexValueStore()
	);
};

/**
 * Rebase this change onto other (ready to apply on top of other)
 *
 * @param {ve.dm.Change} other Other change
 * @return {ve.dm.Change|null} Rebased change applicable on top of other, or null if rebasing fails
 * @throws {Error} If this change and other have different starts
 */
ve.dm.Change.prototype.rebaseOnto = function ( other ) {
	return this.constructor.static.rebaseChanges( this, other )[ 0 ];
};

/**
 * Rebase this change below other (ready to replace other)
 *
 * @param {ve.dm.Change} other Other change
 * @return {ve.dm.Change|null} Rebased change applicable instead of other, or null if rebasing fails
 * @throws {Error} If this change does not start where other ends
 */
ve.dm.Change.prototype.rebaseBelow = function ( other ) {
	var change;
	if ( this.transactionStart !== other.transactionStart + other.length ) {
		throw new Error( 'This starts at ' + this.transactionStart +
			' but other ends at ' + ( other.transactionStart + other.length ) );
	}
	change = this.rebaseOnto( other.reversed() );
	if ( change === null ) {
		return null;
	}
	// Adjust start and changes so that we're "underneath"
	change.transactionStart = other.transactionStart;
	change.storeStart = other.storeStart;
	change.store = change.store.difference( other.store.difference( this.store ) );
	return change;
};

/**
 * Build a composite change from two consecutive changes
 *
 * @param {ve.dm.Change} other Change that starts immediately after this
 * @return {ve.dm.Change} Composite change
 * @throws {Error} If other does not start immediately after this
 */
ve.dm.Change.prototype.concat = function ( other ) {
	var store;
	if ( other.transactionStart !== this.transactionStart + this.transactions.length ) {
		throw new Error( 'this ends at ' + ( this.transactionStart + this.transactions.length ) +
			' but other starts at ' + other.transactionStart );
	}
	store = this.store.slice();
	store.merge( other.store );
	return new ve.dm.Change(
		this.transactionStart,
		this.transactions.concat( other.transactions ),
		this.storeStart,
		store
	);
};

/**
 * Build a change from the most recent transactions and store values
 *
 * @param {number} transactionStart Start offset for transactions
 * @param {number} storeStart Start offset for store values
 * @return {ve.dm.Change} Change with the most recent transactions and store values
 */
ve.dm.Change.prototype.mostRecent = function ( transactionStart, storeStart ) {
	return new ve.dm.Change(
		transactionStart,
		this.transactions.slice( transactionStart - this.transactionStart ),
		storeStart,
		this.store.slice( storeStart - this.storeStart )
	);
};

/**
 * Apply change to surface
 *
 * @param {ve.dm.Surface} surface Surface with same ve.dm.Document as the transactions
 */
ve.dm.Change.prototype.applyTo = function ( surface ) {
	this.transactions.forEach( function ( tx ) {
		surface.change( tx );
	} );
};

/**
 * Append change transactions to history
 *
 * @param {ve.dm.Transactions[]} history History
 * @throws {Error} If this change does not start at the top of the history
 */
ve.dm.Change.prototype.addToHistory = function ( history ) {
	if ( this.transactionStart !== history.length ) {
		throw new Error( 'this starts at ' + this.transactionStart +
			' but history ends at ' + history.length );
	}
	ve.batchPush( history, this.transactions );
};

ve.dm.Change.prototype.serialize = function () {
	return {
		transactionStart: this.transactionStart,
		transactions: this.transactions,
		storeStart: this.storeStart,
		store: {
			hashStore: this.store.hashStore,
			hashes: this.store.hashes
		}
	};
};

} ) );
