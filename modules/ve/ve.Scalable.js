/*!
 * VisualEditor Scalable class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Scalable object.
 *
 * @class
 * @abstract
 *
 * @constructor
 * @param {Object} [config] Configuration options
 * @cfg {boolean} [config.fixedRatio=true] Object has a fixed aspect ratio
 * @cfg {Object} [config.currentDimensions] Current dimensions, width & height
 * @cfg {Object} [config.originalDimensions] Original dimensions, width & height
 * @cfg {Object} [config.maxDimensions] Maximum dimensions, width & height
 * @cfg {Object} [config.minDimensions] Minimum dimensions, width & height
 */
ve.Scalable = function VeScalable( config ) {
	config = ve.extendObject( {
		'fixedRatio': true
	}, config );

	// Properties
	this.fixedRatio = config.fixedRatio;
	this.currentDimensions = null;
	this.originalDimensions = null;
	this.maxDimensions = null;
	this.minDimensions = null;
	this.ratio = null;
	this.valid = null;

	if ( config.currentDimensions ) {
		this.setCurrentDimensions( config.currentDimensions );
	}
	if ( config.originalDimensions ) {
		this.setOriginalDimensions( config.originalDimensions );
	}
	if ( config.maxDimensions ) {
		this.setMaxDimensions( config.maxDimensions );
	}
	if ( config.minDimensions ) {
		this.setMinDimensions( config.minDimensions );
	}
};

/**
 * Set the fixed aspect ratio from specified dimensions.
 *
 * @param {Object} dimensions Dimensions object with width & height
 */
ve.Scalable.prototype.setRatioFromDimensions = function ( dimensions ) {
	if ( dimensions.width && dimensions.height ) {
		this.ratio = dimensions.width / dimensions.height;
	}
};

/**
 * Set the original dimensions of an image
 *
 * @param {Object} dimensions Dimensions object with width & height
 */
ve.Scalable.prototype.setCurrentDimensions = function ( dimensions ) {
	this.currentDimensions = ve.copy( dimensions );
	// Only use current dimensions for ratio if it isn't set
	if ( this.fixedRatio && !this.ratio ) {
		this.setRatioFromDimensions( this.getCurrentDimensions() );
	}
	this.valid = null;
};

/**
 * Set the original dimensions of an image
 *
 * @param {Object} dimensions Dimensions object with width & height
 */
ve.Scalable.prototype.setOriginalDimensions = function ( dimensions ) {
	this.originalDimensions = ve.copy( dimensions );
	// Always overwrite ratio
	if ( this.fixedRatio ) {
		this.setRatioFromDimensions( this.getOriginalDimensions() );
	}
};

/**
 * Set the maximum dimensions of an image
 *
 * @param {Object} dimensions Dimensions object with width & height
 */
ve.Scalable.prototype.setMaxDimensions = function ( dimensions ) {
	this.maxDimensions = ve.copy( dimensions );
	this.valid = null;
};

/**
 * Set the minimum dimensions of an image
 *
 * @param {Object} dimensions Dimensions object with width & height
 */
ve.Scalable.prototype.setMinDimensions = function ( dimensions ) {
	this.minDimensions = ve.copy( dimensions );
	this.valid = null;
};

/**
 * Get the original dimensions of an image
 *
 * @returns {Object} Dimensions object with width & height
 */
ve.Scalable.prototype.getCurrentDimensions = function () {
	return this.currentDimensions;
};

/**
 * Get the original dimensions of an image
 *
 * @returns {Object} Dimensions object with width & height
 */
ve.Scalable.prototype.getOriginalDimensions = function () {
	return this.originalDimensions;
};

/**
 * Get the maximum dimensions of an image
 *
 * @returns {Object} Dimensions object with width & height
 */
ve.Scalable.prototype.getMaxDimensions = function () {
	return this.maxDimensions;
};

/**
 * Get the minimum dimensions of an image
 *
 * @returns {Object} Dimensions object with width & height
 */
ve.Scalable.prototype.getMinDimensions = function () {
	return this.minDimensions;
};

/**
 * Get the fixed aspect ratio (width/height)
 *
 * @returns {number} Aspect ratio
 */
