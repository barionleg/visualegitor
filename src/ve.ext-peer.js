/*!
 * VisualEditor PeerJS extensions.
 *
 * @copyright 2011-2022 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Peer */

/**
 * Recursively serialize objects into plain data.
 *
 * Non-plain objects must have a .serialize or .toJSON method.
 *
 * @param {Object|Array} value The value to serialize
 * @return {Object|Array} The serialized version
 */
ve.serialize = function ( value ) {
	if ( Array.isArray( value ) ) {
		return value.map( function ( item ) {
			return ve.serialize( item );
		} );
	} else if ( value === null || typeof value !== 'object' ) {
		return value;
	} else if ( value.constructor === Object ) {
		var serialized = {};
		for ( var property in value ) {
			serialized[ property ] = ve.serialize( value[ property ] );
		}
		return serialized;
	} else if ( typeof value.serialize === 'function' ) {
		return ve.serialize( value.serialize() );
	} else if ( typeof value.toJSON === 'function' ) {
		return ve.serialize( value.toJSON() );
	}
	throw new Error( 'Cannot serialize ' + value );
};

ve.newPeer = function () {
	// To use the public PeerJS server:
	return new Peer();
	// To use a local PeerJS server:
	// return new Peer( undefined, { host: 'localhost', port: 9000, path: '/myapp' } );
	// To use a ve.FakePeer (for debugging):
	// return new ve.FakePeer();
};

ve.ui.Surface.prototype.initPeerServer = function () {
	var surface = this,
		completeHistory = this.model.documentModel.completeHistory;

	ve.dm.peerServer = new ve.dm.PeerTransportServer( completeHistory.getLength() );
	if ( completeHistory.getLength() > 0 ) {
		completeHistory.transactions[ 0 ].authorId = 1;
	}
	ve.dm.peerServer.protocolServer.rebaseServer.updateDocState(
		'doc123',
		1,
		ve.dm.Change.static.deserialize( completeHistory.serialize(), true ),
		completeHistory,
		{}
	);
	ve.dm.peerServer.peer = ve.newPeer();
	ve.dm.peerServer.peer.on( 'open', function ( id ) {
		/* eslint-disable-next-line no-console */
		console.log( 'Open. Now in another browser window, do:\nve.init.target.surface.initPeerClient( \'' + id + '\' );' );
		surface.initPeerClient( id, true );
	} );
	ve.dm.peerServer.peer.on( 'connection', function ( conn ) {
		ve.dm.peerServer.onConnection( conn );
	} );
};

ve.ui.Surface.prototype.initPeerClient = function ( serverId, isMain ) {
	var surface = this,
		completeHistory = this.model.documentModel.completeHistory,
		peerClient = ve.newPeer();
	if ( completeHistory.getLength() > 0 ) {
		completeHistory.transactions[ 0 ].authorId = 1;
	}
	// HACK: Disable redo command until supported (T185706)
	ve.ui.commandRegistry.unregister( 'redo' );

	if ( !isMain ) {
		ve.ui.commandRegistry.unregister( 'showSave' );
		// eslint-disable-next-line no-jquery/no-global-selector
		$( '.ve-ui-toolbar-saveButton' ).css( 'text-decoration', 'line-through' );
	}
	ve.init.target.constructor.static.toolbarGroups = ve.copy( ve.init.target.constructor.static.toolbarGroups );
	ve.init.target.constructor.static.toolbarGroups.push( { name: 'authorList', include: [ 'authorList' ] } );

	peerClient.on( 'open', function ( /* id */ ) {
		var conn = peerClient.connect( serverId );
		// On old js-BinaryPack (before https://github.com/peers/js-binarypack/pull/10 ),
		// you need JSON serialization, else it crashes on Unicode code points over U+FFFF
		// var conn = peerClient.connect( serverId, { serialization: 'json' } );
		conn.on( 'open', function () {
			surface.model.createSynchronizer( 'foo', { peerConnection: conn } );
			surface.model.synchronizer.commitLength = completeHistory.getLength();
			surface.model.synchronizer.sentLength = completeHistory.getLength();
			surface.model.synchronizer.once( 'initDoc', function ( error ) {
				if ( error ) {
					OO.ui.alert(
						// eslint-disable-next-line no-jquery/no-append-html
						$( '<p>' ).append(
							ve.htmlMsg( 'visualeditor-rebase-corrupted-document-error', $( '<pre>' ).text( error.stack ) )
						),
						{ title: ve.msg( 'visualeditor-rebase-corrupted-document-title' ), size: 'large' }
					);
					return;
				}
				ve.init.target.getToolbar().setup(
					ve.init.target.constructor.static.toolbarGroups,
					ve.init.target.surface
				);
			} );
			surface.view.connectModelSynchronizer();
		} );
	} );
};

