/*!
 * Build a static loader file from a template
 */

/*jshint node:true */
module.exports = function ( grunt ) {

	grunt.registerMultiTask( 'buildloader', function () {
		var module,
			dependency,
			dependencies,
			styles = '',
			scripts = '',
			targetFile = this.data.targetFile,
			pathPrefix = this.data.pathPrefix || '',
			indent = this.data.indent || '',
			modules = this.data.modules,
			targets = this.data.targets,
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

		function buildDependencyList( modules, targets ) {
			var i, j, k, target, list = [];

			for ( i = 0; i < targets.length; i++ ) {
				target = targets[i];

				if ( !modules.hasOwnProperty( target ) )
				{
					throw new Error( 'Dependency ' + target + ' not found' );
				}

				// Add in any dependencies' dependencies
				if ( modules[target].hasOwnProperty( 'dependencies' ) ) {
					list = ( buildDependencyList( modules, modules[target].dependencies ) ).concat( list );
				}

				// Append target to the end of the current list
				list.push( target );
			}

			// We always want to retain the first entry of duplicates
			for ( j = 0; j < list.length; j++) {
				for ( k = j + 1; k < list.length; k++) {
					if ( list[j] === list[k] ) {
						list.splice(k--, 1);
					}
				}
			}

			return list;
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

		dependencies = buildDependencyList( modules, targets );
		for ( dependency in dependencies ) {
			module = dependencies[dependency];
			if ( modules[module].scripts ) {
				scripts += indent + '<!-- ' + module + ' -->\n';
				scripts += modules[module].scripts
					.map( expand ).filter( filter ).map( scriptTag )
					.join( '\n' ) + '\n';
				scripts += '\n';
			}
			if ( modules[module].styles ) {
				styles += indent + '<!-- ' + module + ' -->\n';
				styles += modules[module].styles
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
