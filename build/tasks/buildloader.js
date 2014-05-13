/*!
 * Build a static loader file from a template
 */

/*jshint node:true */
module.exports = function ( grunt ) {

	grunt.registerMultiTask( 'buildloader', function () {
		var moduleName, module,
			styles = '',
			scripts = '',
			targetFile = this.data.targetFile,
			pathPrefix = this.data.pathPrefix || '',
			indent = this.data.indent || '',
			modules = this.data.modules,
			target = this.data.target,
			env = this.data.env || {},
			placeholders = this.data.placeholders || {},
			text = grunt.file.read( this.data.template ),
			done = this.async();

		function scriptTag( src ) {
			return indent + '<script src="' + pathPrefix + src.file + '"></script>';
		}

		function styleTag( src ) {
			return indent + '<link rel=stylesheet href="' + pathPrefix + src.file + '">';
		}

		function expand( src ) {
			return typeof src === 'string' ? { file: src } : src;
		}

		function filter( src ) {
			if ( src.debug && !env.debug ) {
				return false;
			}

			return true;
		}

		function placeholder( input, id, replacement, callback ) {
			var output,
				rComment = new RegExp( '^[^\\S\\n]*<!-- ' + id + ' -->[^\\S\\n]*$', 'm' );
			if ( typeof replacement === 'function' ) {
				replacement( function ( response ) {
					output = input.replace( rComment, response );
					callback( output );
				} );
			} else {
				output = input.replace( rComment, replacement );
				callback( output );
			}
		}

		for ( moduleName in modules ) {
			module = modules[moduleName];
			if ( target && module.targets && module.targets.indexOf( target ) === -1 ) {
				continue;
			}
			if ( module.scripts ) {
				scripts += indent + '<!-- ' + moduleName + ' -->\n';
				scripts += module.scripts
					.map( expand ).filter( filter ).map( scriptTag )
					.join( '\n' ) + '\n';
				scripts += '\n';
			}
			if ( module.styles ) {
				styles += indent + '<!-- ' + moduleName + ' -->\n';
				styles += module.styles
					.map( expand ).filter( filter ).map( styleTag )
					.join( '\n' ) + '\n';
				styles += '\n';
			}
		}

		scripts += indent + '<script>ve.init.platform.setModulesUrl( \'' + pathPrefix +
			'modules\' );</script>';

		// Strip last 2 line breaks since we only want them between sections
		styles = styles.slice( 0, -2 );

		placeholders.styles = styles;
		placeholders.scripts = scripts;

		grunt.util.async.forEachSeries(
			Object.keys(placeholders),
			function ( id, next ) {
				placeholder( text, id.toUpperCase(), placeholders[id], function ( newText ) {
					text = newText;
					next();
				} );
			},
			function () {
				grunt.file.write( targetFile, text );
				grunt.log.ok( 'File "' + targetFile + '" written.' );

				done();
			}
		);

	} );

};
