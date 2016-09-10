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
	this.authorId = Math.random();
	document.body.insertBefore( document.createTextNode( this.authorId ), document.body.firstChild );
	this.prevSelection = null;

	if ( window.QUnit ) {
		return;
	}

	this.socket = io();
	this.socket.on( 'newChange', this.onNewChange.bind( this ) );

	// Events
	this.doc.connect( this, {
		transact: 'onDocumentTransact'
	} );

	this.sendChangeDebounced = ve.debounce( this.sendChange.bind( this ), 1000 );
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
	this.sendChangeDebounced();
};

ve.dm.SurfaceSynchronizer.prototype.sendChange = function () {
	var documentModel = this.getSurface().getDocument(),
		sync = this,
		change = documentModel.getChangeSince( this.transactionCommitLength, this.storeCommitLength );
	if ( change.transactions.length === 0 ) {
		return;
	}
	this.socket.emit( 'submitChange', {
		doc: this.documentId,
		author: this.authorId,
		change: change.serialize()
	} );
	console.log( 'sendChange', change.serialize() );
	// TODO freeze new changes
	this.socket.once( 'receivedChange', function( data ) {
		console.log( 'receivedChange', data );
		if ( data.applied ) {
			// TODO reconcile
			sync.transactionCommitLength = sync.doc.completeHistory.length;
		}
	} );
};

ve.dm.SurfaceSynchronizer.prototype.onNewChange = function ( data ) {
	if ( data.author === this.authorId ) {
		return;
	}
	console.log( 'newChange', data );

	var change = ve.dm.Change.static.deserialize( data.change );
	// TODO rebase unsent changes etc
	change.applyTo( this.surface );
	this.transactionCommitLength = this.doc.completeHistory.length;
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
	var unsent, sentRebased, parallel;
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
	return;

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
