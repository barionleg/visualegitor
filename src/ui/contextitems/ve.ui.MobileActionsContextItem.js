/*!
 * VisualEditor MobileActionsContextItem class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Context item for a Alien.
 *
 * @class
 * @extends ve.ui.LinearContextItem
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.MobileActionsContextItem = function VeUiMobileActionsContextItem( context, model, config ) {
	// Parent constructor
	ve.ui.MobileActionsContextItem.super.call( this, context, model, config );

	this.copyButton = new OO.ui.ButtonWidget( {
		framed: false,
		label: ve.msg( 'visualeditor-clipboard-copy' ),
		icon: 'articles'
	} );
	this.deleteButton = new OO.ui.ButtonWidget( {
		framed: false,
		label: ve.msg( 'visualeditor-contextitemwidget-label-remove' ),
		icon: 'trash',
		flags: [ 'destructive' ]
	} );

	this.$head.append( this.copyButton.$element );
	if ( !this.isReadOnly() ) {
		this.$head.append( this.deleteButton.$element );
	}

	// Events
	this.copyButton.connect( this, { click: 'onCopyButtonClick' } );
	this.deleteButton.connect( this, { click: 'onDeleteButtonClick' } );

	// Initialization
	this.$element.addClass( 've-ui-mobileActionsContextItem' );
};

/* Inheritance */

OO.inheritClass( ve.ui.MobileActionsContextItem, ve.ui.LinearContextItem );

/* Static Properties */

ve.ui.MobileActionsContextItem.static.name = 'mobileActions';

ve.ui.MobileActionsContextItem.static.editable = false;

/**
 * Handle copy button click events.
 */
ve.ui.LinearContextItem.prototype.onCopyButtonClick = function () {
	var surfaceView = this.context.getSurface().getView();

	surfaceView.activate();
	// Force a native selection on mobile
	surfaceView.preparePasteTargetForCopy( true );

	var copied;
	try {
		copied = document.execCommand( 'copy' );
	} catch ( e ) {
		copied = false;
	}

	ve.init.platform.notify( ve.msg( copied ? 'visualeditor-clipboard-copy-success' : 'visualeditor-clipboard-copy-fail' ) );

	// Restore normal selection for device type
	surfaceView.preparePasteTargetForCopy();
	if ( OO.ui.isMobile() ) {
		// Support: Mobile Safari
		// Force remove the selection to hide the keyboard
		document.activeElement.blur();
	}

	ve.track( 'activity.' + this.constructor.static.name, { action: 'context-copy' } );
};

/**
 * Handle delete button click events.
 */
ve.ui.LinearContextItem.prototype.onDeleteButtonClick = function () {
	this.getFragment().removeContent();

	ve.track( 'activity.' + this.constructor.static.name, { action: 'context-delete' } );
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.MobileActionsContextItem );
