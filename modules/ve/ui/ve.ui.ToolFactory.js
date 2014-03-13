/*!
 * VisualEditor UserInterface ToolFactory class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Factory for tools.
 *
 * @class
 * @extends OO.ui.ToolFactory
 *
 * @constructor
 */
ve.ui.ToolFactory = function OoUiToolFactory() {
	// Parent constructor
	OO.ui.ToolFactory.call( this );
};

/* Inheritance */

OO.inheritClass( ve.ui.ToolFactory, OO.ui.ToolFactory );

/* Methods */

/**
 * Get a list of tools from a set of annotations.
 *
 * The lowest compatible item in each inheritance chain will be used.
 *
 * @method
 * @param {ve.dm.AnnotationSet} annotations Annotations to be inspected
 * @returns {string[]} Symbolic names of tools that can be used to inspect annotations
 */
ve.ui.ToolFactory.prototype.getToolsForAnnotations = function ( annotations ) {
	if ( annotations.isEmpty() ) {
		return [];
	}

	var i, len,
		arr = annotations.get(),
		tools = [],
		matches = [];

	for ( i = 0, len = arr.length; i < len; i++ ) {
		tools = tools.concat( this.collectCompatibleTools( arr[i] ) );
	}
	for ( i = 0, len = tools.length; i < len; i++ ) {
		matches.push( tools[i].static.name );
	}

	return matches;
};

/**
 * Get a tool for a node.
 *
 * The lowest compatible item in each inheritance chain will be used.
 *
 * @method
 * @param {ve.dm.Node} node Node to be edited
 * @returns {string[]} Symbolic name of tool that can be used to edit node
 */
ve.ui.ToolFactory.prototype.getToolsForNode = function ( node ) {
	if ( !node.isInspectable() ) {
		return [];
	}

	var i, len, tools,
		matches = [];

	tools = this.collectCompatibleTools( node );
	for ( i = 0, len = tools.length; i < len; i++ ) {
		matches.push( tools[i].static.name );
	}

	return matches;
};

/**
 * Collect the most specific compatible tools for an annotation or node.
 *
 * @param {ve.dm.Annotation|ve.dm.Node} subject Annotation or node
 * @returns {Function[]} List of comptible tools
 */
ve.ui.ToolFactory.prototype.collectCompatibleTools = function ( subject ) {
	var i, len, name, candidate,
		candidates = [];

	for ( name in this.registry ) {
		candidate = this.registry[name];
		if ( candidate.static.isCompatibleWith( subject ) ) {
			for ( i = 0, len = candidates.length; i < len; i++ ) {
				if ( candidate.prototype instanceof candidates[i] ) {
					// Candidate is a subclass of existing candidate, replace existing candidate
					candidates.splice( i, 1, candidate );
				} else if ( !( candidates[i].prototype instanceof candidate ) ) {
					// Candidate is of a new inheritance chain, add candidate
					candidates.push( candidate );
				}
			}
			if ( candidates.length === 0 ) {
				candidates.push( candidate );
			}
		}
	}

	return candidates;
};

/* Initialization */

ve.ui.toolFactory = new ve.ui.ToolFactory();
