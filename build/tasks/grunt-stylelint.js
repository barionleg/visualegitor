/*!
 * Run CSS files through stylelint and complain
 */

/*jshint node:true */
module.exports = function ( grunt ) {

	grunt.registerMultiTask( 'stylelint', function () {
		var stylelintrc, attribute,
			options = this.options( {
				stylelintrc: '.stylelintrc'
			} ),
			files = this.filesSrc,
			fileCount = files.length,
			stylelintrcJSON = grunt.file.read( options.stylelintrc ),
			ok = true,

			styleLint = require( 'stylelint' );

		try {
			stylelintrc = JSON.parse( stylelintrcJSON );
		} catch ( e ) {
			grunt.log.error( 'Could not parse ' + options.stylelintrc + ': ' + e );
		}

		for ( attribute in stylelintrc.rules ) {
			styleLint.rules[ attribute ] = stylelintrc.rules[ attribute ];
		}

		files.forEach( function ( filepath ) {
			grunt.log.error( 'File: ' + filepath );
			grunt.log.error( styleLint.process( filepath ) );
		} );

	} );

};
