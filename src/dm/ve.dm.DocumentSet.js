/*!
 * VisualEditor DataModel DocumentSet class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel document set.
 *
 * @class
 * @constructor
 * @param {string} [lang='en'] Language code
 * @param {string} [dir='ltr'] Direction ('ltr' or 'rtl')
 */
ve.dm.DocumentSet = function VeDmDocumentSet( lang, dir ) {
	// Mixin constructors
	OO.EventEmitter.call( this );

	// SUBDOCUMENT TODO:
	// Shared IVStore
	// History aggregation of some kind?
	// Group management / tracking (for references)
	// Move some of the converter state (like HTMLDocument) here?
	// Need a way to magically add empty documents when an index is reserved but never fulfilled
	// Probably need to move group+name to Document and disallow nameless documents;
	// alternatively, pass documents or indexes rather than names to register/deregister
	this.documents = [];
	this.lang = lang || 'en';
	this.dir = dir || 'ltr';

	this.documentGroups = {};
	this.firstUseOffsets = [];
};

OO.initClass( ve.dm.DocumentSet );

/* Inheritance */

OO.mixinClass( ve.dm.DocumentSet, OO.EventEmitter );

/* Methods */

/**
 * Get the document at a given index.
 *
 * @param {number} index Index of document
 * @return {ve.dm.Document|null} Document at given index
 */
ve.dm.DocumentSet.prototype.getDocument = function ( index ) {
	// SUBDOCUMENT TODO: add magic behavior so that if index is reserved, it's fulfilled with an empty document?
	return this.documents[ index ] || null;
};

ve.dm.DocumentSet.prototype.getMainDocument = function () {
	return this.getDocument( 0 );
};

ve.dm.DocumentSet.prototype.reserveIndex = function ( index ) {
	var set = this;
	if ( index === undefined ) {
		index = this.documents.push( null ) - 1;
	} else if ( this.documents[ index ] === undefined ) {
		this.documents[ index ] = null;
	} else {
		return null;
	}

	return {
		index: index,
		fulfill: function ( doc ) {
			if ( set.documents[ index ] !== null ) {
				throw new Error( 'Trying to fulfill already fulfilled reservation for index ' + index );
			}
			set.documents[ index ] = doc;
			doc.attachToSet( set, index );
		}
	};
};

/**
 * Add a document to the set
 *
 * @param {ve.dm.Document} doc Document to add
 * @return {number} Index of the newly added document
 */
ve.dm.DocumentSet.prototype.addDocument = function ( doc ) {
	var reservation = this.reserveIndex();
	reservation.fulfill( doc );
	return reservation.index;
};

/**
 * Get the content language
 *
 * @return {string} Language code
 */
ve.dm.DocumentSet.prototype.getLang = function () {
	return this.lang;
};

/**
 * Get the content directionality
 *
 * @return {string} Direction ('ltr' or 'rtl')
 */
ve.dm.DocumentSet.prototype.getDir = function () {
	return this.dir;
};

/**
 * Get a clone
 *
 * @return {ve.dm.DocumentSet} Copy of DocumentSet
 */
ve.dm.DocumentSet.prototype.clone = function () {
	var i, len, docClone, clone = new this.constructor( this.lang, this.dir );
	for ( i = 0, len = this.documents.length; i < len; i++ ) {
		docClone = this.documents[ i ].clone();
		clone.documents[ i ] = docClone;
		docClone.attachToSet( clone, i );
	}
	return clone;
};

/**
 * Get the document index by its name
 *
 * @param {string} group Document group
 * @param {string} name Document name
 * @return {number|null} Index of document in its group
 */
ve.dm.DocumentSet.prototype.getDocumentIndexByName = function ( group, name ) {
	var index = this.documentGroups[ group ] && this.documentGroups[ group ].indexes[ name ];
	return index === undefined ? null : index;
};

/**
 * Get a document by its name
 *
 * @param {string} group Document group
 * @param {string} name Document name
 * @return {ve.dm.Document|null} The document with that name
 */
ve.dm.DocumentSet.prototype.getDocumentByName = function ( group, name ) {
	var index = this.getDocumentIndexByName( group, name );
	return index === null ? null : this.getDocument( index );
};

ve.dm.DocumentSet.prototype.addDocumentByName = function ( group, name, doc ) {
	var reservation, index, groupObj = this.getGroupObj( group );

	if ( groupObj.indexes[ name ] === undefined ) {
		reservation = this.reserveIndex();
		index = reservation.index;
		groupObj.reservations[ name ] = reservation;
		groupObj.indexes[ name ] = index;
	} else {
		reservation = groupObj.reservations[ name ];
		index = groupObj.indexes[ name ];
	}

	if ( doc && reservation ) {
		reservation.fulfill( doc );
		delete groupObj.reservations[ name ];
	}

	return index;
};

