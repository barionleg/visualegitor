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
 * @extends ve.ui.FragmentInspector
 *
 * @constructor
 * @param {OO.ui.WindowManager} manager Manager of window
 * @param {Object} [config] Configuration options
 */
ve.ui.CommentInspector = function VeUiCommentInspector( manager, config ) {

	// Parent constructor
	ve.ui.NodeInspector.call( this, manager, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.CommentInspector, ve.ui.NodeInspector );

/* Static properties */

ve.ui.CommentInspector.static.name = 'comment';

ve.ui.CommentInspector.static.icon = 'comment';

ve.ui.CommentInspector.static.title =
	OO.ui.deferMsg( 'visualeditor-commentinspector-title' );

ve.ui.CommentInspector.static.modelClasses = [ ve.dm.CommentNode ];

ve.ui.CommentInspector.static.nodeModel = ve.dm.CommentNode;

ve.ui.CommentInspector.static.size = 'large';

ve.ui.CommentInspector.static.actions = [
	{
		'action': 'remove',
		'label': OO.ui.deferMsg( 'visualeditor-inspector-remove-tooltip' ),
		'flags': 'destructive'
	},
	{
		'action': 'edit',
		'label': OO.ui.deferMsg( 'visualeditor-commentinspector-edit' )
	}
].concat( ve.ui.FragmentInspector.static.actions );

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

	this.frame.$content.addClass( 've-ui-commentInspector-content' );
	this.form.$element.append( [
		this.$view,
		this.editWidget.$element
	] );
};

/**
 * @inheritdoc
 */
ve.ui.CommentInspector.prototype.getActionProcess = function ( action ) {
	if ( action === 'remove' ) {
		return new OO.ui.Process( function () {
			this.close( { 'action': 'remove' } );
		}, this );
	}
	if ( action === 'edit' ) {
		return new OO.ui.Process( function () {
			this.setEditMode();
		}, this );
	}
	// TODO: Add 'edit'
	return ve.ui.CommentInspector.super.prototype.getActionProcess.call( this, action );
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
			var comment;

			// Disable surface until animation is complete; will be reenabled in ready()
			this.getFragment().getSurface().disable();

			this.commentNode = this.getFragment().getSelectedNode();
			if ( this.commentNode ) {
				// Edit existing comment
				comment = this.commentNode ?
					this.commentNode.getAttribute( 'text' ) :
					'';

				this.$view.html( comment.replace( /\n/g, '<br>' ) );
				this.editWidget.setValue( comment );

				this.editWidget.$element.hide();
				this.$view.show();
			} else {
				// New comment
				this.setEditMode();
			}
		}, this );
};

/**
 * Set the inspector into edit mode
 */
ve.ui.CommentInspector.prototype.setEditMode = function () {
	this.editWidget.$element.show();
	this.editWidget.focus();
	this.$view.hide();
};

/**
 * @inheritdoc
 */
ve.ui.CommentInspector.prototype.getReadyProcess = function ( data ) {
	return ve.ui.CommentInspector.super.prototype.getReadyProcess.call( this, data )
		.next( function () {
			this.getFragment().getSurface().enable();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.CommentInspector.prototype.getTeardownProcess = function ( data ) {
	data = data || {};
	return ve.ui.CommentInspector.super.prototype.getTeardownProcess.call( this, data )
		.first( function () {
			var surfaceModel = this.getFragment().getSurface();

			if ( data.action === 'remove' ) {
				this.fragment = this.getFragment().clone( this.getFragment().getSelectedNode().getOuterRange() );
				this.fragment.removeContent();
			} else {
				if ( this.commentNode ) {
					// Edit existing comment
					surfaceModel.change(
						ve.dm.Transaction.newFromAttributeChanges(
							surfaceModel.getDocument(),
							this.commentNode.getOffset(),
							{ 'text': this.editWidget.getValue() }
						)
					);
				} else {
					// Add a new comment
					this.getFragment().insertContent( [
						{
							'type': 'comment',
							'attributes': { 'text': this.editWidget.getValue() }
						},
						{ 'type': '/comment' }
					] );

				}
			}
			this.editWidget.setValue( '' );
			this.$view.text( '' );
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.CommentInspector );
