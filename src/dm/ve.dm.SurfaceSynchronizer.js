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
	this.isLeader = false;
	this.rebaser = new ve.dm.Rebaser( surface );
	this.surface = surface;
	this.doc = surface.documentModel;
	// Used by leader only, to record the resolved height synced for each user
	this.userResolvedPointer = {};
	this.sentPointer = 0;
	// Used by non-leader only, to record the received commit height
	this.committedPointer = 0;
	this.userSelections = {};
	this.prevSelection = null;
	this.queuedAjax = null; // { url: x, settings: x, deferred: x, next: x }
	this.pushDebounced = ve.debounce( this.push.bind( this ), 500 );
	this.documentId = 'EXAMPLE';
	this.userId = Math.random();

	if ( window.QUnit ) {
		return;
	}
	// Events
	this.doc.connect( this, {
		transact: 'onDocumentTransact'
	} );
	this.doc.connect( this, {
		select: this.pushDebounced
	} );

	this.pullInterval = 500;
	this.pull();
};

/* Inheritance */

OO.mixinClass( ve.dm.SurfaceSynchronizer, OO.EventEmitter );

/* Methods */

/**
 * @param {boolean} Whether this synchronizer shall lead the collaboration group
 */
ve.dm.SurfaceSynchronizer.prototype.setLeader = function ( isLeader ) {
	this.isLeader = isLeader;
};

ve.dm.SurfaceSynchronizer.prototype.getSurface = function () {
	return this.surface;
};

ve.dm.SurfaceSynchronizer.prototype.onDocumentTransact = function ( tx ) {
	var userId;
	for ( userId in this.userSelections ) {
		this.userSelections[ userId ].selection = this.userSelections[ userId ].selection.translateByTransaction( tx );
	}
	this.pushDebounced();
};

ve.dm.SurfaceSynchronizer.prototype.startAjax = function ( queuedAjax ) {
	var surfaceSynchronizer = this,
		deferred = queuedAjax.deferred;

	$.ajax( queuedAjax.url, queuedAjax.settings )	
		.done( deferred.done )
		.fail( deferred.fail )
		.always( function () {
			deferred.always();
			if ( queuedAjax.next ) {
				startAjax( queuedAjax.next );
			} else {
				this.queuedAjax = null;
			}
		} );
};

ve.dm.SurfaceSynchronizer.prototype.queueAjax = function ( url, settings ) {
	var surfaceSynchronizer = this,
		deferred = $.Deferred(),
		lastQueuedAjax = this.queuedAjax;

	this.queuedAjax = {
		url: url,
		settings: settings,
		deferred: deferred,
		next: null
	};

	if ( lastQueuedAjax ) {
		lastQueuedAjax.next = this.queuedAjax;
	} else {
		this.startAjax( this.queuedAjax );
	}
	return deferred;
};

ve.dm.SurfaceSynchronizer.prototype.queueMessage = function ( message ) {
	return this.queueAjax( 'collab.php?' + message.type, {
		type: 'POST',
		dataType: 'json',
		data: {
			documentId: message.documentId,
			authorId: message.userId,
			change: change.toJson(),
			selection: JSON.stringify( selection )
		}
	} );
};

ve.dm.SurfaceSynchronizer.prototype.push = function () {
	var url,
		selection = JSON.stringify( this.getSurface().getSelection() ),
		documentModel = this.getSurface().getDocument(),
		change = documentModel.getChangeSince( this.sentPointer );

	if ( change.transactions.length === 0 && (
		( !selection && !this.prevSelection ) ||
		( selection && selection.equals( this.prevSelection ) )
	) ) {
		return;
	}
	this.prevSelection = selection;
	this.queueMessage( new ve.dm.SyncMessage( {
		type: this.isLeader ? 'pushCommitted' : 'pushUncommitted',
		documentId: this.documentId,
		authorId: this.userId,
		change: change,
		selection: selection
	} );
};

ve.dm.SurfaceSynchronizer.prototype.pull = function () {
	var isLeader = this.isLeader,
		pull = this.pull.bind( this ),
		pullInterval = this.pullInterval;

	this.queueMessage( new ve.dm.SyncMessage( {
		type: isLeader ? 'pullUncommitted' : 'pullCommitted',
		documentId: this.documentId,
		start: this.committedPointer
	} ) ).done( function ( data ) {
		if ( isLeader ) {
			this.applyUncommittedChange( data );
		} else {
			this.applyCommittedChange( data );
		}
		setTimeout( pull, pullInterval );
	} );
};

ve.dm.SurfaceSynchronizer.prototype.applyUncommittedChange = function ( data ) {
	var resolved,
		change = ve.dm.Change.static.fromJson( data.change );

	resolved = this.rebaser.applyUncommittedChange( change );
	this.queueMessage( new ve.dm.SyncMessage( {
		type: 'pushCommitted',
		documentId: this.documentId,
		authorId: change.authorId,
		change: (
			resolved ?
			this.doc.getChangeSince( change.start ).concat( resolved ) :
			this.doc.getChangeSince( change.start )
		),
		original: {
			authorId: change.authorId,
			start: change.start,
			length: change.length,
			resolved: !!resolved
		}
	} );
};

ve.dm.SurfaceSynchronizer.prototype.applyCommittedChange = function ( data ) {
	var resolved,
		change = ve.dm.Change.static.fromJson( data.change );

	resolved = this.rebaser.applyCommittedChange( change );
	if ( resolved.transactions.length === 0 ) {
		return;
	}
	this.committedPointer = this.doc.getCompleteHistoryLength();
	this.queueMessage( new ve.dm.SyncMessage( {
		type: 'pushUncommitted',
		documentId: this.documentId,
		authorId: change.authorId,
		change: this.doc.getChangeSince( change.start ).concat( resolved ),
	} );
};

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
