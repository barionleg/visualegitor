/*!
 * VisualEditor DataModel Rebaser class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel rebaser.
 *
 * @class
 *
 * @constructor
 * @param {ve.dm.Surface} surface Surface model to syncrhonize
 */
ve.dm.Rebaser = function VeDmRebaser( surface ) {
	// Properties
	this.surface = surface;
};

/* Inheritance */

OO.initClass( ve.dm.SurfaceSynchronizer );

/* Methods */

/**
 * @param {number} historyPointer The instant on top of which the transactions apply
 * @param {ve.dm.Transaction[]} newTxs The transactions to rebase
 * @return {ve.dm.Transaction[]|null} Rebased transactions, or null if there is a conflict
 */
ve.dm.Rebaser.prototype.rebaseDiff = function ( historyPointer, newTxs ) {
	var txs = this.surface.getDocument().getCompleteHistorySince( historyPointer );
	// Trivial rebase: conflict if not already rebased.
	// TODO: refine very slightly
	if ( txs.length > 0 ) {
		return null;
	}
	return newTxs;
};

/**
 * Attempt to apply transactions, and return the resulting resolved history
 *
 * @param {number} historyPointer The instant on top of which the transactions apply
 * @param {ve.dm.Transaction[]} newTxs The transactions to apply
 * @param {boolean} force Keep newTxs and back out existing history if necessary
 * @return {ve.dm.Transaction[]|null} Resulting history (null if identical to newTxs)
 */
ve.dm.Rebaser.prototype.applyDiff = function ( historyPointer, newTxs, force ) {
	var resolvedTxs, oldTxs, i, len, documentModel;
	oldTxs = documentModel.getCompleteHistorySince( historyPointer );
	resolvedTxs = this.rebaseDiff( historyPointer, newTxs );
	if ( resolvedTxs !== null ) {
		for ( i = 0, len = resolvedTxs.length; i < len; i++ ) {
			this.surface.change( resolvedTxs[ i ] );
		}
		return [].concat( oldTxs, resolvedTxs );
	}
	// Else rebase failed
	if ( !force ) {
		// Throw away newTxs and return existing history
		return oldTxs;
	}
	// Else back out existing history and apply newTxs
	for ( i = oldTxs.length - 1; i >= 0; i-- ) {
		this.surface.change( oldTxs[ i ].reversed() );
	}
	for ( i = 0, len = newTxs.length; i < len; i++ ) {
		this.surface.change( newTxs[ i ] );
	}
	return null;
};
