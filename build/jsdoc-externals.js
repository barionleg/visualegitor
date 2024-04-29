'use strict';

// eslint-disable-next-line n/no-missing-require
const helper = require( 'jsdoc/util/templateHelper' );
const conf = require( '../.jsdoc.json' );
const linkMap = ( conf.templates && conf.templates.wmf && conf.templates.wmf.linkMap ) || {};

const prefixes = {
	'OO.ui.': 'https://doc.wikimedia.org/oojs-ui/master/js/',
	'OO.': 'https://doc.wikimedia.org/oojs/master/'
};

/**
 * Automatically register links to known external types when they are encountered
 */
exports.handlers = {
	newDoclet: function ( e ) {
		const types = [];

		if ( e.doclet.kind === 'class' ) {
			if ( e.doclet.augments ) {
				types.push.apply( types, e.doclet.augments );
			}

			if ( e.doclet.implements ) {
				types.push.apply( types, e.doclet.implements );
			}

			if ( e.doclet.mixes ) {
				types.push.apply( types, e.doclet.mixes );
			}

			if ( e.doclet.params ) {
				e.doclet.params.forEach( function ( param ) {
					if ( param.type && param.type.names ) {
						types.push.apply( types, param.type.names );
					}
				} );
			}

			// Check if the class returns the target class type
			if ( e.doclet.returns ) {
				e.doclet.returns.forEach( function ( returnType ) {
					if ( returnType.type && returnType.type.names ) {
						types.push.apply( types, returnType.type.names );
					}
				} );
			}
		} else if ( e.doclet.kind === 'function' ) { // Check if this is a function/method
			// Check if the function/method has parameters with the target class type
			if ( e.doclet.params ) {
				e.doclet.params.forEach( function ( param ) {
					if ( param.type && param.type.names ) {
						types.push.apply( types, param.type.names );
					}
				} );
			}

			// Check if the function/method returns the target class type
			if ( e.doclet.returns ) {
				e.doclet.returns.forEach( function ( returnType ) {
					if ( returnType.type && returnType.type.names ) {
						types.push.apply( types, returnType.type.names );
					}
				} );
			}
		}

		types.forEach( ( type ) => {
			Object.keys( prefixes ).some( ( prefix ) => {
				if (
					// Ignore anything explicitly defined in the linkMap
					!linkMap[ type ] &&
					type.startsWith( prefix )
				) {
					helper.registerLink( type, prefixes[ prefix ] + type + '.html' );
					// Break, so we don't match a shorter prefix
					return true;
				}
				return false;
			} );
		} );
	}
};
