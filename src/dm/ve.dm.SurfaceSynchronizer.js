/*!
 * VisualEditor DataModel SurfaceSynchronizer class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */
/*global io*/
/*global console*/

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
	this.prevSelection = null;
	this.documentId = ve.docName; // HACK
	this.author = null;

	// Offsets up to which we know we agree with the server
	this.transactionCommitLength = this.doc.completeHistory.length;
	this.storeCommitLength = this.store.getLength();
	this.lastSubmittedSelection = null;
	// Change that we have submitted and are waiting to hear back about, or null if no change in flight
	this.submittedChange = null;
	// All changes from others that have arrived while submittedChange was in flight, concated together
	// TODO: this needs to track updates too
	this.pendingChange = null;

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

	this.submitUpdateThrottled = ve.throttle( this.submitUpdate.bind( this ), 250 );
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
			this.submittedChange.storeStart + this.submittedChange.store.getLength(),
			this.author
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
	setTimeout( this.submitUpdateThrottled.bind( this ) );
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
 */
ve.dm.SurfaceSynchronizer.prototype.markSynced = function () {
	this.transactionCommitLength = this.doc.completeHistory.length;
	this.storeCommitLength = this.store.getLength();
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
	this.pendingChange = change.end();
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
		tx = changeOrTx instanceof ve.dm.Transaction ? changeOrTx : null,
		changed;
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
		changed = !translatedSelection.equals( this.authorSelections[ author ] );
		this.authorSelections[ author ] = translatedSelection;
		this.emit( 'authorSelect', author );
	}
};

ve.dm.SurfaceSynchronizer.prototype.onRegistered = function ( author ) {
	this.author = author;
	this.surface.setAuthor( this.author );
	// HACK
	if ( !window.QUnit ) {
		$( '.ve-demo-editor' ).prepend( this.author );
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
 * that means the server has accepted the in-lflight change. Apply the buffered changes and
 * the rebased version of our submitted change, and attempt to rebase and submit any unsent
 * local changes.
 *
 * @param {Object} data Data from the server
 * @param {ve.dm.Change} data.change Change that the server has applied
 * @param {string} data.author Author ID of the client that submitted the change
 */
ve.dm.SurfaceSynchronizer.prototype.onNewUpdate = function ( data ) {
	var author, pendingOnSubmitted, submittedOnPending, unsent, rebases, unsentRebased,
		incoming, canonicalHistory,
		selections = {},
		change = ve.dm.Change.static.deserialize( data.change );

	for ( author in data.selections ) {
		selections[ author ] = ve.dm.Selection.static.newFromJSON( this.doc, data.selections[ author ] );
	}
	console.log( this.author, 'newUpdate', data );
	// Make sure we don't attempt to submit any of the transactions we commit while manipulating
	// the state of the document
	this.applying = true;

	if ( this.submittedChange ) {
		if ( data.author === this.author ) {
			// Server accepted our change
			console.log( this.author, 'server accepted our change', change );
			// Let p = pendingChange and s = submittedChange.
			// The server has sent us submittedOnPending = s/p. Compute pendingOnSubmitted = p\s.
			submittedOnPending = change;
			pendingOnSubmitted = ve.dm.Change.static.rebaseChanges( this.pendingChange, this.submittedChange )[ 0 ];
			// TODO maybe sanity-check/assert that change is equal to the [1] of this rebase?
			canonicalHistory = this.pendingChange.concat( submittedOnPending ); // p + s/p

			// Get the unsent local changes (= u)
			unsent = this.getUnsentChange();
			// Compute the rebases of u over p\s
			rebases = ve.dm.Change.static.rebaseChanges( pendingOnSubmitted, unsent );
			incoming = rebases[ 0 ]; // (p\s) \ u
			unsentRebased = rebases[ 1 ]; // u / (p\s)
			if ( unsentRebased ) {
				// Apply incoming (= (p\s) \ u) to the existing state, obtaining s + u + (p\s)\u,
				// but rewrite the history to p + s/p + u/(p\s). These two are equivalent:
				//     u + (p\s)\u = p\s + u/(p\s)       (rebase axiom)
				// s + u + (p\s)\u = s + p\s + u/(p\s)   (pre-concat s)
				// s + u + (p\s)\u = p + s/p + u/(p\s)   (s + p\s = p + s/p by rebase axiom)

				console.log( this.author, 'rebasing unsent change', unsent );
				// Apply incoming
				incoming.applyTo( this.surface );
				// Rewind history to before s
				this.rewindToBefore( this.submittedChange );
				// Add p + s/p to the history
				canonicalHistory.addToHistory( this.doc );
				this.markSynced();
				// Add u/(p\s) to the history
				unsentRebased.addToHistory( this.doc );
			} else {
				// The unsent changes conflict with the pending changes, so discard the unsent changes.
				// Our current state is s + u, so we will apply -u + p\s which gets us to s + p\s.
				// We'll rewrite the history to p + s/p, which is equivalent.
				console.log( this.author, 'conflict, discarding unsent change', unsent );
				// Apply -u
				unsent.reversed().applyTo( this.surface );
				// Rewind history to before s
				this.rewindToBefore( this.submittedChange );
				// Add p + s/p to the history
				canonicalHistory.addToHistory( this.doc );
				this.markSynced();
			}
			this.submittedChange = null;
			this.pendingChange = null;

		} else {
			// Someone else made a change while we have a change in flight
			// Queue it up and apply it when our change is accepted or rejected
			console.log( this.author, 'queueing change', change );
			if ( this.pendingChange ) {
				this.pendingChange = this.pendingChange.concat( change );
			} else {
				this.pendingChange = change;
			}
		}
	} else {
		if ( data.author === this.author ) {
			// WTF?! This should never happen
			console.warn( 'Server unexpectedly sent us our own change', change );
		} else {
			console.log( this.author, 'applying change', change );
			unsent = this.getUnsentChange();
			// Let c=change and u=unsent. Rebase c over u.
			rebases = ve.dm.Change.static.rebaseChanges( change, unsent );
			incoming = rebases[ 0 ]; // c\u
			unsentRebased = rebases[ 1 ]; // u/c
			if ( unsentRebased ) {
				// Apply c\u to the current state, but rewrite the history to c + u/c
				console.log( this.author, 'rebasing onto unsent change', unsent );
				// Apply c\u
				incoming.applyTo( this.surface );
				// Rewind history to before u
				this.rewindToBefore( unsent );
				// Add c to the history
				change.addToHistory( this.doc );
				this.markSynced();
				// Add u/c to the history
				unsentRebased.addToHistory( this.doc );
				this.applyNewSelections( selections, unsentRebased );
			} else {
				// The unsent changes conflict with the new changes, so discard the unsent changes
				console.log( this.author, 'conflict, discarding unsent change', unsent );
				// Apply -u
				unsent.reversed().applyTo( this.surface );
				// Rewind history to before u
				this.rewindToBefore( unsent );
				// Apply c
				change.applyTo( this.surface );
				this.applyNewSelections( selections );
				this.markSynced();
			}
		}
	}

	this.applying = false;
	// Schedule submission of unsent local changes, if any
	if ( unsentRebased && unsentRebased.transactions.length > 0 ) {
		this.submitUpdateThrottled();
	}
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
	this.rewindToBefore( this.submittedChange );

	// Apply pending changes
	if ( this.pendingChange ) {
		console.log( this.author, 'applying pending change', this.pendingChange );
		this.pendingChange.applyTo( this.surface );
		this.pendingChange = null;
	}

	this.markSynced();
	this.submittedChange = null;
	this.applying = false;
};
