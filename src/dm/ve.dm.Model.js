/*!
 * VisualEditor DataModel Model class.
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Base class for DM models.
 *
 * @class
 * @abstract
 *
 * @constructor
 * @param {Object} element Reference to plain object in linear model
 */
ve.dm.Model = function VeDmModel( element ) {
	// Properties
	this.element = element || { type: this.constructor.static.name };
	this.store = null;
};

/* Inheritance */

OO.initClass( ve.dm.Model );

/* Static Properties */

/**
 * Symbolic name for this model class. Must be set to a unique string by every subclass.
 * @static
 * @property {string}
 * @inheritable
 */
ve.dm.Model.static.name = null;

/**
 * Array of HTML tag names that this model should be a match candidate for.
 * Empty array means none, null means any.
 * For more information about element matching, see ve.dm.ModelRegistry.
 * @static
 * @property {string[]}
 * @inheritable
 */
ve.dm.Model.static.matchTagNames = null;

/**
 * Array of RDFa types that this model should be a match candidate for.
 * Any other types the element might have must be specified in allowedRdfaTypes.
 * Empty array means none, null means any.
 * For more information about element matching, see ve.dm.ModelRegistry.
 * @static
 * @property {Array}
 * @inheritable
 */
ve.dm.Model.static.matchRdfaTypes = null;

/**
 * Extra RDFa types that the element is allowed to have (but don't by
 * themselves trigger a match).
 * Empty array means none, null means any.
 * For more information about element matching, see ve.dm.ModelRegistry.
 * @static
 * @property {Array}
 * @inheritable
 */
ve.dm.Model.static.allowedRdfaTypes = [];

/**
 * Optional function to determine whether this model should match a given element.
 * Takes a Node and returns true or false.
 * This function is only called if this model has a chance of "winning"; see
 * ve.dm.ModelRegistry for more information about element matching.
 * If set to null, this property is ignored. Setting this to null is not the same as unconditionally
 * returning true, because the presence or absence of a matchFunction affects the model's
 * specificity.
 *
 * NOTE: This function is NOT a method, within this function "this" will not refer to an instance
 * of this class (or to anything reasonable, for that matter).
 * @static
 * @property {Function}
 * @inheritable
 */
ve.dm.Model.static.matchFunction = null;

/**
 * Static function to convert a DOM element or set of sibling DOM elements to a linear model element
 * for this model type.
 *
 * This function is only called if this model "won" the matching for the first DOM element, so
 * domElements[0] will match this model's matching rule. There is usually only one DOM node in
 * domElements[]. Multiple elements will only be passed if this model supports about groups.
 * If there are multiple nodes, the nodes are all adjacent siblings in the same about group
 * (i.e. they are grouped together because they have the same value for the about attribute).
 *
 * The converter has some state variables that can be obtained by this function:
 * - if converter.isExpectingContent() returns true, the converter expects a content element
 * - if converter.isInWrapper() returns true, the returned element will be put in a wrapper
 *   paragraph generated by the converter (this is only relevant if isExpectingContent() is true)
 * - converter.canCloseWrapper() returns true if the current wrapper paragraph can be closed,
 *   and false if it can't be closed or if there is no active wrapper
 *
 * This function is allowed to return a content element when context indicates that a non-content
 * element is expected or vice versa. If that happens, the converter deals with it in the following way:
 *
 * - if a non-content element is expected but a content element is returned:
 *     - open a wrapper paragraph
 *     - put the returned element in the wrapper
 * - if a content element is expected but a non-content element is returned:
 *     - if we are in a wrapper paragraph:
 *         - if we can close the wrapper:
 *             - close the wrapper
 *             - insert the returned element right after the end of the wrapper
 *         - if we can't close the wrapper:
 *             - alienate the element
 *     - if we aren't in a wrapper paragraph:
 *         - alienate the element
 *
 * For these purposes, annotations are considered content. Meta-items can occur anywhere, so if
 * a meta-element is returned no special action is taken. Note that "alienate" always means an alien
 * *node* (ve.dm.AlienNode) will be generated, never an alien meta-item (ve.dm.AlienMetaItem),
 * regardless of whether the subclass attempting the conversion is a node or a meta-item.
 *
 * The returned linear model element must have a type property set to a registered model name
 * (usually the model's own .static.name, but that's not required). It may optionally have an attributes
 * property set to an object with key-value pairs. Any other properties are not allowed.
 *
 * This function may return a single linear model element, or an array of balanced linear model
 * data. If this function needs to recursively convert a DOM node (e.g. a child of one of the
 * DOM elements passed in), it can call converter.getDataFromDomSubtree( domElement ). Note that
 * if an array is returned, the converter will not descend into the DOM node's children; the model
 * will be assumed to have handled those children.
 *
 * @static
 * @inheritable
 * @method
 * @param {Node[]} domElements DOM elements to convert. Usually only one element
 * @param {ve.dm.Converter} converter Converter object
 * @return {Object|Array|null} Linear model element, or array with linear model data, or null to alienate
 */
