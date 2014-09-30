/*!
 * VisualEditor Empty Selection class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @constructor
 */
ve.dm.EmptySelection = function VeDmEmptySelection( doc ) {
	// Parent constructor
	ve.dm.EmptySelection.super.call( this, doc );
};

/* Inheritance */

OO.inheritClass( ve.dm.EmptySelection, ve.dm.Selection );

/* Static Properties */

ve.dm.EmptySelection.static.name = 'empty';

/* Static Methods */

ve.dm.EmptySelection.static.newFromHash = function ( doc ) {
	return new ve.dm.EmptySelection( doc );
};

/* Methods */

/**
 * @inheritdoc
 */
ve.dm.EmptySelection.prototype.clone = function () {
	return new this.constructor( this.getDocument() );
};

ve.dm.EmptySelection.prototype.getHashObject = function () {
	return {
		type: this.constructor.static.name
	};
};

ve.dm.EmptySelection.prototype.collapseToStart = ve.dm.EmptySelection.prototype.clone;

ve.dm.EmptySelection.prototype.collapseToEnd = ve.dm.EmptySelection.prototype.clone;

ve.dm.EmptySelection.prototype.getRanges = function () {
	return [];
};

/**
 * @inheritdoc
 */
ve.dm.EmptySelection.prototype.equals = function ( other ) {
	return other instanceof ve.dm.EmptySelection &&
		this.getDocument() === other.getDocument();
};

ve.dm.EmptySelection.prototype.isEmpty = function () {
	return true;
};

/* Registration */

ve.dm.selectionFactory.register( ve.dm.EmptySelection );
