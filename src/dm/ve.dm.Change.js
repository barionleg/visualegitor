( function ( createClass ) {
	if ( typeof window !== 'undefined' ) {
		// Browser. new ve.dm.Change(...)
		createClass( window.ve );
	} else {
		// Node. ve={dm:{}}; require( 've.dm.Change' )( ve ); new ve.dm.Change(...)
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

} ) );
