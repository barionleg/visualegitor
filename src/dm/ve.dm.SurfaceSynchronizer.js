/*!
 * VisualEditor DataModel SurfaceSynchronizer class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */
/* global io */

/**
 * DataModel surface synchronizer.
 *
 * @class
 * @mixins OO.EventEmitter
 * @mixins ve.dm.RebaseClient
 *
 * @constructor
 * @param {ve.dm.Surface} surface Surface model to synchronize
 * @param {string} documentId Document ID
 * @param {Object} [config] Configuration options
 * @cfg {string} [server] IO server
 * @cfg {string} [defaultName] Default username
 */
ve.dm.SurfaceSynchronizer = function VeDmSurfaceSynchronizer( surface, documentId, config ) {
	var path, options, authorData;

	config = config || {};

	// Mixin constructors
	OO.EventEmitter.call( this );
	ve.dm.RebaseClient.call( this );

	// Properties
	this.surface = surface;
	this.doc = surface.documentModel;
	this.store = this.doc.getStore();
	this.authors = {};
	this.authorSelections = {};
	this.documentId = documentId;
	this.defaultName = config.defaultName;

	// Whether the document has been initialized
	this.initialized = false;
	// Whether we are currently synchronizing the model
	this.applying = false;
	this.token = null;
	this.loadSessionKey();

	// SocketIO events
	path = ( config.server || '' );
	options = { query: {
		docName: this.documentId,
		authorId: this.getAuthorId() || '',
		token: this.token || ''
	} };
	this.socket = io( path, options );
	// HACK: SocketIO caches the options from the last request.
	// Connecting twice appears to overwrite this cache.
	// See https://github.com/socketio/socket.io/issues/1677
	this.socket.disconnect();
	this.socket = io( path, options );
	this.socket.on( 'registered', this.onRegistered.bind( this ) );
	this.socket.on( 'initDoc', this.onInitDoc.bind( this ) );
	this.socket.on( 'newChange', this.onNewChange.bind( this ) );
	this.socket.on( 'authorChange', this.onAuthorChange.bind( this ) );
	this.socket.on( 'authorDisconnect', this.onAuthorDisconnect.bind( this ) );

	authorData = ve.init.platform.getSessionObject( 've-collab-author' );
	if ( authorData ) {
		this.changeAuthor( authorData );
	}

	// Events
	this.doc.connect( this, {
		transact: 'onDocumentTransact'
	} );

	this.surface.connect( this, {
		select: 'onSurfaceSelect'
	} );

	this.submitChangeThrottled = ve.debounce( ve.throttle( this.submitChange.bind( this ), 250 ), 0 );
};

/* Inheritance */

OO.mixinClass( ve.dm.SurfaceSynchronizer, OO.EventEmitter );
OO.mixinClass( ve.dm.SurfaceSynchronizer, ve.dm.RebaseClient );

/* Events */

/**
 * @event authorSelect
 * @param {number} authorId The author whose selection has changed
 */

/**
 * @event authorChange
 * @param {number} authorId The author whose data has changed
 */

/**
 * @event wrongDoc
 */

/**
 * @event initDoc
 */

/**
 * @event disconnect
 */

/* Methods */

/**
 * Destroy the synchronizer
 */