ve.ce.Surface.prototype.connectModelSynchronizer = function () {
	this.model.synchronizer.connect( this, {
		authorSelect: 'onSynchronizerAuthorUpdate',
		authorChange: 'onSynchronizerAuthorUpdate',
		authorDisconnect: 'onSynchronizerAuthorDisconnect',
		wrongDoc: 'onSynchronizerWrongDoc',
		pause: 'onSynchronizerPause'
	} );
};

ve.ui.CollabProcessDialog = function VeUiCollabProcessDialog( config ) {
	ve.ui.CollabProcessDialog.super.call( this, config );
};

OO.inheritClass( ve.ui.CollabProcessDialog, OO.ui.ProcessDialog );

ve.ui.CollabProcessDialog.static.name = 'collabDialog';
ve.ui.CollabProcessDialog.static.title = 've.collab: real-time collaborative editing';
ve.ui.CollabProcessDialog.static.actions = [
	{
		label: 'Close',
		flags: 'safe'
	}
];

ve.ui.CollabProcessDialog.prototype.initialize = function () {
	ve.ui.CollabProcessDialog.super.prototype.initialize.apply( this, arguments );

	this.content = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );
	this.hostButton = new OO.ui.ButtonWidget( {
		label: 'Host a new session',
		icon: 'userAdd',
		title: 'Host'
	} );
	this.hostButton.$element[ 0 ].firstElementChild.style.minWidth = '100%';
	this.hostLabel = new OO.ui.LabelWidget( { label: 'The session is hosted in your browser, and ends when you publish (or close your tab).' } );

	this.joinButton = new OO.ui.ButtonWidget( {
		label: 'Join someone else’s session',
		icon: 'userGroup',
		title: 'Join'
	} );
	this.joinButton.$element[ 0 ].firstElementChild.style.minWidth = '100%';
	this.joinLabel = new OO.ui.LabelWidget( { label: 'They are responsible for publishing changes.' } );
	this.legalLabel = new OO.ui.LabelWidget( { label: $( '<span><b>Warning</b>: ve.collab uses WebRTC. Collaborators, and their internet service providers, may see your IP address and other de-anonymizing information. By collaborating, you agree to the <a href="https://foundation.wikimedia.org/wiki/Terms_of_Use">Terms of Use</a>, and you irrevocably agree to release your changes under the <a href="https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License">CC BY-SA 3.0 License</a> and the <a href="https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_GNU_Free_Documentation_License">GFDL</a>. You agree that a hyperlink or URL is sufficient attribution under the Creative Commons license.</span>' ) } );
	this.legalLabel.$element[ 0 ].style.gridColumn = '1 / 3';
	this.content.$element.append(
		$( '<div>' ).css( { display: 'grid', 'grid-template-columns': '1fr 10fr', gap: '1em' } ).append(
			this.hostButton.$element,
			this.hostLabel.$element,
			this.joinButton.$element,
			this.joinLabel.$element,
			this.legalLabel.$element
		)
	);
	this.$body.append( this.content.$element );
	this.hostButton.on( 'click', this.close.bind( this, 'host' ) );
	this.joinButton.on( 'click', this.close.bind( this, 'join' ) );
};

ve.ui.CollabProcessDialog.prototype.getBodyHeight = function () {
	return this.content.$element.outerHeight( true );
};

ve.ui.windowFactory.register( ve.ui.CollabProcessDialog );

