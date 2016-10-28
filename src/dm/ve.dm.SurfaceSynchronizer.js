/*!
 * VisualEditor DataModel SurfaceSynchronizer class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */
/* global io */

// FIXME: Remove before merging
/* global console */
/* eslint-disable no-console */

/**
 * DataModel surface synchronizer.
 *
 * @class
 * @mixins OO.EventEmitter
 *
 * @constructor
 * @param {ve.dm.Surface} surface Surface model to synchronize
 */
ve.dm.SurfaceSynchronizer = function VeDmSurfaceSynchronizer( surface ) {
	// Mixin constructors
	OO.EventEmitter.call( this );

	// Properties
	this.surface = surface;
	this.doc = surface.documentModel;
	this.store = this.doc.getStore();
	this.authorSelections = {};
	this.documentId = ve.docName; // HACK
	this.author = null;

	// Offsets up to which we know we agree with the server
	this.transactionCommitLength = this.doc.completeHistory.length;
	this.storeCommitLength = this.store.getLength();
	this.lastSubmittedSelection = null;
	// Change that we have submitted and are waiting to hear back about, or null if no change in flight
	this.submittedChange = null;

	// Whether we are currently synchronizing the model
	this.applying = false;

	if ( window.QUnit || !window.io ) {
		return;
	}

	// HACK
	this.socket = io( '/' + this.documentId );
	this.socket.on( 'registered', this.onRegistered.bind( this ) );
	this.socket.on( 'newUpdate', this.onNewUpdate.bind( this ) );
	this.socket.on( 'rejectedChange', this.onRejectedChange.bind( this ) );

	// Events
	this.doc.connect( this, {
		transact: 'onDocumentTransact'
	} );

	this.surface.connect( this, {
		select: 'onSurfaceSelect'
	} );

	this.submitUpdateThrottled = ve.debounce( ve.throttle( this.submitUpdate.bind( this ), 250 ), 0 );
};

/* Inheritance */

OO.mixinClass( ve.dm.SurfaceSynchronizer, OO.EventEmitter );

/* Events */

/**
 * @event authorSelect
 * @param {string} author The author whose selection has changed
 */

/* Methods */

/**
 * Get the surface.
 *
 * @return {ve.dm.Surface} Surface
 */
ve.dm.SurfaceSynchronizer.prototype.getSurface = function () {
	return this.surface;
};

/**
 * Get the uncommitted local changes, i.e. changes that exist locally but have not been acknowledged
 * by the server.
 *
 * @return {ve.dm.Change} Uncommitted changes
 */
ve.dm.SurfaceSynchronizer.prototype.getUncommittedChange = function () {
	return this.doc.getChangeSince(
		this.transactionCommitLength,
		this.storeCommitLength
	);
};

/**
 * Get the unsent local changes, i.e. changes that exist locally but have not been submitted to the
 * server. If a submitted change is in flight, #getUncommittedChange will return both the submitted
 * and any unsubmitted changes, whereas this will only return the unsubmitted changes. If no change
 * is in flight, this returns the same as #getUncommittedChange.
 *
 * @return {ve.dm.Change} Unsent changes
 */
ve.dm.SurfaceSynchronizer.prototype.getUnsentChange = function () {
	var change, i, len, tx;
	if ( this.submittedChange ) {
		change = this.doc.getChangeSince(
			this.submittedChange.transactionStart + this.submittedChange.transactions.length,
			this.submittedChange.storeStart + this.submittedChange.store.getLength()
		);
	} else {
		change = this.getUncommittedChange();
	}
	for ( i = 0, len = change.transactions.length; i < len; i++ ) {
		tx = change.transactions[ i ];
		tx.author = this.author;
	}
	return change;
};

ve.dm.SurfaceSynchronizer.prototype.onSurfaceSelect = function () {
	this.submitUpdateThrottled();
};

