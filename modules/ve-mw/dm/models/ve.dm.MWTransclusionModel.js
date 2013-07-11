/*!
 * VisualEditor DataModel MWTransclusionModel class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/*global mw */

( function () {
var hasOwn = Object.hasOwnProperty,
	specCache = {};

/**
 * MediaWiki transclusion model.
 *
 * @class
 * @mixins ve.EventEmitter
 *
 * @constructor
 */
ve.dm.MWTransclusionModel = function VeDmMWTransclusionModel() {
	// Mixin constructors
	ve.EventEmitter.call( this );

	// Properties
	this.parts = [];
	this.uid = 0;
	this.requests = [];
	this.queue = [];
};

/* Inheritance */

ve.mixinClass( ve.dm.MWTransclusionModel, ve.EventEmitter );

/* Events */

/**
 * @event add
 * @param {ve.dm.MWTransclusionPartModel} part Added part
 */

/**
 * @event remove
 * @param {ve.dm.MWTransclusionPartModel} part Removed part
 */

/* Methods */

/**
 * Load from transclusion data, and fetch spec from server.
 *
 * @method
 * @param {Object} data Transclusion data
 * @returns {jQuery.Promise} Promise, resolved when spec is loaded
 */
ve.dm.MWTransclusionModel.prototype.load = function ( data ) {
	var i, len, key, part, template;

	// Convert single part format to multi-part format
	if ( data.params && data.target ) {
		data = { 'parts': [ { 'template': data } ] };
	}

	if ( ve.isArray( data.parts ) ) {
		for ( i = 0, len = data.parts.length; i < len; i++ ) {
			part = data.parts[i];
			if ( part.template ) {
				template = new ve.dm.MWTemplateModel( this, part.template.target, 'data' );
				for ( key in part.template.params ) {
					template.addParameter(
						new ve.dm.MWTemplateParameterModel(
							template, key, part.template.params[key].wt, 'data'
						)
					);
				}
				this.queue.push( { 'part': template } );
			} else if ( typeof part === 'string' ) {
				this.queue.push( {
					'part': new ve.dm.MWTransclusionContentModel( this, part, 'data' )
				} );
			}
		}
		setTimeout( ve.bind( this.fetch, this ) );
	}
};

/**
 * Process one or more queue items.
 *
 * @method
 * @param {Object[]} queue List of objects containing parts to add and optionally indexes to add
 *   them at, if no index is given parts will be added at the end
 * @emits add For each item added
 */
ve.dm.MWTransclusionModel.prototype.process = function ( queue ) {
	var i, len, item, title, index;

	for ( i = 0, len = queue.length; i < len; i++ ) {
		item = queue[i];
		if ( item.part instanceof ve.dm.MWTemplateModel ) {
			title = item.part.getTitle();
			if ( hasOwn.call( specCache, title ) && specCache[title] ) {
				item.part.getSpec().extend( specCache[title] );
			}
		}
		index = item.index === undefined ? this.parts.length : item.index;
		this.parts.splice( index, 0, item.part );
		this.emit( 'add', item.part );
	}
};

ve.dm.MWTransclusionModel.prototype.fetch = function () {
	if ( !this.queue.length ) {
		return;
	}

	var i, len, item, title, request,
		titles = [],
		specs = {},
		queue = this.queue.slice();

	// Clear shared queue for future calls
	this.queue.length = 0;

	// Get unique list of template titles that aren't already loaded
	for ( i = 0, len = queue.length; i < len; i++ ) {
		item = queue[i];
		if ( item.part instanceof ve.dm.MWTemplateModel ) {
			title = item.part.getTitle();
			if (
				// Skip titles that don't have a resolvable href
				title &&
				// Skip titles outside the template namespace
				title.charAt( 0 ) !== ':' &&
				// Skip already cached data
				!hasOwn.call( specCache, title ) &&
				// Skip duplicate titles in the same batch
				ve.indexOf( title, titles ) === -1
			) {
				titles.push( title );
			}
		}
	}

	// Bypass server for empty lists
	if ( !titles.length ) {
		setTimeout( ve.bind( this.process, this, queue ) );
		return;
	}

	// Request template specs from server
	request = $.ajax( {
		'url': mw.util.wikiScript( 'api' ),
		'dataType': 'json',
		'data': {
			'format': 'json',
			'action': 'templatedata',
			'titles': titles.join( '|' )
		}
	} )
		.done( function ( data ) {
			var i, len, id;

			if ( data && data.pages ) {
				// Keep spec data on hand for future use
				for ( id in data.pages ) {
					specs[data.pages[id].title] = data.pages[id];
				}
				// Cross-reference under normalized titles
				if ( data.normalized ) {
					for ( i = 0, len = data.normalized.length; i < len; i++ ) {
						// Only define the alias if the target exists, otherwise
						// we create a new property with an invalid "undefined" value.
						if ( hasOwn.call( specs, data.normalized[i].to ) ) {
							specs[data.normalized[i].from] = specs[data.normalized[i].to];
						}
					}
				}
				// Prevent asking again for templates that have no specs
				for ( i = 0, len = titles.length; i < len; i++ ) {
					title = titles[i];
					if ( !specs[title] ) {
						specs[title] = null;
					}
				}

				ve.extendObject( specCache, specs );
			}
		} )
		.always( ve.bind( function () {
			// Prune completed request
			var index = ve.indexOf( request, this.requests );
			if ( index !== -1 ) {
				this.requests.splice( index, 1 );
			}
			// Actually add queued items
			this.process( queue );
		}, this ) );

	this.requests.push( request );
};

/**
 * Abort any pending requests.
 *
 * @method
 */
ve.dm.MWTransclusionModel.prototype.abortRequests = function () {
	var i, len;

	for ( i = 0, len = this.requests.length; i < len; i++ ) {
		this.requests[i].abort();
	}
	this.requests.length = 0;
};

/**
 * Get plain object representation of template transclusion.
 *
 * @method
 * @returns {Object|null} Plain object representation, or null if empty
 */
ve.dm.MWTransclusionModel.prototype.getPlainObject = function () {
	var i, len, part, template, name, params,
		obj = { 'parts': [] };

	for ( i = 0, len = this.parts.length; i < len; i++ ) {
		part = this.parts[i];
		if ( part instanceof ve.dm.MWTemplateModel ) {
			template = { 'target': part.getTarget(), 'params': {} };
			params = part.getParameters();
			for ( name in params ) {
				template.params[params[name].getOriginalName()] = { 'wt': params[name].getValue() };
			}
			obj.parts.push( { 'template': template } );
		} else if ( part instanceof ve.dm.MWTransclusionContentModel ) {
			obj.parts.push( part.getValue() );
		}
	}

	if ( obj.parts.length === 0 ) {
		return null;
	}

	// Use single-part format when possible
	if ( obj.parts.length === 1 ) {
		obj = obj.parts[0].template;
	}

	return obj;
};

/**
 * Get a unique ID for a part in the transclusion.
 *
 * This is used to give parts unique IDs, and returns a different value each time it's called.
 *
 * @method
 * @returns {number} Unique ID
 */
ve.dm.MWTransclusionModel.prototype.getUniquePartId = function () {
	return this.uid++;
};

/**
 * Add part.
 *
 * Added asynchronously, but order is preserved.
 *
 * @method
 * @param {ve.dm.MWTransclusionPartModel} part Part to add
 * @param {number} [index] Specific index to add content at, defaults to the end
 * @throws {Error} If part is not valid
 */
ve.dm.MWTransclusionModel.prototype.addPart = function ( part, index ) {
	if ( !( part instanceof ve.dm.MWTransclusionPartModel ) ) {
		throw new Error( 'Invalid transclusion part' );
	}
	this.queue.push( { 'part': part, 'index': index } );
	// Fetch on next yield to process items in the queue together, subsequent calls to fetch will
	// have no effect because the queue will be clear
	setTimeout( ve.bind( this.fetch, this ) );
};

/**
 * Remove a part.
 *
 * @method
 * @param {ve.dm.MWTransclusionPartModel} part Part to remove
 * @emits remove
 */
ve.dm.MWTransclusionModel.prototype.removePart = function ( part ) {
	var index = ve.indexOf( part, this.parts );
	if ( index !== -1 ) {
		this.parts.splice( index, 1 );
		this.emit( 'remove', part );
	}
};

/**
 * Get all parts.
 *
 * @method
 * @returns {ve.dm.MWTransclusionPartModel[]} Parts in transclusion
 */
ve.dm.MWTransclusionModel.prototype.getParts = function () {
	return this.parts;
};

/**
 * Get part by its ID.
 *
 * Matching is performed against the first section of the `id`, delimited by a '/'.
 *
 * @method
 * @param {string} id Part ID
 * @returns {ve.dm.MWTransclusionPartModel|null} Part with matching ID, if found
 */
ve.dm.MWTransclusionModel.prototype.getPartFromId = function ( id ) {
	var i, len,
		// For ids from ve.dm.MWTemplateParameterModel, compare against the part id
		// of the parameter instead of the entire model id (e.g. "part_1" instead of "part_1/foo").
		partId = id.split( '/' )[0];

	for ( i = 0, len = this.parts.length; i < len; i++ ) {
		if ( this.parts[i].getId() === partId ) {
			return this.parts[i];
		}
	}
	return null;
};

}() );
