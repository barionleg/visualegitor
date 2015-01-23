/*!
 * VisualEditor MediaWiki UserInterface gallery tool class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * MediaWiki UserInterface gallery tool.
 *
 * @class
 * @extends ve.ui.DialogTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.GoogleMapsDialogTool = function VeUiGoogleMapsDialogTool() {
	ve.ui.GoogleMapsDialogTool.super.apply( this, arguments );
};
OO.inheritClass( ve.ui.GoogleMapsDialogTool, ve.ui.DialogTool );
ve.ui.GoogleMapsDialogTool.static.name = 'googleMaps';
ve.ui.GoogleMapsDialogTool.static.group = 'object';
ve.ui.GoogleMapsDialogTool.static.icon = 'map-marker';
ve.ui.GoogleMapsDialogTool.static.title = 'Map'; // OO.ui.deferMsg( 'visualeditor-googlemapsdialog-title' );
ve.ui.GoogleMapsDialogTool.static.modelClasses = [ ve.dm.GoogleMapsNode ];
ve.ui.GoogleMapsDialogTool.static.commandName = 'googleMaps';
ve.ui.toolFactory.register( ve.ui.GoogleMapsDialogTool );

ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'googleMaps', 'window', 'open',
		{ args: [ 'googleMaps' ], supportedSelections: [ 'linear' ] }
	)
);