ve.Scalable.prototype.getRatio = function () {
	return this.ratio;
};

/**
 * Check if the object has a fixed ratio
 *
 * @returns {boolean} The object has a fixed ratio
 */
ve.Scalable.prototype.isFixedRatio = function () {
	return this.fixedRatio;
};

/**
 * Get the current scale of the object
 *
 * @returns {number|null} A scale (1=100%), or null if not applicable
 */
ve.Scalable.prototype.getCurrentScale = function () {
	if ( !this.isFixedRatio() || !this.getCurrentDimensions() || !this.getOriginalDimensions() ) {
		return null;
	}
	return this.getCurrentDimensions().width / this.getOriginalDimensions().width;
};

/**
 * Get a set of dimensions bounded by current restrictions, from specified dimensions
 *
 * @param {Object} dimensions Dimensions object with width & height
 * @param {number} [grid] Optional grid size to snap to
 * @returns {Object} Dimensions object with width & height
 */
ve.Scalable.prototype.getBoundedDimensions = function ( dimensions, grid ) {
	var ratio, snap, snapMin, snapMax,
		maxDimensions = this.getMaxDimensions(),
		minDimensions = this.getMinDimensions();

	// Don't modify the input
	dimensions = ve.copy( dimensions );

	// Bound to min/max
	if ( minDimensions ) {
		dimensions.width = Math.max( dimensions.width, this.minDimensions.width );
		dimensions.height = Math.max( dimensions.height, this.minDimensions.height );
	}
	if ( maxDimensions ) {
		dimensions.width = Math.min( dimensions.width, this.maxDimensions.width );
		dimensions.height = Math.min( dimensions.height, this.maxDimensions.height );
	}

	// Bound to ratio
	if ( this.isFixedRatio() ) {
		ratio = dimensions.width / dimensions.height;
		if ( ratio < this.getRatio() ) {
			dimensions.height = dimensions.width / this.getRatio();
		} else {
			dimensions.width = dimensions.height * this.getRatio();
		}
	}

	// Snap to grid
	if ( grid ) {
		snapMin = minDimensions ? Math.ceil( minDimensions.width / grid ) : -Infinity;
		snapMax = maxDimensions ? Math.floor( maxDimensions.width / grid ) : Infinity;
		snap = Math.round( dimensions.width / grid );
		dimensions.width = Math.max( Math.min( snap, snapMax ), snapMin ) * grid;
		if ( this.isFixedRatio() ) {
			// If the ratio is fixed we can't snap both to the grid, so just snap the width
			dimensions.height = dimensions.width / this.getRatio();
		} else {
			snapMin = minDimensions ? Math.ceil( minDimensions.height / grid ) : -Infinity;
			snapMax = maxDimensions ? Math.floor( maxDimensions.height / grid ) : Infinity;
			snap = Math.round( dimensions.height / grid );
			dimensions.height = Math.max( Math.min( snap, snapMax ), snapMin ) * grid;
		}
	}

	return dimensions;
};

/**
 * Checks whether the current dimensions are numeric and within range
 *
 * @returns {boolean} Current dimensions are valid
 */
ve.Scalable.prototype.isCurrentDimensionsValid = function () {
	if ( this.valid === null ) {
		var dimensions = this.getCurrentDimensions(),
			maxDimensions = this.getMaxDimensions(),
			minDimensions = this.getMinDimensions();

		this.valid = (
			$.isNumeric( dimensions.width ) &&
			$.isNumeric( dimensions.height ) &&
			(
				!this.minDimensions || (
					dimensions.width >= minDimensions.width &&
					dimensions.height >= minDimensions.height
				)
			) &&
			(
				!this.maxDimensions || (
					dimensions.width <= maxDimensions.width &&
					dimensions.height <= maxDimensions.height
				)
			)
		);
	}
	return this.valid;
};

/**
 * Clear all values.
 */
ve.Scalable.prototype.clear = function () {
	this.currentDimensions = null;
	this.originalDimensions = null;
	this.maxDimensions = null;
	this.minDimensions = null;
	this.ratio = null;
	this.valid = null;
};
