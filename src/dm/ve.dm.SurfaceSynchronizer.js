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
	this.commitPointer = 0;
	this.doc = surface.documentModel;
	this.userSelections = {};
	this.syncDebounced = ve.debounce( this.sync.bind( this ), 5000 );
	this.documentId = 'EXAMPLE';
	this.authorId = Math.random();
	this.prevSelection = null;

	if ( window.QUnit ) {
		return;
	}
	// Events
	this.doc.connect( this, {
		transact: 'onDocumentTransact'
	} );
	this.doc.connect( this, {
		select: this.syncDebounced
	} );

	this.syncInterval = 5000;
	this.sync();
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
	this.syncDebounced();
};

ve.dm.SurfaceSynchronizer.prototype.sync = function () {
	var selection = JSON.stringify( this.getSurface().getSelection() ),
		documentModel = this.getSurface().getDocument(),
		change = documentModel.getChangeSince( this.commitPointer );

	this.prevSelection = selection;
	$.ajax( '/applyChange', {
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify( {
			doc: this.documentId,
			author: this.authorId,
			change: change.serialize(),
		} ),
		dataType: 'json'
	} )
	.done( this.afterSync.bind( this, change ) );
	setTimeout( this.sync.bind( this ), this.syncInterval );
};

ve.dm.SurfaceSynchronizer.prototype.afterSync = function ( sent, data ) {
	var unsent,
		parallel = ve.dm.Change.static.deserialize( this.doc, data.parallel );

	if ( data.reverted ) {
		// Conflict: undo local change and history, then apply parallel change
		this.doc.getChangeSince( sent.start ).reversed().applyTo( this.surface );
		this.doc.completeHistory.splice( sent.start );
		parallel.applyTo( this.surface );
		this.commitPointer = this.doc.completeHistory.length;
		return;
	}
	// Else remote rebase succeeded
	remote = parallel.concat( sent.rebaseOnto( parallel ) );

	// Try to rebase incoming parallel changes over unsent transactions
	unsent = this.doc.getChangeSince( sent.start + sent.transactions.length );
	incoming = parallel.rebaseOnto( sent.concat( unsent ) );
	if ( !incoming ) {
		// Conflict: undo unsent, and set incoming history
		unsent.reversed().applyTo( this.surface );
		this.doc.completeHistory.splice( remote.start );
		remote.addToHistory( this.doc.completeHistory );
		this.commitPointer = this.doc.completeHistory.length;
		return;
	}

	// Else success: apply incoming, change to remote history, and sync unsent
	incoming.applyTo( this.surface );
	remote = parallel.concat( sent.rebaseOnto( parallel ) );
	this.doc.completeHistory.splice( sent.start );
	remote.addToHistory( this.doc.completeHistory );
	this.commitPointer = this.doc.completeHistory.length;

	unsentRebased = parallel
		.concat( sent.concat( unsent ).rebaseOnto( parallel ) )
		.slice( remote.transactions.length );
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
