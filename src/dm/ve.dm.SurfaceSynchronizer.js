/*!
 * VisualEditor DataModel SurfaceSynchronizer class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
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
	this.doc = surface.documentModel;
	this.store = this.doc.getStore();
	this.transactionCommitLength = this.doc.completeHistory.length;
	this.storeCommitLength = this.store.getLength();
	this.userSelections = {};
	this.syncDebounced = ve.debounce( this.sync.bind( this ), 5000 );
	this.documentId = 'EXAMPLE';
	this.submittedChange = null;
	this.pendingChange = null;
	this.authorId = Math.random();
	document.body.insertBefore( document.createTextNode( this.authorId ), document.body.firstChild );
	this.prevSelection = null;

	if ( window.QUnit ) {
		return;
	}

	this.socket = io();
	this.socket.on( 'newChange', this.onNewChange.bind( this ) );
	this.socket.on( 'rejectedChange', this.onRejectedChange.bind( this ) );

	// Events
	this.doc.connect( this, {
		transact: 'onDocumentTransact'
	} );

	this.submitChangeDebounced = ve.debounce( this.submitChange.bind( this ), 3000 );
	/*this.doc.connect( this, {
		select: this.syncDebounced
	} );

	this.syncInterval = 5000;
	this.sync();*/
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
		this.userSelections[ userId ].selection = this.userSelections[ userId ].selection.translateByTransaction( tx );
	}
	//this.syncDebounced();
	this.submitChangeDebounced();
};

ve.dm.SurfaceSynchronizer.prototype.submitChange = function () {
	if ( this.submittedChange ) {
		// We're already submitting a change. Once the server responds to us, we'll rebase the
		// unsent local changes and submit them then.
		return;
	}

	var documentModel = this.getSurface().getDocument(),
		sync = this,
		change = documentModel.getChangeSince( this.transactionCommitLength, this.storeCommitLength );
	if ( change.transactions.length === 0 ) {
		return;
	}
	this.submittedChange = change;
	this.pendingChange = change.end();
	this.socket.emit( 'submitChange', {
		doc: this.documentId,
		author: this.authorId,
		change: change.serialize()
	} );
	console.log( this.authorId, 'submitChange', change.serialize() );
};