/**
 * Rewind history to the point right before a given change.
 * This removes the change and anything that happened after it from the local history.
 *
 * @param {ve.dm.Change} change Change to rewind to
 */
ve.dm.SurfaceSynchronizer.prototype.rewindToBefore = function ( change ) {
	this.doc.completeHistory.splice( change.transactionStart );
	this.store.truncate( change.storeStart );
};

/**
 * Mark the current history position as synchronized with the server,
 * i.e. we and the server agree on history up to this point.
 * @param {ve.dm.Change} [change] If set, mark the history position at the end of this change
 *  as synced; if not set, mark the current history position as synced.
 */
ve.dm.SurfaceSynchronizer.prototype.markSynced = function ( change ) {
	this.transactionCommitLength = change ?
		change.transactionStart + change.transactions.length :
		this.doc.completeHistory.length;
	this.storeCommitLength = change ?
		change.storeStart + change.store.getLength() :
		this.store.getLength();
};

/**
 * Respond to transactions happening on the document. Ignores transactions applied by
 * SurfaceSynchronizer itself.
 *
 * @param {ve.dm.Transaction} tx Transaction that was applied
 */
ve.dm.SurfaceSynchronizer.prototype.onDocumentTransact = function ( tx ) {
	if ( this.applying ) {
		// Ignore our own synchronization transactions
		return;
	}
	// TODO deal with staged transactions somehow
	this.applyNewSelections( this.authorSelections, tx );
	this.submitUpdateThrottled();
};

/**
 * Submit all outstanding changes. Do not call this directly, use #submitUpdateThrottled.
 *
 * This will submit all transactions that exist in local history but have not been broadcast
 * by the server.
 */
ve.dm.SurfaceSynchronizer.prototype.submitUpdate = function () {
	var change, selection;
	if ( this.submittedChange ) {
		// We're already submitting a change. Once the server responds to us, we'll rebase the
		// unsent local changes and submit them then.
		return;
	}
	change = this.getUncommittedChange();
	selection = this.getSurface().getSelection();
	if ( change.transactions.length === 0 && selection.equals( this.lastSubmittedSelection ) ) {
		return;
	}
	this.lastSubmittedSelection = selection;
	this.submittedChange = change;
	this.socket.emit( 'submitUpdate', {
		doc: this.documentId,
		author: this.author,
		change: change.serialize(),
		selection: selection
	} );

	console.log( this.author, 'submitUpdate', change.serialize(), selection.getDescription() );
};

/**
 * Translate incoming selections by change, then apply them and fire authorSelect
 *
 * @param {Object} newSelections Each author (key) maps to a new incoming ve.dm.Selection
 * @param {ve.dm.Change|ve.dm.Transaction} [changeOrTx] Object to translate over, if any
 * @fires authorSelect
 */
ve.dm.SurfaceSynchronizer.prototype.applyNewSelections = function ( newSelections, changeOrTx ) {
	var author, translatedSelection,
		change = changeOrTx instanceof ve.dm.Change ? changeOrTx : null,
		tx = changeOrTx instanceof ve.dm.Transaction ? changeOrTx : null;
	for ( author in newSelections ) {
		if ( author === this.author ) {
			continue;
		}
		if ( change ) {
			translatedSelection = newSelections[ author ].translateByChange( change, author );
		} else if ( tx ) {
			translatedSelection = newSelections[ author ].translateByTransaction( tx, author );
		} else {
			translatedSelection = newSelections[ author ];
		}
		// Test equality before assigning, in case this.authorSelections === newSelections
		// changed = !translatedSelection.equals( this.authorSelections[ author ] );
		this.authorSelections[ author ] = translatedSelection;
		this.emit( 'authorSelect', author );
	}
};

ve.dm.SurfaceSynchronizer.prototype.onRegistered = function ( author ) {
	this.author = String( author );
	this.surface.setAuthor( this.author );
	// HACK
	if ( !window.QUnit ) {
		$( '.ve-demo-editor' ).prepend( $( '<span style="position: absolute; top: 1.5em;">' ).text( this.author ) );
	}
};

