/*!
 * VisualEditor UserInterface BlockquoteTool class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * UserInterface blockquote tool.
 *
 * @class
 * @extends OO.ui.Tool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.BlockquoteTool = function VeUiBlockquoteTool( toolGroup, config ) {
	// Parent constructor
	OO.ui.Tool.call( this, toolGroup, config );

	// Properties
	this.method = null;
};

/* Inheritance */

OO.inheritClass( ve.ui.BlockquoteTool, OO.ui.Tool );

/* Properties */

ve.ui.BlockquoteTool.static.name = 'blockquote';
ve.ui.BlockquoteTool.static.group = 'structure';
ve.ui.BlockquoteTool.static.icon = 'blockquote'; // FIXME Icon needed
ve.ui.BlockquoteTool.static.title =
	OO.ui.deferMsg( 'visualeditor-blockquote-tooltip' );

ve.ui.toolFactory.register( ve.ui.BlockquoteTool );

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.BlockquoteTool.prototype.onSelect = function () {
	if ( this.method === 'wrap' || this.method === 'unwrap' ) {
		this.toolbar.surface.execute( 'paragraph', 'blockquote', this.method );
	}
};

/**
 * @inheritdoc
 */
ve.ui.BlockquoteTool.prototype.onUpdateState = function ( nodes ) {
	var i, len,
		all = !!nodes.length;

	for ( i = 0, len = nodes.length; i < len; i++ ) {
		if ( !nodes[i] instanceof ve.ce.BlockquoteNode ) {
			all = false;
			break;
		}
	}
	this.method = all ? 'unwrap' : 'wrap';
	this.setActive( all );
};
