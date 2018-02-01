/*!
 * VisualEditor Null Selection class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 * @extends ve.dm.Selection
 * @param {ve.dm.Document} doc
 * @constructor
 */
ve.dm.NullSelection = function VeDmNullSelection( doc ) {
	// Parent constructor
	ve.dm.NullSelection.super.call( this, doc );
};

/* Inheritance */

OO.inheritClass( ve.dm.NullSelection, ve.dm.Selection );

/* Static Properties */

ve.dm.NullSelection.static.name = 'null';

/* Static Methods */

/**
 * @inheritdoc
 */
ve.dm.NullSelection.static.newFromHash = function ( doc ) {
	return new ve.dm.NullSelection( doc );
};

/* Methods */

/**
 * @return {ve.dm.NullSelection} Cloned selection
 */
ve.dm.NullSelection.prototype.clone = function () {
	return new ve.dm.NullSelection( this.getDocument() );
};

/**
 * @inheritdoc
 */
ve.dm.NullSelection.prototype.toJSON = function () {
	return {
		type: this.constructor.static.name
	};
};

/**
 * @inheritdoc
 */
ve.dm.NullSelection.prototype.getDescription = function () {
	return 'Null';
};

/**
 * Used as a shortcut for methods which make no modification
 *
 * @private
 * @return {ve.dm.NullSelection} The selection itself
 */
ve.dm.NullSelection.prototype.self = function () {
	return this;
};

ve.dm.NullSelection.prototype.collapseToStart = ve.dm.NullSelection.prototype.self;

ve.dm.NullSelection.prototype.collapseToEnd = ve.dm.NullSelection.prototype.self;

ve.dm.NullSelection.prototype.collapseToFrom = ve.dm.NullSelection.prototype.self;

ve.dm.NullSelection.prototype.collapseToTo = ve.dm.NullSelection.prototype.self;

/**
 * @inheritdoc
 */
ve.dm.NullSelection.prototype.isCollapsed = function () {
	return true;
};

ve.dm.NullSelection.prototype.translateByTransaction = ve.dm.NullSelection.prototype.self;

ve.dm.NullSelection.prototype.translateByTransactionWithAuthor = ve.dm.NullSelection.prototype.self;

/**
 * @inheritdoc
 */
ve.dm.NullSelection.prototype.getRanges = function () {
	return [];
};

/**
 * @inheritdoc
 */
ve.dm.NullSelection.prototype.getCoveringRange = function () {
	return null;
};

/**
 * @inheritdoc
 */
ve.dm.NullSelection.prototype.equals = function ( other ) {
	return this === other || (
		!!other &&
		other.constructor === this.constructor &&
		this.getDocument() === other.getDocument()
	);
};

/**
 * @inheritdoc
 */
ve.dm.NullSelection.prototype.isNull = function () {
	return true;
};

/* Registration */

ve.dm.selectionFactory.register( ve.dm.NullSelection );