ve.dm.Model.static.toDataElement = function () {
	return { type: this.name };
};

/**
 * Static function to convert a linear model data element for this model type back to one or more
 * DOM elements.
 *
 * If this model is a node with handlesOwnChildren set to true, dataElement will be an array of
 * the linear model data of this node and all of its children, rather than a single element.
 * In this case, this function way want to recursively convert linear model data to DOM, which can
 * be done with ve.dm.Converter#getDomSubtreeFromData.
 *
 * NOTE: If this function returns multiple DOM elements, the DOM elements produced by the children
 * of this model (if it's a node and has children) will be attached to the first DOM element in the array.
 * For annotations, only the first element is used, and any additional elements are ignored.
 *
 * @static
 * @inheritable
 * @method
 * @param {Object|Array} dataElement Linear model element or array of linear model data
 * @param {HTMLDocument} doc HTML document for creating elements
 * @param {ve.dm.Converter} converter Converter object to optionally call `getDomSubtreeFromData` on
 * @return {Node[]} DOM elements
 */
ve.dm.Model.static.toDomElements = function ( dataElement, doc ) {
	if ( this.matchTagNames && this.matchTagNames.length === 1 ) {
		return [ doc.createElement( this.matchTagNames[ 0 ] ) ];
	}
	throw new Error( 've.dm.Model subclass must match a single tag name or implement toDomElements' );
};

/**
 * Whether this model supports about grouping. When a DOM element matches a model type that has
 * about grouping enabled, the converter will look for adjacent siblings with the same value for
 * the about attribute, and ask #toDataElement to produce a single data element for all of those
 * DOM nodes combined.
 *
 * The converter doesn't descend into about groups, i.e. it doesn't convert the children of the
 * DOM elements that make up the about group. This means the resulting linear model element will
 * be childless.
 *
 * @static
 * @property {boolean}
 * @inheritable
 */
ve.dm.Model.static.enableAboutGrouping = false;

/**
 * Which HTML attributes should be preserved for this model type. When converting back to DOM,
 * these HTML attributes will be restored except for attributes that were already set by #toDomElements.
 *
 * The value of this property can be one of the following:
 *
 * - true, to preserve all attributes (default)
 * - false, to preserve none
 * - a function that takes an attribute name and returns true or false
 *
 * @static
 * @property {boolean|Function}
 * @inheritable
 */
ve.dm.Model.static.preserveHtmlAttributes = true;

/* Static methods */

/**
 * Get hash object of a linear model data element.
 *
 * @static
 * @param {Object} dataElement Data element
 * @return {Object} Hash object
 */
ve.dm.Model.static.getHashObject = function ( dataElement ) {
	var hash = {
		type: dataElement.type,
		attributes: dataElement.attributes
	};
	if ( dataElement.originalDomElementsHash !== undefined ) {
		hash.originalDomElementsHash = dataElement.originalDomElementsHash;
	}
	return hash;
};

/**
 * Array of RDFa types that this model should be a match candidate for.
 *
 * @static
 * @return {Array} Array of strings or regular expressions
 */
ve.dm.Model.static.getMatchRdfaTypes = function () {
	return this.matchRdfaTypes;
};

/**
 * Extra RDFa types that the element is allowed to have.
 *
 * @static
 * @return {Array} Array of strings or regular expressions
 */
ve.dm.Model.static.getAllowedRdfaTypes = function () {
	return this.allowedRdfaTypes;
};

/**
 * Describe attribute changes in the model
 *
 * @param {Object} attributeChanges Attribute changes, keyed list containing objects with from and to properties
 * @param {Object} attributes New attributes
 * @param {Object} element New element
 * @return {Array} Descriptions, list of strings or Node arrays
 */
ve.dm.Model.static.describeChanges = function ( attributeChanges ) {
	var key, change,
		descriptions = [];
	for ( key in attributeChanges ) {
		change = this.describeChange( key, attributeChanges[ key ] );
		if ( change ) {
			descriptions.push( change );
		}
	}
	return descriptions;
};

/**
 * Describe a single attribute change in the model
 *
 * @param {string} key Attribute key
 * @param {Object} change Change object with from and to properties
 * @return {string|Node[]|null} Description (string or Node array), or null if nothing to describe
 */
ve.dm.Model.static.describeChange = function ( key, change ) {
	if ( ( typeof change.from === 'object' && change.from !== null ) || ( typeof change.to === 'object' && change.to !== null ) ) {
		return ve.htmlMsg( 'visualeditor-changedesc-unknown', key );
	} else if ( change.from === undefined ) {
		return ve.htmlMsg( 'visualeditor-changedesc-set', key, this.wrapText( 'ins', change.to ) );
	} else if ( change.to === undefined ) {
		return ve.htmlMsg( 'visualeditor-changedesc-unset', key, this.wrapText( 'del', change.from ) );
	} else {
		return ve.htmlMsg( 'visualeditor-changedesc-changed', key, this.wrapText( 'del', change.from ), this.wrapText( 'ins', change.to ) );
	}
};

