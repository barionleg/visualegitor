/*!
 * VisualEditor ContentEditable linear escape key down handler
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Tab key down handler for linear selections.
 *
 * @class
 * @extends ve.ce.KeyDownHandler
 *
 * @constructor
 */
ve.ce.LinearTabKeyDownHandler = function VeCeLinearTabKeyDownHandler() {
	// Parent constructor
	ve.ui.LinearTabKeyDownHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ce.LinearTabKeyDownHandler, ve.ce.TableArrowKeyDownHandler );

/* Static properties */

ve.ce.LinearTabKeyDownHandler.static.name = 'linearTab';

ve.ce.LinearTabKeyDownHandler.static.keys = [ OO.ui.Keys.TAB ];

ve.ce.LinearTabKeyDownHandler.static.supportedSelections = [ 'linear' ];

/* Static methods */

/**
 * @inheritdoc
 *
 * Handle escape key down events with a linear selection while table editing.
 */
ve.ce.LinearTabKeyDownHandler.static.execute = function ( surface, e ) {
	var tableNode = surface.getActiveTableNode();
	if ( tableNode ) {
		e.preventDefault();
		e.stopPropagation();
		tableNode.setEditing( false );
		ve.ce.LinearTabKeyDownHandler.static.moveTableSelection( surface, 0, e.shiftKey ? -1 : 1, true, false );
	}
};

/* Registration */

ve.ce.keyDownHandlerFactory.register( ve.ce.LinearTabKeyDownHandler );