/**
 * Respond to a newUpdate event from the server.
 *
 * If we have no change in flight, and get a newUpdate event about someone else's change,
 * then apply this change and attempt to rebase and submit any unsent local changes
 * If the rebase fails, roll back the unsent local changes.
 *
 * If we have a submitted change in flight, and get a newUpdate event about someone else's change,
 * buffer this change until we learn what happened to our submitted change. We don't attempt
 * to rebase our submitted change across the received change just yet, because that could lead
 * to us disagreeing with the server about whether there's a conflict.
 *
 * If we have a submitted change in flight, and get a newUpdate event about our own change,
 * that means the server has accepted the in-flight change. Apply the buffered changes and
 * the rebased version of our submitted change, and attempt to rebase and submit any unsent
 * local changes.
 *
 * @param {Object} data Data from the server
 * @param {ve.dm.Change} data.change Change that the server has applied
 * @param {string} data.author Author ID of the client that submitted the change
 */
ve.dm.SurfaceSynchronizer.prototype.onNewUpdate = function ( data ) {
	var author, localChange, rebases, localRebased,
		incoming,
		selections = {},
		change = ve.dm.Change.static.deserialize( data.change );

	for ( author in data.selections ) {
		selections[ author ] = ve.dm.Selection.static.newFromJSON( this.doc, data.selections[ author ] );
	}
	console.log( this.author, 'newUpdate', data );
	// Make sure we don't attempt to submit any of the transactions we commit while manipulating
	// the state of the document
	this.applying = true;

	if ( data.author !== this.author ) {
		console.log( this.author, 'applying change', change );
		localChange = this.getUncommittedChange();
		// Let c=change and l=localchange. Rebase c over l.
		rebases = ve.dm.Change.static.rebaseChanges( change, localChange );
		incoming = rebases[ 0 ]; // c\l
		localRebased = rebases[ 1 ]; // l/c
		if ( localRebased ) {
			// Apply c\l to the current state, but rewrite the history to c + l/c
			if ( localChange.transactions.length > 0 ) {
				console.log( this.author, 'rebasing onto uncommitted change', localChange );
			}
			// Apply c\l
			incoming.applyTo( this.surface );
			// Rewind history to before l
			this.rewindToBefore( localChange );
			// Add c to the history
			change.addToHistory( this.doc );
			this.markSynced();
			// Add l/c to the history
			localRebased.addToHistory( this.doc );
			this.applyNewSelections( selections, localRebased );
		} else {
			// The uncommitted changes conflict with the new changes, so discard the uncommitted changes
			console.log( this.author, 'conflict, discarding uncommitted change', localChange );
			// Apply -l
			localChange.reversed().applyTo( this.surface );
			// Rewind history to before l
			this.rewindToBefore( localChange );
			// Apply c
			change.applyTo( this.surface );
			this.applyNewSelections( selections );
			this.markSynced();
		}
	} else {
		// The server accepted our change; we've already rebased it as needed so we don't need
		// to do anything
		this.applyNewSelections( selections );
		this.markSynced( change );
		this.submittedChange = null;
	}

	this.applying = false;
	// Schedule submission of unsent local changes, if any
	this.submitUpdateThrottled();
};

/**
 * Respond to a rejectedChange event from the server.
 *
 * Roll back our local changes (both submitted and unsubmitted),
 * and apply any changes we may have buffered while this change
 * was in flight.
 */
ve.dm.SurfaceSynchronizer.prototype.onRejectedChange = function () {
	// Undo our local changes and remove them from the history
	var localChange = this.getUncommittedChange();
	console.log( this.author, 'conflict, undoing local change', localChange );
	this.applying = true;
	localChange.reversed().applyTo( this.surface );
	this.rewindToBefore( localChange );

	this.markSynced();
	this.submittedChange = null;
	this.applying = false;
};