/**
 * Get a unique name. The same name passed in twice will give the same result.
 *
 * @param {string} group Document group
 * @param {string} [prefix=''] Prefix the unique name should start with
 * @param {string} [oldName] Potentially non-unique name
 * @return {string} Unique name
 */
ve.dm.DocumentSet.prototype.getUniqueName = function ( group, prefix, oldName ) {
	var uniqueName,
		groupObj = this.getGroupObj( group ),
		num = 0;
	if ( prefix === undefined ) {
		prefix = '';
	}

	// If we've already assigned a unique name for oldName, return that
	if ( oldName !== undefined && groupObj.uniqueNames[ oldName ] !== undefined ) {
		return groupObj.uniqueNames[ oldName ];
	}

	// Find the lowest number that's not already in use and doesn't conflict with
	// an existing name
	do {
		uniqueName = prefix + num;
	} while ( groupObj.indexes[ uniqueName ] !== undefined || groupObj.usedUniqueNames[ uniqueName ] );

	groupObj.usedUniqueNames[ uniqueName ] = true;
	if ( oldName !== undefined ) {
		groupObj.uniqueNames[ oldName ] = uniqueName;
	}
	return uniqueName;
};

/**
 * Get a tuple of { doc1 offset, doc2 offset, ... } describing node's place in the documentset hierarchy
 *
 * e.g. for docset [a, b, c, d, [z, y, x, [m, n], w], f] getOffsetTuple(n) would return [4, 3, 1]
 *
 * @param  {ve.Node} node
 * @return {Array} offsets in each documentset in the hierarchy to reach node
 */
ve.dm.DocumentSet.prototype.getOffsetTuple = function ( node ) {
	// SUBDOCUMENT TODO: put entire tuples in this.firstUseOffset to speed this up
	var firstUse,
		docIndex = node.getDocument().getParentSetIndex(),
		tuple = [ node.getOffset() ];
	while ( docIndex !== 0 ) {
		if ( docIndex === undefined ) {
			throw new Error( 'node passed to getOffsetTuple is in an unattached document' );
		}
		firstUse = this.firstUseOffsets[ docIndex ];
		if ( !firstUse ) {
			throw new Error( 'node passed to getOffsetTuple is in an unused document' );
		}
		tuple.unshift( firstUse.offset );
		docIndex = firstUse.docIndex;
	}
	return tuple;
};

// SUBDOCUMENT TODO: account for offsets changing over time, probably using fragments
// SUBDOCUMENT TODO: factor out similar/identical comparators
// SUBDOCUMENT TODO: offsets might be incomparable if from different documents
// SUBDOCUMENT TODO: assume in-order registration when building node tree
// SUBDOCUMENT TODO: come up with a way to make event emission MUCH more efficient
// We should be able to identify exactly which nodes were affected
// Concerns: would prefer not to broadcast then filter,
// but also don't want to make things too MW-specific
// Would be nice to design API such that each node doesn't have to call back with an indexOf()
// call to find its index
// Might consider putting in an arbitrator object that listens to these events and routes them
// to the nodes, calling the right function; question is, where does that object go? Also still
// inefficient because it still needs to filter by type.
// Maybe just bite the bullet and define an interface on the nodes with methods that are called
// when things change; require a mixin that defines these methods as empty.
ve.dm.DocumentSet.prototype.registerNode = function ( group, name, node ) {
	var index, offsetTuple, oldOffsetTuple,
		docIndex = this.getDocumentIndexByName( group, name ),
		groupObj = this.getGroupObj( group ),
		docSet = this;

	if ( docIndex === null ) {
		throw new Error( 'Trying to register node with nonexistent document name' );
	}
	if ( this.firstUseOffsets[ docIndex ] === undefined ) {
		this.firstUseOffsets[ docIndex ] = {
			offset: node.getOffset(),
			docIndex: node.getDocument().getParentSetIndex()
		};
	}
	offsetTuple = this.getOffsetTuple( node );

	if ( groupObj.nodes[ name ] ) {
		// Insert node into groupObj.nodes[ name ]
		index = ve.binarySearch(
			groupObj.nodes[ name ],
			function ( otherNode ) {
				return ve.compareTuples( offsetTuple, docSet.getOffsetTuple( otherNode ) );
			},
			true
		);
		groupObj.nodes[ name ].splice( index, 0, node );

		// Update groupObj.order; only needed if the new node is the first with that name
		if ( index === 0 ) {
			// Remove name from groupObj.order
			oldOffsetTuple = this.getOffsetTuple( groupObj.nodes[ name ][ 1 ] ); // Previously this was the first offset
			index = ve.binarySearch(
				groupObj.order,
				function ( otherName ) {
					if ( otherName === name ) {
						return 0;
					}
					return ve.compareTuples( oldOffsetTuple, docSet.getOffsetTuple( groupObj.nodes[ otherName ][ 0 ] ) );
				}
			);
			groupObj.order.splice( index, 1 );
			// Insert name back into groupObj.order)
			index = ve.binarySearch(
				groupObj.order,
				function ( otherName ) {
					return ve.compareTuples( offsetTuple, docSet.getOffsetTuple( groupObj.nodes[ otherName ][ 0 ] ) );
				},
				true
			);
			groupObj.order.splice( index, 0, name );
		}

	} else {
		// Create groupObj.nodes[ name ]
		groupObj.nodes[ name ] = [ node ];

		// Insert name into groupObj.order
		index = ve.binarySearch(
			groupObj.order,
			function ( otherName ) {
				return ve.compareTuples( offsetTuple, docSet.getOffsetTuple( groupObj.nodes[ otherName ][ 0 ] ) );
			},
			true
		);
		groupObj.order.splice( index, 0, name );
	}

	// SUBDOCUMENT TODO: improve me
	this.emit( 'groupUpdate', group );

};

