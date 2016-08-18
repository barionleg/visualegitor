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
 * x.concat(y.concat(z)) = x.concat(y).concat(z) for any sequential x, y, z.
 *
 * For a change f: D1 -> D2 we define f.reversed() as the change D2 -> D1 such that
 * f.concat(f.reversed()) is the identity change D1 -> D1.
 *
 * Given two changes f: D1 -> D2 and g: D1 -> D3 , We would like to define f.rebaseOnto(g)
 * ("f rebased onto g") as a change that maps D3 onto some D4: conceptually, it is f
 * modified so it can be applied after g. This is a useful concept because it allows changes
 * written in parallel to be sequenced into a linear order. However, for some changes there
 * is no reasonable way to do this; e.g. when f and g both change the same word to something
 * different. In this case we make f.rebaseOnto(g) return null and we say it conflicts.
 *
 * Given f: D1 -> D2 and g: D1 -> D3, we give two guarantees about rebasing:
 *
 * 1. g.rebaseOnto(f) conflicts if and only if f.rebaseOnto(g) conflicts.
 * 2. If there is no conflict, f.concat(g.rebaseOnto(f)) equals g.concat(g.rebaseOnto(f)).
 *
 * These guarantees let us reorder non-conflicting changes without affecting the resulting
 * document. They also let us move in the inverse direction ("rebase under"), from sequential
 * changes to parallel ones, for if f: D1 -> D2 and g: D2 -> D3, then g.rebaseOnto(f.reversed())
 * maps from D1 to some D4, and conceptually it is g modified to apply without f having been
 * applied.
 *
 * We can also rebase a stack of consecutive changes onto another change. For example given
 * consecutive changes f, g, and a parallel change x, i.e.:
 *
 * f: D1 -> D2, g: D2 -> D3,
 * x: D1 -> D4 ,
 *
 * Then g.rebaseOnto(x.rebaseOnto(f)) is conceptually g rebased "under" f then onto
 * x.concat(f.rebaseOnto(x)). Proof: if the changes don't conflict then

 * x.rebaseOnto(f) maps from D1 to some D5 , and
 * f.rebaseOnto(x) maps from D4 to D5.
 *
 * But from guarantee 2, f.concat(x.rebaseOnto(f)) equals x.concat(f.rebaseOnto(x)).
 * So then preconcatening f.reversed() gives us:
 *
 * x.rebaseOnto(f) equals f.reversed().concat(x).concat(f.rebaseOnto(x)).
 *
 * So g.rebaseOnto(x.rebaseOnto(f)) is as described. QED.
 *
 * @class
 * @constructor
 * @param {number} start Position in the history stack where change starts
 * @param {ve.dm.Transaction[]} transactions Transactions to apply
 */
ve.dm.Change = function VeDmChange( start, transactions ) {
	this.start = start;
	this.transactions = transactions;
};

/* Static methods */

ve.dm.Change.static = {};

ve.dm.Change.static.deserialize = function ( doc, data ) {
	return new ve.dm.Change( data.start, data.transactions.map( function ( txHash ) {
		return ve.dm.Transaction.newFromHash( doc, txHash );
	} ) );
};

/* Methods */

/**
 * @return {ve.dm.Change} The change that backs out this change
 */
ve.dm.Change.prototype.reversed = function () {
	return new ve.dm.Change(
		this.start + this.transactions.length,
		this.transactions.map( function ( tx ) {
			return tx.reversed();
		} ).reverse()
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
	if ( this.start !== other.start ) {
		throw new Error( 'Different starts: ' + this.start + ' and ' + other.start );
	}
	// Trivial rebase: fail if both this or other are non-empty
	// TODO: make a little less trivial
	if ( this.transactions.length && other.transactions.length ) {
		return null;
	}
	return new ve.dm.Change( other.start + other.transactions.length, this.transactions );
};

/**
 * Rebase this change below other (ready to replace other)
 *
 * @param {ve.dm.Change} other Other change
 * @return {ve.dm.Change|null} Rebased change applicable instead of other, or null if rebasing fails
 * @throws {Error} If this change does not start where other ends
 */
ve.dm.Change.prototype.rebaseBelow = function ( other ) {
	if ( this.start !== other.start + other.length ) {
		throw new Error( 'This starts at ' + this.start +
			' but other ends at ' + ( other.start + other.length ) );
	}
	// Trivial rebase: fail if both this or other are non-empty
	// TODO: make a little less trivial
	if ( this.transactions.length && other.transactions.length ) {
		return null;
	}
	return new ve.dm.Change( other.start, this.transactions );
};

/**
 * Build a composite change from two consecutive changes
 *
 * @param {ve.dm.Change} other Change that starts immediately after this
 * @returns {ve.dm.Change} Composite change
 * @throws {Error} If other does not start immediately after this
 */
ve.dm.Change.prototype.concat = function ( other ) {
	if ( other.start !== this.start + this.transactions.length ) {
		throw new Error( 'this ends at ' + ( this.start + this.transactions.length ) +
			' but other starts at ' + other.start );
	}
	return new ve.dm.Change( this.start, this.transactions.concat( other.transactions ) );
};

/**
 * Build a change by slicing this change's transaction list
 *
 * @param {number} start Start offset
 * @param {number} [end] End offset; defaults to end of transaction list
 * @returns {ve.dm.Change} Sliced change, with adjusted start offset
 */
ve.dm.Change.prototype.slice = function ( start, end ) {
	return new ve.dm.Change( this.start + start, this.transactions.slice( start, end ) );
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
	if ( this.start !== history.length ) {
		throw new Error( 'this starts at ' + this.start +
			' but history ends at ' + history.length );
	}
	ve.batchPush( history, this.transactions );
};

ve.dm.Change.prototype.serialize = function () {
	return { start: this.start, transactions: this.transactions };
};
