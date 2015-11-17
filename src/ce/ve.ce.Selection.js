/*!
 * VisualEditor Selection class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @abstract
 * @constructor
 * @param {ve.dm.Selection} model Selection model
 * @param {ve.ce.Document} surface Surface
 */
ve.ce.Selection = function VeCeSelection( model, surface ) {
	this.model = model;
	this.surface = surface;
};

/* Inheritance */

OO.initClass( ve.ce.Selection );

/* Static Properties */

ve.ce.Selection.static.type = null;

/* Static methods */

ve.ce.Selection.static.newFromModel = function ( model, doc ) {
	return ve.ce.selectionFactory.create( model.getName(), model, doc );
};

/* Method */

ve.ce.Selection.prototype.getSurface = function () {
	return this.surface;
};

ve.ce.Selection.prototype.getModel = function () {
	return this.model;
};

/**
 * Get the rectangles of the selection relative to the surface.
 *
 * @abstract
 * @return {Object[]|null} Selection rectangles
 */
ve.ce.Selection.prototype.getSelectionRects = null;

/**
 * Get the start and end rectangles of the selection relative to the surface.
 *
 * @abstract
 * @return {Object|null} Start and end selection rectangles
 */
ve.ce.Selection.prototype.getSelectionStartAndEndRects = function () {
	return ve.getStartAndEndRects( this.getSelectionRects() );
};

/**
 * Get the coordinates of the selection's bounding rectangle relative to the surface.
 *
 * @abstract
 * @return {Object|null} Selection rectangle, with keys top, bottom, left, right, width, height
 */
ve.ce.Selection.prototype.getSelectionBoundingRect = null;

/* Factory */

ve.ce.selectionFactory = new OO.Factory();
