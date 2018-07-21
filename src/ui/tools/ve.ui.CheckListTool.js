/*!
 * VisualEditor UserInterface CheckListTool classes.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * UserInterface list tool.
 *
 * @class
 * @extends ve.ui.Tool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.CheckListTool = function VeUiCheckListTool() {
	// Parent constructor
	ve.ui.CheckListTool.super.apply( this, arguments );

	// Properties
	this.method = null;
};

/* Inheritance */

OO.inheritClass( ve.ui.CheckListTool, ve.ui.Tool );

/* Static Properties */

ve.ui.CheckListTool.static.deactivateOnSelect = false;

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.CheckListTool.prototype.onUpdateState = function ( fragment ) {
	var i, len, nodes, all;

	// Parent method
	ve.ui.CheckListTool.super.prototype.onUpdateState.apply( this, arguments );

	nodes = fragment ? fragment.getSelectedLeafNodes() : [];
	all = !!nodes.length;

	for ( i = 0, len = nodes.length; i < len; i++ ) {
		if ( !nodes[ i ].hasMatchingAncestor( 'checkList' ) ) {
			all = false;
			break;
		}
	}
	this.setActive( all );
};

ve.ui.CheckListTool.static.name = 'checkList';
ve.ui.CheckListTool.static.group = 'structure';
ve.ui.CheckListTool.static.icon = 'checkAll';
ve.ui.CheckListTool.static.title =
	OO.ui.deferMsg( 'visualeditor-listbutton-bullet-tooltip' );
ve.ui.CheckListTool.static.commandName = 'checkList';

/* Registration */

ve.ui.toolFactory.register( ve.ui.CheckListTool );

/* Command */

ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'checkList', 'list', 'toggle',
		{ args: [ null, false, 'checkList' ], supportedSelections: [ 'linear' ] }
	)
);
