/*!
 * VisualEditor UserInterface ParagraphAction class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Paragraph action.
 *
 * @class
 * @extends ve.ui.Action
 * @constructor
 * @param {ve.ui.Surface} surface Surface to act on
 */
ve.ui.ParagraphAction = function VeUiParagraphAction( surface ) {
	// Parent constructor
	ve.ui.Action.call( this, surface );
};

/* Inheritance */

OO.inheritClass( ve.ui.ParagraphAction, ve.ui.Action );

/* Static Properties */

ve.ui.ParagraphAction.static.name = 'paragraph';

/**
 * List of allowed methods for the action.
 *
 * @static
 * @property
 */
ve.ui.ParagraphAction.static.methods = [ 'wrap', 'unwrap' ];

/* Methods */

/**
 * Add a paragraph around content.
 *
 * @method
 * @param {string} style Paragraph style, e.g. 'blockquote'
 */
ve.ui.ParagraphAction.prototype.wrap = function ( style ) {
	var surfaceModel = this.surface.getModel();

	surfaceModel.breakpoint();

	throw new Error( 've.ui.ParagraphAction.wrap for "' + style + '" not yet implemented.' );

	// surfaceModel.breakpoint();
};

/**
 * Remove paragraph around content.
 *
 * @method
 */
ve.ui.ParagraphAction.prototype.unwrap = function () {
	var surfaceModel = this.surface.getModel();

	surfaceModel.breakpoint();

	throw new Error( 've.ui.ParagraphAction.unwrap not yet implemented.' );

	// surfaceModel.breakpoint();
};

/* Registration */

ve.ui.actionFactory.register( ve.ui.ParagraphAction );