ve.dm.SurfaceSynchronizer.prototype.onNewChange = function ( data ) {
	console.log( this.authorId, 'newChange', data );

	var pendingOnSubmitted, submittedOnPending, unsent, rebases, unsentRebased, incoming, canonicalHistory,
		change = ve.dm.Change.static.deserialize( data.change );

	if ( this.submittedChange ) {
		if ( data.author === this.authorId ) {
			// Server accepted our change
			console.log( this.authorId, 'server accepted our change', change );
			// Let p = pendingChange and s = submittedChange.
			// The server has sent us submittedOnPending = s/p. Compute pendingOnSubmitted = p\s.
			submittedOnPending = change;
			pendingOnSubmitted = ve.dm.Change.static.rebaseChanges( this.pendingChange, this.submittedChange )[ 0 ];
			// TODO maybe sanity-check/assert that change is equal to the [1] of this rebase?
			canonicalHistory = this.pendingChange.concat( submittedOnPending ); // p + s/p

			// Get the unsent local changes (= u)
			unsent = this.doc.getChangeSince(
				this.submittedChange.transactionStart + this.submittedChange.transactions.length,
				this.submittedChange.storeStart + this.submittedChange.store.getLength()
			);
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

				console.log( this.authorId, 'rebase of unsent changes succeeded' );
				// Apply incoming
				incoming.applyTo( this.surface );

				// Rewind history to before s
				this.doc.completeHistory.splice( this.submittedChange.transactionStart );
				this.store.truncate( this.submittedChange.storeStart );

				// Add p + s/p to the history
				this.store.merge( canonicalHistory.store );
				canonicalHistory.addToHistory( this.doc.completeHistory );

				// Mark this position as the synced position
				this.transactionCommitLength = this.doc.completeHistory.length;
				this.storeCommitLength = this.store.getLength();

				// Add u/(p\s) to the history
				this.store.merge( unsentRebased.store );
				unsentRebased.addToHistory( this.doc.completeHistory );
				if ( unsentRebased.transactions.length > 0 ) {
					// Submit the unsent changes now
					this.submitChange();
				}
			} else {
				// The unsent changes conflict with the pending changes, so discard the unsent changes.
				// Our current state is s + u, so we will apply -u + p\s which gets us to s + p\s.
				// We'll rewrite the history to p + s/p, which is equivalent.

				// TODO maybe reduce code duplication with the if case
				// TODO maybe do that by creating helper functions for "rewind", "add to history", "mark synced"

				console.log( this.authorId, 'rebase of unsent changes failed' );

				// Apply -u
				unsent.reversed().applyTo( this.surface );

				// Rewind history to before s
				this.doc.completeHistory.splice( this.submittedChange.transactionStart );
				this.store.truncate( this.submittedChange.storeStart );

				// Add p + s/p to the history
				this.store.merge( canonicalHistory.store );
				canonicalHistory.addToHistory( this.doc.completeHistory );

				// Mark this position as the synced position
				this.transactionCommitLength = this.doc.completeHistory.length;
				this.storeCommitLength = this.store.getLength();
			}
			this.submittedChange = null;
			this.pendingChange = null;
		} else {
			// Someone else made a change while we have a change in flight
			// Queue it up and apply it when our change is accepted or rejected
			console.log( this.authorId, 'queueing change', change );
			if ( this.pendingChange ) {
				this.pendingChange = this.pendingChange.concat( change );
			} else {
				this.pendingChange = chuange;
			}
		}
	} else {
		if ( data.author === this.authorId ) {
			// WTF
			console.warn( 'Server unexpectedly sent us our own change', change );
		} else {
			console.log( this.authorId, 'applying change', change );
			unsent = this.doc.getChangeSince( this.transactionCommitLength, this.storeCommitLength );
			rebases = ve.dm.Change.static.rebaseChanges( change, unsent );
			incoming = rebases[ 0 ]; // c\u
			unsentRebased = rebases[ 1 ]; // u/c
			if ( unsentRebased ) {
				console.log( this.authorId, 'rebasing onto unsent change', unsent );
				// Apply c\u to the current state, but rewrite the history to c + u/c
				incoming.applyTo( this.surface );

				// Rewind history to before u
				this.doc.completeHistory.splice( unsent.transactionStart );
				this.store.truncate( unsent.storeStart );

				// Add c to the history
				this.store.merge( change.store );
				change.addToHistory( this.doc.completeHistory );

				// Mark this position as the synced position
				this.transactionCommitLength = this.doc.completeHistory.length;
				this.storeCommitLength = this.store.getLength();

				// Add u/c to the history
				this.store.merge( unsentRebased.store );
				unsentRebased.addToHistory( this.doc.completeHistory );

				if ( unsentRebased.transactions.length > 0 ) {
					// Submit the unsent changes now
					this.submitChange();
				}
			} else {
				// The unsent changes conflict with the new changes, so discard the unsent changes
				console.log( this.authorId, 'conflict, discarding unsent change', unsent );

				// Apply -u
				unsent.reversed().applyTo( this.surface );

				// Rewind history to before u
				this.doc.completeHistory.splice( unsent.transactionStart );
				this.store.truncate( unsent.storeStart );

				// Add c to the history
				this.store.merge( change.store );
				change.addToHistory( this.doc.completeHistory );

				// Mark this position as the synced position
				this.transactionCommitLength = this.doc.completeHistory.length;
				this.storeCommitLength = this.store.getLength();
			}
		}
	}
};

ve.dm.SurfaceSynchronizer.prototype.onRejectedChange = function ( data ) {
	// Undo our local changes and remove them from the history
	var localChange = this.doc.getChangeSince(
		this.submittedChange.transactionStart,
		this.submittedChange.storeStart
	);
	console.log( this.authorId, 'conflict, undoing local change', localChange );
	localChange.reversed().applyTo( this.surface );
	this.doc.completeHistory.splice( this.submittedChange.transactionStart );
	this.doc.store.truncate( this.submittedChange.storeStart );

	// Apply pending changes
	if ( this.pendingChange ) {
		console.log( this.authorId, 'applying pending change', this.pendingChange );
		this.pendingChange.applyTo( this.surface );
		this.pendingChange = null;
	}

	this.transactionCommitLength = this.doc.completeHistory.length;
	this.storeCommitLength = this.store.getLength();
	this.submittedChange = null;
};



