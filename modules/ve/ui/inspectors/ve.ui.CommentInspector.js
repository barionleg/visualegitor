/*!
 * VisualEditor UserInterface CommentInspector class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Special character inspector.
 *
 * @class
 * @extends ve.ui.Inspector
 *
 * @constructor
 * @param {ve.dm.SurfaceFragment} fragment Surface fragment the inspector is for
 * @param {Object} [config] Configuration options
 */
ve.ui.CommentInspector = function VeUiCommentInspector( fragment, config ) {

	// Parent constructor
	ve.ui.Inspector.call( this, fragment, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.CommentInspector, ve.ui.Inspector );

/* Static properties */

ve.ui.CommentInspector.static.name = 'comment';

ve.ui.CommentInspector.static.icon = 'comment';

ve.ui.CommentInspector.static.title =
	OO.ui.deferMsg( 'visualeditor-commentinspector-title' );

/**
 * Handle frame ready events.
 *
 * @method
 */
ve.ui.CommentInspector.prototype.initialize = function () {
	// Parent method
	ve.ui.CommentInspector.super.prototype.initialize.call( this );

	this.$view = this.$( '<span>' )
		.addClass( 've-ui-commentInspector-view' );

	this.editWidget = new OO.ui.TextInputWidget( {
		'$': this.$,
		'multiline': true
	} );

	this.editButton = new OO.ui.ButtonWidget( {
		'$': this.$,
		'classes': [ 've-ui-commentInspector-editButton' ],
		'label': ve.msg( 'visualeditor-commentinspector-edit' ),
	} );

	this.editButton.connect( this, { 'click': 'onEditButtonClick' } );

	this.$form.append( [
		this.$view,
		this.editWidget.$element,
		this.editButton.$element
	] );
};

/**
 * Respond to edit button click
 */
ve.ui.CommentInspector.prototype.onEditButtonClick = function () {
	this.editWidget.$element.show();
	this.$view.hide();
//	this.editButton.$element.hide();
};

/**
 * Handle the inspector being setup.
 *
 * @method
 * @param {Object} [data] Inspector opening data
 */
ve.ui.CommentInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.CommentInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			this.commentNode = this.getFragment().getSelectedNode();
			this.comment = this.commentNode.getAttribute( 'text' );

			this.$view.text( this.comment );
			this.editWidget.setValue( this.comment );

			this.editWidget.$element.hide();
			this.$view.show();
			this.editButton.$element.show();
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.CommentInspector );