ve.dm.SurfaceSynchronizer.prototype.destroy = function () {
	this.socket.disconnect();
	this.doc.disconnect( this );
	this.surface.disconnect( this );
	this.initialized = false;
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.getChangeSince = function ( start, toSubmit ) {
	var change = this.doc.getChangeSince( start ),
		selection = this.surface.getSelection();
	if ( !selection.equals( this.lastSubmittedSelection ) ) {
		change.selections[ this.getAuthorId() ] = selection;
		if ( toSubmit ) {
			this.lastSubmittedSelection = selection;
		}
	}
	return change;
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.submitChange = function () {
	// Prevent submission before initialization is complete
	if ( !this.initialized ) {
		return;
	}
	// Parent method
	ve.dm.RebaseClient.prototype.submitChange.apply( this, arguments );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.sendChange = function ( backtrack, change ) {
	this.socket.emit( 'submitChange', {
		backtrack: this.backtrack,
		change: change.serialize()
	} );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.applyChange = function ( change ) {
	var authorId;
	// Author selections are superseded by change.selections, so no need to translate them
	for ( authorId in change.selections ) {
		authorId = +authorId;
		delete this.authorSelections[ authorId ];
	}
	change.applyTo( this.surface );
	// HACK: After applyTo(), the selections are wrong and applying them could crash.
	// The only reason this doesn't happen is because everything that tries to do that uses setTimeout().
	// Translate the selections that aren't going to be overwritten by change.selections
	this.applyNewSelections( this.authorSelections, change );
	// Apply the overwrites from change.selections
	this.applyNewSelections( change.selections );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.unapplyChange = function ( change ) {
	change.unapplyTo( this.surface );
	// Translate all selections for what we just unapplied
	// HACK: After unapplyTo(), the selections are wrong and applying them could crash.
	// The only reason this doesn't happen is because everything that tries to do that uses setTimeout().
	this.applyNewSelections( this.authorSelections, change.reversed() );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.addToHistory = function ( change ) {
	change.addToHistory( this.doc );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.removeFromHistory = function ( change ) {
	change.removeFromHistory( this.doc );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.logEvent = function ( event ) {
	// Serialize the event data and pass it on to the server for logging
	var key,
		ob = {};
	if ( !this.initialized ) {
		// Do not log before initialization is complete; this prevents us from logging the entire
		// document history during initialization
		return;
	}
	ob.sendTimestamp = Date.now();
	for ( key in event ) {
		if ( event[ key ] instanceof ve.dm.Change ) {
			ob[ key ] = event[ key ].serialize();
		} else {
			ob[ key ] = event[ key ];
		}
	}
	this.socket.emit( 'logEvent', ob );
};

/**
 * Respond to transactions happening on the document. Ignores transactions applied by
 * SurfaceSynchronizer itself.
 *
 * @param {ve.dm.Transaction} tx Transaction that was applied
 */
ve.dm.SurfaceSynchronizer.prototype.onDocumentTransact = function ( tx ) {
	if ( this.applying || !this.initialized ) {
		// Ignore our own synchronization or initialization transactions
		return;
	}
	// HACK annotate transaction with authorship information
	// This relies on being able to access the transaction object by reference;
	// we should probably set the author deeper in dm.Surface or dm.Document instead.
	tx.authorId = this.authorId;
	// TODO deal with staged transactions somehow
	this.applyNewSelections( this.authorSelections, tx );
	this.submitChangeThrottled();
};

/**
 * Respond to selection changes.
 */
ve.dm.SurfaceSynchronizer.prototype.onSurfaceSelect = function () {
	this.submitChangeThrottled();
};

/**
 * Translate incoming selections by change, then apply them and fire authorSelect
 *
 * @param {Object} newSelections Each author (key) maps to a new incoming ve.dm.Selection
 * @param {ve.dm.Change|ve.dm.Transaction} [changeOrTx] Object to translate over, if any
 * @fires authorSelect
 */
ve.dm.SurfaceSynchronizer.prototype.applyNewSelections = function ( newSelections, changeOrTx ) {
	var authorId, translatedSelection,
		change = changeOrTx instanceof ve.dm.Change ? changeOrTx : null,
		tx = changeOrTx instanceof ve.dm.Transaction ? changeOrTx : null;
	for ( authorId in newSelections ) {
		authorId = +authorId;
		if ( authorId === this.authorId ) {
			continue;
		}
		if ( change ) {
			translatedSelection = newSelections[ authorId ].translateByChange( change, authorId );
		} else if ( tx ) {
			translatedSelection = newSelections[ authorId ].translateByTransactionWithAuthor( tx, authorId );
		} else {
			translatedSelection = newSelections[ authorId ];
		}
		if ( !translatedSelection.equals( this.authorSelections[ authorId ] ) ) {
			// This works correctly even if newSelections === this.authorSelections
			this.authorSelections[ authorId ] = translatedSelection;
			this.emit( 'authorSelect', authorId );
		}
	}
};

/**
 * Get author data object
 * @param {number} authorId Author ID
 * @return {Object} Author object, containing 'name' and 'color'
 */
ve.dm.SurfaceSynchronizer.prototype.getAuthorData = function ( authorId ) {
	return this.authors[ authorId ];
};

ve.dm.SurfaceSynchronizer.prototype.onAuthorChange = function ( data ) {
	this.authors[ data.authorId ] = data.authorData;
	this.emit( 'authorChange', data.authorId );

	if ( data.authorId === this.getAuthorId() ) {
		ve.init.platform.setSessionObject( 've-collab-author', data.authorData );
	}
};

ve.dm.SurfaceSynchronizer.prototype.changeAuthor = function ( data ) {
	this.socket.emit( 'changeAuthor', ve.extendObject( {}, this.getAuthorData( this.getAuthorId() ), data ) );
};

ve.dm.SurfaceSynchronizer.prototype.onAuthorDisconnect = function ( authorId ) {
	delete this.authors[ authorId ];
	delete this.authorSelections[ authorId ];
	this.emit( 'authorDisconnect', authorId );
};

/**
 * Respond to a "registered" event from the server
 *
 * @param {Object} data
 * @param {number} data.authorId The author ID allocated by the server
 * @param {string} data.token
 */
ve.dm.SurfaceSynchronizer.prototype.onRegistered = function ( data ) {
	if ( this.token && this.token !== data.token ) {
		this.socket.disconnect();
		this.emit( 'wrongDoc' );
		return;
	}
	this.setAuthorId( data.authorId );
	this.surface.setAuthorId( this.authorId );
	this.token = data.token;
	this.saveSessionKey();
};

ve.dm.SurfaceSynchronizer.prototype.saveSessionKey = function () {
	ve.init.platform.setSessionObject( 'visualeditor-session-key', {
		docName: this.documentId,
		authorId: this.getAuthorId(),
		token: this.token
	} );
};

ve.dm.SurfaceSynchronizer.prototype.loadSessionKey = function () {
	var data = ve.init.platform.getSessionObject( 'visualeditor-session-key' );
	if ( data && data.docName === this.documentId ) {
		this.setAuthorId( data.authorId );
		this.token = data.token;
	}
};

/**
 * Respond to an initDoc event from the server, catching us up on the prior history of the document.
 *
 * @param {Object} data
 * @param {Object} data.history Serialized change representing the server's history
 * @param {Object} data.authors Object mapping author IDs to author data objects (name/color)
 */
ve.dm.SurfaceSynchronizer.prototype.onInitDoc = function ( data ) {
	var history, authorId;
	if ( this.initialized ) {
		// Ignore attempt to initialize a second time
		return;
	}
	for ( authorId in data.authors ) {
		this.onAuthorChange( {
			authorId: +authorId,
			authorData: data.authors[ authorId ]
		} );
	}
	history = ve.dm.Change.static.deserialize( data.history, this.doc );
	this.acceptChange( history );
	this.emit( 'initDoc' );

	// Mark ourselves as initialized and retry any prevented submissions
	this.initialized = true;
	this.submitChangeThrottled();
};

/**
 * Respond to a newChange event from the server, signalling a newly committed change
 *
 * If the commited change is by another author, then:
 * - Rebase uncommitted changes over the committed change
 * - If there is a rebase rejection, then apply its inverse to the document
 * - Apply the rebase-transposed committed change to the document
 * - Rewrite history to have the committed change followed by rebased uncommitted changes
 *
 * If the committed change is by the local author, then it is already applied to the document
 * and at the correct point in the history: just move the commit pointer.
 *
 * @param {Object} serializedChange Serialized ve.dm.Change that the server has applied
 */
ve.dm.SurfaceSynchronizer.prototype.onNewChange = function ( serializedChange ) {
	var change = ve.dm.Change.static.deserialize( serializedChange, this.doc );
	// Make sure we don't attempt to submit any of the transactions we commit while manipulating
	// the state of the document
	this.applying = true;
	try {
		this.acceptChange( change );
	} finally {
		this.applying = false;
	}
	// Schedule submission of unsent local changes, if any
	this.submitChangeThrottled();
};

ve.dm.SurfaceSynchronizer.prototype.onDisconnect = function () {
	this.initialized = false;
	this.emit( 'disconnect' );
};