/**
 * Utility function for wrapping text in a tag, equivalent to `$( '<tag>' ).text( text )`
 *
 * @param {string} tag Wrapping element's tag
 * @param {string} text Text
 * @return {HTMLElement} Element wrapping text
 */
ve.dm.Model.static.wrapText = function ( tag, text ) {
	var wrapper = document.createElement( tag );
	wrapper.appendChild( document.createTextNode( text ) );
	return wrapper;
};

/**
 * Check if this element is of the same type as another element for the purposes of diffing.
 *
 * @static
 * @param {Object} element This element
 * @param {Object} other Another element
 * @param {ve.dm.HashValueStore} elementStore Store used by this element
 * @param {ve.dm.HashValueStore} otherStore Store used by other elements
 * @return {boolean} Elements are of a comparable type
 */
ve.dm.Model.static.isDiffComparable = function ( element, other ) {
	return element.type === other.type;
};

/* Methods */

/**
 * Check whether this node can be inspected by a context item.
 *
 * The default implementation always returns true. If your node type is uninspectable in certain
 * cases, you should override this function.
 *
 * @return {boolean} Whether this node is inspectable
 */
ve.dm.Model.prototype.isInspectable = function () {
	return true;
};

/**
 * Check whether this node can be edited by a context item
 *
 * The default implementation always returns true. If your node type is uneditable in certain
 * cases, you should override this function.
 *
 * @return {boolean} Whether this node is editable
 */
ve.dm.Model.prototype.isEditable = function () {
	return true;
};

/**
 * Get a reference to the linear model element.
 *
 * @method
 * @return {Object} Linear model element passed to the constructor, by reference
 */
ve.dm.Model.prototype.getElement = function () {
	return this.element;
};

/**
 * Get a reference to the hash-value store used by the element.
 *
 * @method
 * @return {ve.dm.HashValueStore} Hash-value store
 */
ve.dm.Model.prototype.getStore = function () {
	return this.store;
};

/**
 * Get the symbolic name of this model's type.
 *
 * @method
 * @return {string} Type name
 */
ve.dm.Model.prototype.getType = function () {
	return this.constructor.static.name;
};

/**
 * Get the value of an attribute.
 *
 * Return value is by reference if array or object.
 *
 * @method
 * @param {string} key Name of attribute to get
 * @return {Mixed} Value of attribute, or undefined if no such attribute exists
 */
ve.dm.Model.prototype.getAttribute = function ( key ) {
	return this.element && this.element.attributes ? this.element.attributes[ key ] : undefined;
};

/**
 * Get a copy of all attributes.
 *
 * Values are by reference if array or object, similar to using the getAttribute method.
 *
 * @method
 * @param {string} [prefix] Only return attributes with this prefix, and remove the prefix from them
 * @return {Object} Attributes
 */
ve.dm.Model.prototype.getAttributes = function ( prefix ) {
	var key, filtered,
		attributes = this.element && this.element.attributes ? this.element.attributes : {};
	if ( prefix ) {
		filtered = {};
		for ( key in attributes ) {
			if ( key.indexOf( prefix ) === 0 ) {
				filtered[ key.slice( prefix.length ) ] = attributes[ key ];
			}
		}
		return filtered;
	}
	return ve.extendObject( {}, attributes );
};

/**
 * Get the DOM element(s) this model was originally converted from, if any.
 *
 * @return {string|undefined} Store hash of DOM elements this model was converted from
 */
ve.dm.Model.prototype.getOriginalDomElementsHash = function () {
	return this.element ? this.element.originalDomElementsHash : undefined;
};

/**
 * Get the DOM element(s) this model was originally converted from, if any.
 *
 * @param {ve.dm.HashValueStore} store Hash value store where the DOM elements are stored
 * @return {HTMLElement[]} DOM elements this model was converted from, empty if not applicable
 */
ve.dm.Model.prototype.getOriginalDomElements = function ( store ) {
	return store.value( this.getOriginalDomElementsHash() ) || [];
};

/**
 * Get a clone of the model's linear model element.
 *
 * The attributes object will be deep-copied.
 *
 * @return {Object} Cloned element object
 */
ve.dm.Model.prototype.getClonedElement = function () {
	return ve.copy( this.element );
};

/**
 * Get the hash object of the linear model element.
 *
 * The actual logic is in a static function as this needs
 * to be accessible from ve.dm.Converter
 *
 * This is a custom hash function for OO#getHash.
 *
 * @method
 * @return {Object} Hash object
 */
ve.dm.Model.prototype.getHashObject = function () {
	return this.constructor.static.getHashObject( this.element );
};

/**
 * Check if this element is of the same type as another element for the purposes of diffing.
 *
 * Elements which aren't of the same type will always be shown as removal and an insertion,
 * whereas comarable elements will be shown as an attribute change.
 *
 * @param {Object} other Another element
 * @return {boolean} Elements are of a comparable type
 */
ve.dm.Model.prototype.isDiffComparable = function ( other ) {
	return this.constructor.static.isDiffComparable( this.element, other.element, this.getStore(), other.getStore() );
};