ve.collab = function () {
	ve.init.target.surface.dialogs.openWindow( 'collabDialog' ).closing.then( function ( val ) {
		if ( !val ) {
			return;
		}
		if ( val === 'join' ) {
			OO.ui.prompt(
				'Enter session URL to join',
				{
					textInput: {
						placeholder: '[session-url-goes-here]',
						value: location.hash.match( /^#collabSession=/ ) ?
							location.toString() :
							''
					},
					size: 'medium'
				}
			).then( function ( sessionUrlText ) {
				var sessionUrl = new URL( sessionUrlText );
				debugger;
				var m = sessionUrl.hash.match( /^#collabSession=(.*)/ );
				if (
					!m ||
					sessionUrl.protocol !== location.protocol ||
					sessionUrl.host !== location.host ||
					sessionUrl.pathname !== location.pathname
				) {
					OO.ui.alert( 'Session URL does not match this page' );
					return;
				}
				var sessionId = m[ 1 ];
				ve.init.target.surface.initPeerClient( sessionId );
			} );
			return;
		}
		// else val is 'host'
		ve.init.target.surface.initPeerServer();
		var url = location.protocol + '//' + location.host + location.pathname;
		ve.dm.peerServer.peer.on( 'open', function ( newId ) {
			var copyTextLayout = new ve.ui.CopyTextLayout( {
				copyText: url + '#collabSession=' + newId
			} );
			OO.ui.alert( copyTextLayout.$element, {
				title: 'Share this session URL',
				size: 'medium'
			} );
		} );
	} );
};

/**
 * TODO: Remove this code once OO.ui.CopyTextLayout is merged
 *
 * CopyTextLayout is an action field layout containing some readonly text and a button to copy
 * it to the clipboard.
 *
 * @class
 * @extends OO.ui.ActionFieldLayout
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {string} copyText Text to copy, can also be provided as textInput.value
 * @cfg {Object} textInput Config for text input
 * @cfg {Object} button Config for button
 */
ve.ui.CopyTextLayout = function VeUiCopyTextLayout( config ) {
	var TextClass;
	config = config || {};

	// Properties
	TextClass = config.multiline ? OO.ui.MultilineTextInputWidget : OO.ui.TextInputWidget;
	this.textInput = new TextClass( $.extend( {
		value: config.copyText,
		readOnly: true
	}, config.textInput ) );
	this.button = new OO.ui.ButtonWidget( $.extend( {
		label: 'Copy',
		icon: 'articles'
	}, config.button ) );

	// Parent constructor
	ve.ui.CopyTextLayout.super.call( this, this.textInput, this.button, config );

	// HACK: When using a multiline text input, remove classes which connect widgets
	if ( config.multiline ) {
		this.$input.removeClass( 'oo-ui-actionFieldLayout-input' );
		this.$button
			.removeClass( 'oo-ui-actionFieldLayout-button' )
			.addClass( 'oo-ui-copyTextLayout-multiline-button' );
	}

	// Events
	this.button.connect( this, { click: 'onButtonClick' } );
	this.textInput.$input.on( 'focus', this.onInputFocus.bind( this ) );

	this.$element.addClass( 'oo-ui-copyTextLayout' );
};

/* Inheritance */

OO.inheritClass( ve.ui.CopyTextLayout, OO.ui.ActionFieldLayout );

/* Events */

/**
 * When the user has executed a copy command
 *
 * @event copy
 * @param {boolean} Whether the copy command succeeded
 */

/* Methods */

/**
 * Handle button click events
 *
 * @fires copy
 */
ve.ui.CopyTextLayout.prototype.onButtonClick = function () {
	var copied;

	this.selectText();

	try {
		copied = document.execCommand( 'copy' );
	} catch ( e ) {
		copied = false;
	}
	this.emit( 'copy', copied );
};

/**
 * Handle text widget focus events
 */
ve.ui.CopyTextLayout.prototype.onInputFocus = function () {
	if ( !this.selecting ) {
		this.selectText();
	}
};

/**
 * Select the text to copy
 */
ve.ui.CopyTextLayout.prototype.selectText = function () {
	var input = this.textInput.$input[ 0 ],
		scrollTop = input.scrollTop,
		scrollLeft = input.scrollLeft;

	this.selecting = true;
	this.textInput.select();
	this.selecting = false;

	// Restore scroll position
	input.scrollTop = scrollTop;
	input.scrollLeft = scrollLeft;
};
