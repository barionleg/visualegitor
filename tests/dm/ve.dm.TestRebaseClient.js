/*!
 * VisualEditor DataModel TestRebaseClient class
 *
 * @copyright 2011-2017 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Rebase client used for testing
 *
 * @class
 * @extends ve.dm.RebaseClient
 *
 * @constructor
 * @param {ve.dm.RebaseServer} server Rebase server
 * @param {Array} sharedIncoming Used for state synchronization between clients; create an
 *  empty array and pass the same array to all clients
 */
ve.dm.TestRebaseClient = function VeDmTestRebaseClient( server, sharedIncoming ) {
	ve.dm.RebaseClient.apply( this );
	this.server = server;
	this.sharedIncoming = sharedIncoming; // TODO use server.incoming instead of shared param?
	this.incomingPointer = 0;
	this.outgoing = [];
	this.outgoingPointer = 0;
	this.history = new ve.dm.Change( 0, [], [], {} );
	this.trueHistory = [];
	this.clear();
};

OO.initClass( ve.dm.TestRebaseClient );
OO.mixinClass( ve.dm.TestRebaseClient, ve.dm.RebaseClient );

ve.dm.TestRebaseClient.prototype.historySummary = function () {
	return ve.dm.testHistorySummary( this.history, this.commitLength, this.sentLength );
};

ve.dm.TestRebaseClient.prototype.getChangeSince = function ( start ) {
	return this.history.mostRecent( start );
};

ve.dm.TestRebaseClient.prototype.sendChange = function ( backtrack, change ) {
	this.outgoing.push( { backtrack: backtrack, change: change } );
	this.lastSubmission = { backtrack: backtrack, change: change };
};

ve.dm.TestRebaseClient.prototype.applyChange = function ( change ) {
	var author = this.getAuthor();
	change.transactions.forEach( function ( transaction ) {
		if ( transaction.author === null ) {
			transaction.author = author;
		}
	} );
	this.history.push( change );
	this.trueHistory.push( { change: change, reversed: false } );

	if ( this.appliedChange ) {
		this.appliedChange.push( change );
	} else {
		this.appliedChange = change;
	}
};

ve.dm.TestRebaseClient.prototype.unapplyChange = function ( change ) {
	this.history.pop( change.getLength() );
	this.trueHistory.push( { change: change, reversed: true } );
};

ve.dm.TestRebaseClient.prototype.addToHistory = function ( change ) {
	this.history.push( change );
	if ( this.addedHistory ) {
		this.addedHistory.push( change );
	} else {
		this.addedHistory = change;
	}
};

ve.dm.TestRebaseClient.prototype.removeFromHistory = function ( change ) {
	this.history.pop( change.getLength() );
	if ( this.removedHistory ) {
		this.removedHistory = change.concat( this.removedHistory );
	} else {
		this.removedHistory = change;
	}
};

ve.dm.TestRebaseClient.prototype.deliverOne = function () {
	var item, rebased;
	item = this.outgoing[ this.outgoingPointer++ ];
	rebased = this.server.applyChange( 'foo', this.getAuthor(), item.backtrack, item.change );
	if ( !rebased.isEmpty() ) {
		this.sharedIncoming.push( rebased );
	}
};

ve.dm.TestRebaseClient.prototype.receiveOne = function () {
	this.acceptChange( this.sharedIncoming[ this.incomingPointer++ ] );
};

ve.dm.TestRebaseClient.prototype.getAppliedChange = function () {
	return this.appliedChange;
};

ve.dm.TestRebaseClient.prototype.getRemovedHistory = function () {
	return this.removedHistory;
};

ve.dm.TestRebaseClient.prototype.getAddedHistory = function () {
	return this.addedHistory;
};

ve.dm.TestRebaseClient.prototype.getLastSubmission = function () {
	return this.lastSubmission;
};

ve.dm.TestRebaseClient.prototype.clear = function () {
	this.appliedChange = null;
	this.removedHistory = null;
	this.addedHistory = null;
	this.lastSubmission = { backtrack: null, change: null };
};
