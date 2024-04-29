'use strict';

// eslint-disable-next-line n/no-missing-require
const helper = require( 'jsdoc/util/templateHelper' );
const oojs = require( 'oojs' );
global.OO = oojs;
global.$ = {};
global.window = {};
require( 'oojs-ui' );

exports.handlers = {
	parseBegin() {
		Object.keys( global.OO ).forEach( ( prop ) => {
			if ( prop[ 0 ] === prop[ 0 ].toUpperCase() ) {
				helper.registerLink( `OO.${ prop }`, `https://doc.wikimedia.org/oojs/master/OO.${ prop }.html` );
			}
		} );

		Object.keys( global.OO.ui ).forEach( ( prop ) => {
			if ( prop[ 0 ] === prop[ 0 ].toUpperCase() ) {
				helper.registerLink( `OO.ui.${ prop }`, `https://doc.wikimedia.org/oojs-ui/master/js/OO.ui.${ prop }.html` );
				console.log(`OO.ui.${ prop }`, `https://doc.wikimedia.org/oojs-ui/master/js/OO.ui.${ prop }.html`);
			}
		} );

		Object.keys( global.OO.ui.mixin ).forEach( ( prop ) => {
			if ( prop[ 0 ] === prop[ 0 ].toUpperCase() ) {
				helper.registerLink( `OO.ui.mixin.${ prop }`, `https://doc.wikimedia.org/oojs-ui/master/js/OO.ui.mixin.${ prop }.html` );
			}
		} );
	}
};
