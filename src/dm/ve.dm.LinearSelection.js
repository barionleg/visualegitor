/*!
 * VisualEditor Text Selection class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @constructor
 * @param {ve.dm.Document} doc Document
 * @param {ve.Range} range Range
 */
ve.dm.LinearSelection = function VeDmLinearSelection( doc, range ) {
	// Parent constructor
	ve.dm.LinearSelection.super.call( this, doc );

	this.range = range;
};

/* Inheritance */

OO.inheritClass( ve.dm.LinearSelection, ve.dm.Selection );

/* Static Properties */

ve.dm.LinearSelection.static.name = 'linear';

/* Static Methods */

ve.dm.LinearSelection.static.newFromHash = function ( doc, hash ) {
	return new ve.dm.LinearSelection( doc, ve.Range.static.newFromHash( hash.range ) );
};

/* Methods */

/**
 * @inheritdoc
 */
ve.dm.LinearSelection.prototype.clone = function () {
	return new this.constructor( this.getDocument(), this.getRange() );
};

ve.dm.LinearSelection.prototype.getHashObject = function () {
	return {
		type: this.constructor.static.name,
		range: this.range.getHashObject()
	};
};

/**
 * @inheritdoc
 */
ve.dm.LinearSelection.prototype.collapseToStart = function () {
	return new this.constructor( this.getDocument(), new ve.Range( this.getRange().start ) );
};

/**
 * @inheritdoc
 */
ve.dm.LinearSelection.prototype.collapseToEnd = function () {
	return new this.constructor( this.getDocument(), new ve.Range( this.getRange().end ) );
};

/**
 * @inheritdoc
 */
ve.dm.LinearSelection.prototype.getRanges = function () {
	return [this.range];
};

ve.dm.LinearSelection.prototype.getRange = function () {
	return this.range;
};

/**
 * @inheritdoc
 */
ve.dm.LinearSelection.prototype.equals = function ( other ) {
	return other instanceof ve.dm.LinearSelection &&
		this.getDocument() === other.getDocument() &&
		this.getRange().equals( other.getRange() );
};

ve.dm.LinearSelection.prototype.isCollapsed = function () {
	return this.getRange().isCollapsed();
};

/* Registration */

ve.dm.selectionFactory.register( ve.dm.LinearSelection );
