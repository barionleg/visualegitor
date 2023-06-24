/*!
 * VisualEditor PeerJS extensions.
 *
 * @copyright 2011-2023 VisualEditor Team and others; see http://ve.mit-license.org
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
ve.ui.CollabProcessDialog.static.title = OO.ui.deferMsg( 'visualeditor-collab-dialog-title' );

ve.ui.CollabProcessDialog.static.imageUri = 'data:image/gif;base64,R0lGODlh/QCQAMZZAOhXyOlhywCvieprzxG0kOltzut00SC4lz7BpT3Cpe2I2E/GrE7HrO2U2++e3W3PuvCo4XzTwMfM0MrO0v/LM5vd0MvP083R1c7S1tDU2NDU2tHV2dPX2/7VWP7XZdba3dba3vTQ7fTR7dnd4Pvdfd3f4tzg4tzg4+Di5eDi5vXb8PXb8d/j5d/j5vvilfvil/rjluPl6OLm6Pvlo+bn6ubo6ubo6/rnsProrvvor/bl89nv7Onq7dnw7Onr7enr7vrqvPrrvOzt8Ozu8PruyO/w8u/w8/nw1e/x8+j08/jv9+n08/Lz9fnz4fL09fX29/X2+Pr27fj5+vn6+/r7+/r8/Pz8/Pz9/f7+/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yH5BAEKAH8ALAAAAAD9AJAAAAf+gFmCg4SFhoeIiYqLjI2Oj5CRkpOUlZaDWFZTUpydnp+goaKjpKWmp6ipqqusra6vpFNWWIVYm7C4ubq7vL2+v7G0g7fAxcbHyMnKoVPCV8vQ0dLT1KBWglTV2tvc3a1UgsTe4+Tl2uHm6errxejs7/Dxqe7y9fb19Pf6++X5/P8Ap/kLSLBguyziDCpcmGsgw4cQTzmMSLFip4kWMz7EqLFjQY4eQ/IDKbIkPoQmUwIkqbKlOZYuY3aDKbMmNZo2cy7DiQoKk59AgwodSrRoUSiljCpdyhRo0qZQo0plmoynqRQSsmrdyrWr169gJZgQVQRD2LNo0WJgEgoKh7T+cOPKTYvhxzGrpGrM3Zs2RiizfAN75RCqhODDiL1aQHowIS7DiRGDACUkcmK2nzJY3iy4hjG8o7By5jsCFJPRgUO9Rc0a7ZDPKHk9udAa7gTMn0bUhssi1JDdwLdquBubF5MRHJIrX868ufPnz0cUGWUDuvXr2JN/sDHKyIfs4MOLv/6hBePGOtN7A62+vS727uO7gi+//rzi9vP/oq+/Pyj+/gUoBYAC9kdggfkdiGB9Ci4YX4MOtgdhhOlNSGFODUZxgwscdujhhyCGKOKIJJZo4okopqgiEKNAQQMKMMYo44w01lijEMgoGEUHFPTo449ABinkkEQWaeSRSCb+qeSSPb7Q1gbBSYACcY7BggOTWGap5ZZcdnkEKHpFKYERsFX5CgldpqnmmmwqGQQouonpQ5m9zNDmnXjmyWUToMQgpgS47YefLh7oaeihiP4IgyirAdcbnb4QkcOklFZq6aWYZqrpppx26umnoIZKBClD2GDqqaimquqqq75G5YWwhmJhrDHNSmtLtt6aUq66lsRrryH9CmxHwg6bUbHGVoRsshEty+xGgz7rn7PSKkRttR9Fi4sKCgzg7bfghivuuOSWa+656H5rQAM6kAXCBfDGK++89NZr77345qtvvhwEKqiZrugQAAAEF2zwwQgnrPDCDDfsMMIGhMKEBX/+VoyWBUhAuosDD3fs8ccgN7wCKJBZbPJXJWisC8cht+zyywmHAOfJNHdVGnq8iADzzjx/XIASoPxW89AScIczLxAU0PPSTBtswMihtEAb0RZPIMOrv+ig9dZcd+3112CHLfbYZHNtihNop6322my37fbbcMctd9xVaYstg3bf/WDeekvId98V/g04hoIPXtO1ht+DeOInAcz44YU/rtLikr9DeeXrXI55OhD61FQpnk8l+uikA3WeKD2krvrqrLfu+uuwxy57EjlGnkoMFNPlbyclU43aWKHsgIAAxBdv/PHIJ6/88sw3LwADO6iciw9zYRBKmL63NiUoBzjv/ff+4IOPgPSP7bV7o9mjRtgnPYTv/vvwE0A+LKLJdTonIKTf2vqeLAH//wBk3gHm94qJyeUEvtEfa+wCigcE8IEQjAABC4gc7JRnFEz4zng2yMEOLucDrgpFBRJAwhKa8IQoTKEKV8jCFi6gAljbHOEcJ0OTaK6G47ghDmdiux1aRIc+PEcPg9isIRIRWjQ84g+NqERrMbGJ2UoiFCECxCkqo4pWrJ0UV8EDG3nxi2AMoxjHSMYymvGMaEwjCmKwu140CEoKjKMcD4OxCbYCe3PMox7Twr9/9SJOewykILtiR1b4aZCIFGQGCrmKJ2gmkZCU4wSmczRe+ECNmMykJjf+yclOktEG9/MFFrPISFI6cYumJMgoUynKJ7LSHqt85S5iKcuGuLKW8KAlLl+hy122ope+XAUwg3kfVBIzHsM8pikadBwPOvOZI2ijFJhwgmda85rYfA4IpPmeW5omd5HEQCilAJhIVswC3MSFgnoXSb98gnrmNFnKgLHOeGZle57Aoz2jdDM/8kJo8dzdE8C5z+AYzZ+8aMEEImk1UfhgagWtTUMryYu5WfSiGHXb2TLK0Y569KNwGycvkqlMUpC0pKI4KUr/482VckOlLr1IS2NaDUFUgQo4zalOd8rTnvr0p0ANqlCHStSiGvWoSE2qUpea1Es49alQjapUp0oF1aouIhAAOw==';

ve.ui.CollabProcessDialog.prototype.initialize = function () {
	ve.ui.CollabProcessDialog.super.prototype.initialize.apply( this, arguments );

	this.content = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );
	this.hostButton = new OO.ui.ButtonWidget( {
		label: OO.ui.msg( 'visualeditor-collab-hostbutton-label' ),
		icon: 'userAdd',
		title: 'Host',
		flags: [ 'primary', 'progressive' ]
	} );
	this.hostButton.$element[ 0 ].firstElementChild.style.minWidth = '100%';
	this.joinButton = new OO.ui.ButtonWidget( {
		label: OO.ui.msg( 'visualeditor-collab-joinbutton-label' ),
		icon: 'userGroup',
		title: 'Join'
	} );
	this.joinButton.$element[ 0 ].firstElementChild.style.minWidth = '100%';
	this.content.$element.append(
		$( '<img>' ).prop( 'src', ve.ui.CollabProcessDialog.static.imageUri )
			.css( { display: 'block', margin: '2em auto' } ),
		$( '<p>' ).text( OO.ui.msg( 'visualeditor-collab-dialog-summary' ) )
			.css( { 'font-weight': 'bold' } ),
		$( '<p>' ).text( OO.ui.msg( 'visualeditor-collab-dialog-sharing' ) ),
		$( '<p>' ).text( OO.ui.msg( 'visualeditor-collab-dialog-sessionend' ) ),
		$( '<p>' ).text( OO.ui.msg( 'visualeditor-collab-dialog-privacy' ) ),
		$( '<div>' ).css( { display: 'grid', 'grid-template-columns': '10fr 10fr', gap: '1em' } ).append(
			this.joinButton.$element,
			this.hostButton.$element
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
				OO.ui.msg( 'visualeditor-collab-url-prompt' ),
				{
					textInput: {
						placeholder: OO.ui.msg( 'visualeditor-collab-url-placeholder' ),
						value: location.hash.match( /^#collabSession=/ ) ?
							location.toString() :
							''
					},
					size: 'medium'
				}
			).then( function ( sessionUrl ) {
				var serverId = ve.collab.validateSessionUrl( sessionUrl );
				if ( !serverId ) {
					OO.ui.alert( OO.ui.msg( 'visualeditor-collab-url-mismatch' ) );
					return;
				}
				ve.init.target.surface.initPeerClient( serverId );
			} );
			return;
		}
		// else val is 'host'
		ve.init.target.surface.initPeerServer();
		var url = location.protocol + '//' + location.host + location.pathname;
		ve.dm.peerServer.peer.on( 'open', function ( newId ) {
			var copyTextLayout = new OO.ui.CopyTextLayout( {
				copyText: url + '#collabSession=' + newId
			} );
			OO.ui.alert( copyTextLayout.$element, {
				title: OO.ui.msg( 'visualeditor-collab-copy-title' ),
				size: 'medium'
			} );
		} );
	} );
};

ve.collab.validateSessionUrl = function ( sessionUrl ) {
	var u = new URL( sessionUrl );
	var m = u.hash.match( /^#collabSession=(.*)/ );
	if ( !m ) {
		return '';
	}
	if (
		u.protocol !== location.protocol ||
		u.host !== location.host ||
		u.pathname !== location.pathname
	) {
		return null;
	}
	return m[ 1 ];
};

ve.ui.CollabTool = function VeUiCollabTool() {
	ve.ui.CollabTool.super.apply( this, arguments );
};
OO.inheritClass( ve.ui.CollabTool, OO.ui.Tool );
ve.ui.CollabTool.static.name = 'collab';
ve.ui.CollabTool.static.group = 'collab';
ve.ui.CollabTool.static.icon = 'userGroup';
ve.ui.CollabTool.static.title = 've.collab';
ve.ui.CollabTool.static.autoAddToCatchall = false;
ve.ui.CollabTool.static.displayBothIconAndLabel = true;
ve.ui.CollabTool.prototype.onUpdateState = function () {};
ve.ui.CollabTool.prototype.onToolbarResize = function () {};
ve.ui.CollabTool.prototype.onSelect = function () {
	this.setActive( false );
	ve.collab();
};
ve.ui.toolFactory.register( ve.ui.CollabTool );

ve.ui.setupCollab = function () {
	if ( location.hash.match( /^#collabSession=/ ) ) {
		var serverId = ve.collab.validateSessionUrl( location.toString() );
		if ( serverId ) {
			// Valid session URL
			ve.init.target.surface.initPeerClient( serverId );
			return;
		}
		if ( serverId === null ) {
			// Invalid session URL
			OO.ui.alert( 'Session URL does not match this page' );
		}
	}
	ve.init.target.constructor.static.toolbarGroups = ve.copy(
		ve.init.target.constructor.static.toolbarGroups
	);
	ve.init.target.constructor.static.toolbarGroups.push(
		{ name: 'collab', include: [ 'collab' ] }
	);
	ve.init.target.getToolbar().setup(
		ve.init.target.constructor.static.toolbarGroups,
		ve.init.target.surface
	);
};