ve.dm.DocumentSet.prototype.deregisterNode = function ( group, name, node ) {
	var index, newOffsetTuple,
		groupObj = this.getGroupObj( group ),
		docSet = this;

	// Remove node from groupObj.nodes[ name ]
	index = groupObj.nodes[ name ].indexOf( node );
	if ( index === -1 ) {
		throw new Error( 'Trying to deregister node that is not registered' );
	}
	groupObj.nodes[ name ].splice( index, 1 );

	if ( index === 0 ) {
		// We removed the first node with this name, so update the name's position
		// in groupObj.order by removing it and inserting it again
		index = groupObj.order.indexOf( name );
		if ( index === -1 ) {
			throw new Error( 'Name not found in names array when deregistering its last node' );
		}
		groupObj.order.splice( index, 1 );

		if ( groupObj.nodes[ name ].length > 0 ) {
			// Insert name back into groupObj.order
			newOffsetTuple = this.getOffsetTuple( groupObj.nodes[ name ][ 0 ] );
			index = ve.binarySearch(
				groupObj.order,
				function ( otherName ) {
					return ve.compareTuples( newOffsetTuple, docSet.getOffsetTuple( groupObj.nodes[ otherName ][ 0 ] ) );
				},
				true
			);
			groupObj.order.splice( index, 0, name );
		} else {
			// There are no nodes left with this name, so destroy its nodes array
			// and don't add it back to groupObj.order
			delete groupObj.nodes[ name ];
		}
	}

	// SUBDOCUMENT TODO: improve me
	this.emit( 'groupUpdate', group );
};

/**
 * Get the data object for a naming group, creating it if necessary. For internal use only
 *
 * @private
 * @param {string} group Name of group
 * @return {Object} Group data
 */
ve.dm.DocumentSet.prototype.getGroupObj = function ( group ) {
	var groupObj = this.documentGroups[ group ];
	if ( !groupObj ) {
		groupObj = this.documentGroups[ group ] = {
			// { name: document index }
			indexes: {},
			// { name: reservation object }
			reservations: {},
			// { oldName: uniqueName }
			uniqueNames: {},
			// { uniqueName: true }
			usedUniqueNames: {},
			// { name: [ ve.dm.Node object references in document order ] }
			nodes: {},
			// [ names in order of first use ]
			// TODO what does document order mean when there are multiple documents? :(
			order: []
		};
	}
	return groupObj;
};

ve.dm.DocumentSet.prototype.getNodesUsingName = function ( group, name ) {
	return ve.getProp( this.documentGroups, group, 'nodes', name ) || [];
};

ve.dm.DocumentSet.prototype.getNameOrder = function ( group ) {
	return this.documentGroups[ group ] && this.documentGroups[ group ].order || [];
};

// SUBDOCUMENT TODO: come up with a better name
ve.dm.DocumentSet.prototype.getNamePosition = function ( group, name ) {
	var index;
	if ( !this.documentGroups[ group ] ) {
		return null;
	}
	index = this.documentGroups[ group ].order.indexOf( name );
	return index === -1 ? null : index;
};

ve.dm.DocumentSet.prototype.getGroups = function () {
	return Object.keys( this.documentGroups );
};
