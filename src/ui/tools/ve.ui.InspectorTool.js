/*!
 * VisualEditor UserInterface InspectorTool classes.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface inspector tool.
 *
 * @abstract
 * @class
 * @extends ve.ui.DialogTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.InspectorTool = function VeUiInspectorTool( toolGroup, config ) {
	// Parent constructor
	ve.ui.InspectorTool.super.call( this, toolGroup, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.InspectorTool, ve.ui.DialogTool );

/* Static Properties */

ve.ui.InspectorTool.static.deactivateOnSelect = false;

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.InspectorTool.prototype.onUpdateState = function ( fragment ) {
	var i, len, models, ceSurface;

	this.setActive( false );

	// Parent method
	ve.ui.InspectorTool.super.prototype.onUpdateState.apply( this, arguments );

	models = this.getSelectedModels( fragment ) ;

	for ( i = 0, len = models.length; i < len; i++ ) {
		if ( this.constructor.static.isCompatibleWith( models[ i ] ) ) {
			this.setActive( true );
			break;
		}
	}
};

/**
 * Get list of selected nodes and annotations.
 *
 * @param {ve.dm.SurfaceFragment|null} fragment Surface fragment
 * @return {ve.dm.Model[]} Selected models
 */
ve.ui.InspectorTool.prototype.getSelectedModels = function ( fragment ) {
	return fragment ? fragment.getSelectedModels() : [];
};

/**
 * UserInterface link tool.
 *
 * @class
 * @extends ve.ui.InspectorTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.LinkInspectorTool = function VeUiLinkInspectorTool( toolGroup, config ) {
	ve.ui.InspectorTool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.LinkInspectorTool, ve.ui.InspectorTool );
ve.ui.LinkInspectorTool.static.name = 'link';
ve.ui.LinkInspectorTool.static.group = 'meta';
ve.ui.LinkInspectorTool.static.icon = 'link';
ve.ui.LinkInspectorTool.static.title =
	OO.ui.deferMsg( 'visualeditor-annotationbutton-link-tooltip' );
ve.ui.LinkInspectorTool.static.modelClasses = [ ve.dm.LinkAnnotation ];
ve.ui.LinkInspectorTool.static.commandName = 'link';

ve.ui.LinkInspectorTool.prototype.getSelectedModels = function ( fragment ) {
	var surfaceView,
		selection = fragment && fragment.getSelection();

	// Ask the CE surface about selected models, so it can give the right
	// answer about links based on the CE selection.
	if ( selection instanceof ve.dm.LinearSelection ) {
		surfaceView = this.toolbar.getSurface().getView();
		if ( selection.equals( surfaceView.getModel().getSelection() ) ) {
			return surfaceView.getSelectedModels();
		} else {
			console.log('diff')
		}
	}

	return ve.ui.LinkInspectorTool.super.prototype.getSelectedModels.apply( this, arguments );
};

ve.ui.toolFactory.register( ve.ui.LinkInspectorTool );

/**
 * UserInterface comment tool.
 *
 * @class
 * @extends ve.ui.InspectorTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.CommentInspectorTool = function VeUiCommentInspectorTool( toolGroup, config ) {
	ve.ui.InspectorTool.call( this, toolGroup, config );
};
OO.inheritClass( ve.ui.CommentInspectorTool, ve.ui.InspectorTool );
ve.ui.CommentInspectorTool.static.name = 'comment';
ve.ui.CommentInspectorTool.static.group = 'meta';
ve.ui.CommentInspectorTool.static.icon = 'notice';
ve.ui.CommentInspectorTool.static.title =
	OO.ui.deferMsg( 'visualeditor-commentinspector-tooltip' );
ve.ui.CommentInspectorTool.static.modelClasses = [ ve.dm.CommentNode ];
ve.ui.CommentInspectorTool.static.commandName = 'comment';
ve.ui.CommentInspectorTool.static.deactivateOnSelect = true;
ve.ui.toolFactory.register( ve.ui.CommentInspectorTool );
