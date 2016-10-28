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
	this.socket.on( 'rejectedUpdate', this.onRejectedUpdate.bind( this ) );

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
 * Get the submitted changes. this.submittedChange is the change as it was submitted to the server;
 * this method extracts the submitted changes from the history stack, so it returns a possibly
 * rebased version of this.submittedChange.
 * @return {ve.dm.Change} Submitted changes
 */
ve.dm.SurfaceSynchronizer.prototype.getRebasedSubmittedChange = function () {
	return this.getUncommittedChange().truncate(
		this.submittedChange ? this.submittedChange.transactions.length : 0,
		this.submittedChange ? this.submittedChange.store.getLength() : 0
	);
};

/**
 * Get the unsubmitted changes, i.e. changes that exist locally and have not been submitted to the server.
 * If there is no change in flight, the unsubmitted and uncommitted changes are the same; if there
 * is a change in flight, the unsubmitted changes are a subset of the uncommitted changes.
 * @return {ve.dm.Change} unsubmitted changes
 */
ve.dm.SurfaceSynchronizer.prototype.getUnsubmittedChange = function () {
	return this.doc.getChangeSince(
		this.transactionCommitLength + this.submittedChange ? this.submittedChange.transactions.length : 0,
		this.storeCommitLength + this.submittedChange ? this.submittedChange.store.getLength() : 0
	);
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
	// HACK annotate transaction with authorship information
	// This relies on being able to access the transaction object by reference;
	// we should probably set the author deeper in dm.Surface or dm.Document instead.
	tx.author = this.author;
	// TODO deal with staged transactions somehow
	this.applyNewSelections( this.authorSelections, tx );
	this.submitUpdateThrottled();
};

/**
 * Respond to selection changes.
 */
ve.dm.SurfaceSynchronizer.prototype.onSurfaceSelect = function () {
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
			translatedSelection = newSelections[ author ].translateByTransactionWithAuthor( tx, author );
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
	var author, localChange, rebases, localRebased, incoming,
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
		// Let c=change and l=localChange. Rebase c over l.
		rebases = ve.dm.Change.static.rebaseChanges( change, localChange );
		incoming = rebases[ 0 ]; // c\l
		localRebased = rebases[ 1 ]; // l/c
		if ( !localRebased ) {
			console.log( 'conflict detected locally' );
			// c conflicts with l, but l = s + u where s is the submitted part and u is the unsubmitted part.
			// Try rebasing c over just s.
			// (If there is no change in flight, s will be empty, and the rebase will succeed.)
			rebases = ve.dm.Change.static.rebaseChanges( change, this.getRebasedSubmittedChange() );
			incoming = rebases[ 0 ]; // c\s
			localRebased = rebases[ 1 ]; // s/c
			if ( localRebased ) {
				// Rebasing c over s worked. Discard u, and let s take the place of l below
				console.log( 'discarding unsubmitted change', this.getUnsubmittedChange() );
				// Apply -u
				this.getUnsubmittedChange().reversed().applyTo( this.surface );
				// No need to rewind history because we're about to do that anyway
			}
		}

		// If we managed to rebase either l or s above, reconcile
		if ( localRebased ) {
			// Apply c\l to the current state, but rewrite the history to c + l/c
			if ( localChange.transactions.length > 0 ) {
				console.log( this.author, 'rebased local change', localRebased );
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
			// c conflicts with both l and s, so discard all of l.
			console.log( 'discarding all local changes', localChange );
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
		// to apply anything. We also don't need to rewrite our history because it's already
		// correct.
		this.applyNewSelections( selections );
		this.markSynced( change );
		this.submittedChange = null;
	}

	this.applying = false;
	// Schedule submission of unsent local changes, if any
	this.submitUpdateThrottled();
};

/**
 * Respond to a rejectedUpdate event from the server.
 *
 * Roll back our local changes (both submitted and unsubmitted),
 * and apply any changes we may have buffered while this change
 * was in flight.
 *
 * @param {Object} data Data from the server
 * @param {number} [data.transactionStart] Start point of the rejected change
 * @param {string} [data.error] Error message
 */
ve.dm.SurfaceSynchronizer.prototype.onRejectedUpdate = function ( data ) {
	// TODO conflict notifications from the server are probably redundant; I don't think there's
	// any case where the client wouldn't already have detected the conflict itself, because the
	// conflicting change must arrive before the conflict notification. If this is true, then
	// we could clear this.submittedChange in the conflict handling code in onNewUpdate and
	// delete most of this function (except for handling data.error).
	var localChange = this.getUncommittedChange();
	console.log( this.author, 'conflict notification from server for ', data.transactionStart );
	if ( data.transactionStart !== undefined && localChange.transactionStart > data.transactionStart ) {
		// This is a notification about a conflict that we've already detected locally, ignore.
		// Note that we can't mistake one conflict notification for another, because we can
		// never submit two changes with the same transactionStart. Say we submit a change A, then
		// later submit a change B. If A is accepted, then B will be based on A, so B.tS > A.tS.
		// If A is rejected, then it conflicted with some change C, and B will be based on C,
		// so B.tS > C.tS. But A was not based on C, so A.tS <= C.tS. From B.tS > C.tS >= A.tS
		// it follows that B.tS > A.tS.
		console.log( 'conflict already handled, ignoring' );
	} else {
		console.log( '!!!conflict was not locally detected!!! undoing local change', localChange );
		// Undo our local changes and remove them from the history
		this.applying = true;
		localChange.reversed().applyTo( this.surface );
		this.rewindToBefore( localChange );
		this.markSynced();
		this.applying = false;
	}
	// TODO if data.error is set, we may have to resync from scratch

	// Allow new changes to be submitted
	this.submittedChange = null;
	// Submit any changes that haven't been submitted yet (there can be unsubmitted changes if we
	// ignored this event, and even if we just rolled back there can be a selection change)
	this.submitUpdateThrottled();
};
