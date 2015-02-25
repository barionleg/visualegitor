/*!
 * VisualEditor UserInterface ModeledFactory class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Mixin for factories that relate to models.
 *
 * @class
 * @extends OO.ui.ModeledFactory
 *
 * @constructor
 */
ve.ui.ModeledFactory = function VeUiModeledFactory() {
	//
};

/* Inheritance */

OO.initClass( ve.ui.ModeledFactory );

/* Methods */

/**
 * Get a list of symbolic names for classes related to a list of models.
 *
 * The lowest compatible item in each inheritance chain will be used.
 *
 * @param {ve.dm.Model[]} models Models to find relationships with
 * @returns {Object[]} List of objects containing `name` and `model` properties, representing
 *   each compatible class's symbolic name and the model it is compatible with
 */
ve.ui.ModeledFactory.prototype.getRelatedItems = function ( models ) {
	var i, iLen, j, jLen, name, classes, model,
		registry = this.registry,
		names = {},
		matches = [];

	/**
	 * Collect the most specific compatible classes for a model.
	 *
	 * @private
	 * @param {ve.dm.Model} model Model to find compatability with
	 * @returns {Function[]} List of compatible classes
	 */
	function collect( model ) {
		var i, len, name, candidate, add, modelClasses,
			candidates = [];

		for ( name in registry ) {
			candidate = registry[name];
			modelClasses = candidate.static.modelClasses;
			if ( modelClasses && ve.isInstanceOfAny( model, modelClasses ) ) {
				add = true;
				for ( i = 0, len = candidates.length; i < len; i++ ) {
					if ( candidate.prototype instanceof candidates[i] ) {
						candidates.splice( i, 1, candidate );
						add = false;
						break;
					} else if ( candidates[i].prototype instanceof candidate ) {
						add = false;
						break;
					}
				}
				if ( add ) {
					candidates.push( candidate );
				}
			}
		}

		return candidates;
	}

	// Collect compatible classes and the models they are specifically compatible with,
	// discarding class's with duplicate symbolic names
	for ( i = 0, iLen = models.length; i < iLen; i++ ) {
		model = models[i];
		classes = collect( model );
		for ( j = 0, jLen = classes.length; j < jLen; j++ ) {
			name = classes[j].static.name;
			if ( !names[name] ) {
				matches.push( { name: name, model: model } );
			}
			names[name] = true;
		}
	}

	return matches;
};