// Old stuff below here
// --------------------------------------------------------------------------

ve.dm.SurfaceSynchronizer.prototype.sync = function () {
	var selection = JSON.stringify( this.getSurface().getSelection() ),
		documentModel = this.getSurface().getDocument(),
		change = documentModel.getChangeSince( this.transactionCommitLength, this.storeCommitLength );

	this.prevSelection = selection;
	$.ajax( '/applyChange', {
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify( {
			doc: this.documentId,
			author: this.authorId,
			change: change.serialize()
		}, function ( key, value ) {
			if ( value instanceof ve.dm.IndexValueStore ) {
				return undefined;
			}
			return value;
		} ),
		dataType: 'json'
	} )
	.done( this.afterSync.bind( this, change ) );
	setTimeout( this.sync.bind( this ), this.syncInterval );
};

ve.dm.SurfaceSynchronizer.prototype.afterSync = function ( sent, data ) {
	var parallel, rebases, parallelRebased, sentRebased, remote, unsent, incoming,
		unsentRebased, userId, userSelection, selection;
	if ( data.error ) {
		throw new Error( data.error );
	}
	parallel = ve.dm.Change.static.deserialize( data.change );

	rebases = ve.dm.Change.static.rebaseChanges( parallel, sent );
	parallelRebased = rebases[ 0 ];
	sentRebased = rebases[ 1 ];

	if ( !sentRebased ) {
		// Conflict, so remote rebase failed too. Undo local change and history, then
		// apply parallel change
		this.doc.getChangeSince( sent.transactionStart, sent.storeStart ).reversed().applyTo( this.surface );
		this.doc.completeHistory.splice( sent.transactionStart );
		this.doc.store.truncate( sent.storeStart );
		parallel.applyTo( this.surface );
		this.transactionCommitLength = this.doc.completeHistory.length;
		this.storeCommitLength = this.store.getLength();
		return;
	}
	// Else remote rebase succeeded.

	remote = parallel.concat( sentRebased );

	// Try to rebase incoming parallel changes over unsent transactions
	unsent = this.doc.getChangeSince(
		sent.transactionStart + sent.transactions.length,
		sent.storeStart + sent.store.getLength()
	);
	rebases = ve.dm.Change.static.rebaseChanges( parallelRebased, unsent );
	incoming = rebases[ 0 ];
	unsentRebased = rebases[ 1 ];

	if ( !incoming ) {
		// Conflict: undo unsent, and set incoming history
		unsent.reversed().applyTo( this.surface );
		this.doc.completeHistory.splice( remote.transactionStart );
		this.store.truncate( remote.storeStart );
		this.store.merge( remote.store );
		remote.addToHistory( this.doc.completeHistory );
		this.transactionCommitLength = this.doc.completeHistory.length;
		this.storeCommitLength = this.store.getLength();
		return;
	}

	// Else success: apply incoming, change to remote history, and sync unsent
	incoming.applyTo( this.surface );
	this.doc.completeHistory.splice( sent.transactionStart );
	this.store.truncate( sent.storeStart );
	this.store.merge( remote.store );
	remote.addToHistory( this.doc.completeHistory );
	this.transactionCommitLength = this.doc.completeHistory.length;
	this.storeCommitLength = this.store.getLength();

	unsentRebased.addToHistory( this.doc.completeHistory );
	if ( unsentRebased.transactions.length > 0 ) {
		this.sync();
	}
	if ( true ) {
		return;
	}

	// Update selections
	for ( userId in this.userSelections ) {
		userSelection = this.userSelections[ userId ] || {
			userId: userId,
			selection: new ve.dm.NullSelection( this.doc )
		};
		this.userSelections[ userId ] = userSelection;

		if ( this.userSelections[ userId ].historyPointer !== this.doc.getCompleteHistoryLength() ) {
			continue;
		}

		selection = ve.dm.Selection.static.newFromJSON(
			this.doc,
			this.userSelections[ userId ].selection
		);
		if ( !selection.equals( userSelection.selection ) ) {
			userSelection.selection = selection;
			this.emit( 'userSelect', userSelection );
		}
	}
};
