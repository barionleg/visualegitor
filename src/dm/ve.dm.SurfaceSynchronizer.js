/*!
 * VisualEditor DataModel SurfaceSynchronizer class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel surface synchronizer.
 *
 * @class
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {ve.dm.Surface} surface Surface model to syncrhonize
 */
ve.dm.SurfaceSynchronizer = function VeDmSurfaceSynchronizer( surface ) {
	// Mixin constructors
	OO.EventEmitter.call( this );

	// Properties
	this.surface = surface;
	this.historyPointer = 0;
	this.userSelections = {};

	this.pushDebounced = ve.debounce( this.push.bind( this ), 500 );
	this.documentId = 'EXAMPLE';
	this.userId = Math.random();

	if ( window.QUnit ) {
		return;
	}
	// Events
	this.getSurface().getDocument().connect( this, {
		transact: 'onDocumentTransact'
	} );
	this.getSurface().connect( this, {
		select: this.pushDebounced
	} );

	this.pullInterval = 500;
	this.pull();
};

/* Inheritance */

OO.mixinClass( ve.dm.SurfaceSynchronizer, OO.EventEmitter );

/* Methods */

ve.dm.SurfaceSynchronizer.prototype.getSurface = function () {
	return this.surface;
};

ve.dm.SurfaceSynchronizer.prototype.onDocumentTransact = function ( tx ) {
	var userId;
	for ( userId in this.userSelections ) {
		this.userSelections[userId].selection = this.userSelections[userId].selection.translateByTransaction( tx );
	}
	this.pushDebounced();
};

ve.dm.SurfaceSynchronizer.prototype.push = function () {
	var txs = [],
		selection = this.getSurface().getSelection(),
		documentModel = this.getSurface().getDocument();
	if ( this.historyPointer < documentModel.getCompleteHistoryLength() ) {
		// Small optimisation: check history pointer is in the past
		txs = documentModel.getCompleteHistorySince( this.historyPointer );
	}
	this.historyPointer += txs.length;
	$.ajax( 'collab.php?push', {
		type: 'POST',
		data: {
			historyPointer: this.historyPointer,
			documentId: this.documentId,
			userId: this.userId,
			transactions: txs.length ? JSON.stringify( txs ) : undefined,
			selection: JSON.stringify( selection )
		}
	} );
};

ve.dm.SurfaceSynchronizer.prototype.pull = function () {
	// var documentModel = this.getSurface().getDocument();
	$.ajax( 'collab.php?pull', {
		type: 'POST',
		dataType: 'json',
		data: {
			documentId: this.documentId,
			userId: this.userId,
			historyPointer: this.historyPointer
		}
	} ).done( this.afterPull.bind( this ) );
	setTimeout( this.pull.bind( this ), this.pullInterval );
};

ve.dm.SurfaceSynchronizer.prototype.afterPull = function ( data ) {
	var i, iLen, j, jLen, userSelection, userId, selection, transactions, tx,
		documentModel = this.getSurface().getDocument(),
		userSelections = data.selections,
		userTransactions = data.transactions;

	for ( i = 0, iLen = userTransactions.length; i < iLen; i++ ) {
		transactions = JSON.parse( userTransactions[i].transactions );
		for ( j = 0, jLen = transactions.length; j < jLen; j++ ) {
			tx = ve.dm.Transaction.newFromHash( documentModel, transactions[j] );
			this.getSurface().change( tx );
			this.historyPointer++;
		}
		this.getSurface().breakpoint();
	}

	// Remove old selections
	for ( userId in this.userSelections ) {
		if ( !( userId in userSelections ) ) {
			userSelection = this.userSelections[userId];
			userSelection.selection = new ve.dm.NullSelection( documentModel );
			this.emit( 'userSelect', userSelection );
			delete this.userSelections[userId];
		}
	}

	// Update selections
	for ( userId in userSelections ) {
		userSelection = this.userSelections[userId] || {
			userId: userId,
			selection: new ve.dm.NullSelection( documentModel )
		};
		this.userSelections[userId] = userSelection;

		if ( userSelections[userId].historyPointer !== documentModel.getCompleteHistoryLength() ) {
			continue;
		}

		selection = ve.dm.Selection.static.newFromJSON( documentModel, userSelections[userId].selection );
		if ( !selection.equals( userSelection.selection ) ) {
			userSelection.selection = selection;
			this.emit( 'userSelect', userSelection );
		}
	}
};
