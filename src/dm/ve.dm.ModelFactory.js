/*!
 * VisualEditor DataModel ModelFactory class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel meta item factory.
 *
 * @class
 * @abstract
 * @extends OO.Factory
 * @constructor
 */
ve.dm.ModelFactory = function VeDmModelFactory() {
	// Parent constructor
	ve.dm.ModelFactory.super.call( this );
};

/* Inheritance */

OO.inheritClass( ve.dm.ModelFactory, OO.Factory );

/* Methods */

/**
 * Create a new item from a model element
 *
 * @param {Object} element Model element
 * @return {ve.dm.Model} Model constructed from element
 * @throws {Error} Element must have a .type property
 */
ve.dm.ModelFactory.prototype.createFromElement = function ( element ) {
	if ( element && element.type ) {
		return this.create( element.type, element );
	}
	throw new Error( 'Element must have a .type property' );
};

/**
 * Create a new item from a hashed model element
 *
 * @param {Object} hashedElement Hashed model element
 * @return {ve.dm.Model} Model
 */
ve.dm.ModelFactory.prototype.createFromHashedElement = function ( hashedElement ) {
	return this.createFromElement( this.getElementFromHash( hashedElement ) );
};

/**
 * Get a model element object from its hash
 *
 * @param {Object} hashedElement Hashed model element
 * @return {Object} Model element object
 */
ve.dm.ModelFactory.prototype.getElementFromHash = function ( hashedElement ) {
	var constructor = this.lookup( hashedElement.type );
	return constructor.static.getElementFromHash( hashedElement );
};
