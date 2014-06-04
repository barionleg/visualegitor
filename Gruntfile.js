/*!
 * Grunt file
 *
 * @package VisualEditor
 */

/*jshint node:true */
module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-csslint' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-qunit' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-jscs-checker' );
	grunt.loadTasks( 'build/tasks' );

	var modules = grunt.file.readJSON( 'build/modules.json' ),
		moduleUtils = require( './build/moduleUtils' ),
		introBuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.buildfiles.intro' ] ),
		outroBuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.buildfiles.outro' ] ),
		desktopSABuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.desktop.standalone' ] ),
		mobileSABuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.mobile.standalone' ] );

	function demoMenu( callback ) {
		var html = [],
			files = grunt.file.expand( 'demos/ve/pages/*.html' );
		files.forEach( function ( file ) {
			file = file.replace( /^.*(pages\/.+.html)$/, '$1' );
			var name = file.slice( 6, -5 );
			html.push(
				'\t\t\t<li><a href="#!/src/' + file + '" data-page-src="' + file +
					'">' + name + '</a></li>'
			);
		} );
		callback( html.join( '\n' ) );
	}

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		clean: {
			dist: [ 'dist/*/', 'dist/*.*' ]
		},
		concat: {
			desktopSAjs: {
				dest: 'dist/visualEditor.desktop.standalone.js',
				src: introBuildFiles.scripts
					.concat(desktopSABuildFiles.scripts)
					.concat(outroBuildFiles.scripts)
			},
			desktopSAcss: {
				dest: 'dist/visualEditor.desktop.standalone.css',
				src: introBuildFiles.styles
					.concat(desktopSABuildFiles.styles)
					.concat(outroBuildFiles.styles)
			},
			mobileSAjs: {
				dest: 'dist/visualEditor.mobile.standalone.js',
				src: introBuildFiles.scripts
					.concat(mobileSABuildFiles.scripts)
					.concat(outroBuildFiles.scripts)
			},
			mobileSAcss: {
				dest: 'dist/visualEditor.mobile.standalone.css',
				src: introBuildFiles.styles
					.concat(mobileSABuildFiles.styles)
					.concat(outroBuildFiles.styles)
			}
		},
		copy: {
			images: {
				src: 'src/ui/styles/images/**/*.*',
				strip: 'src/ui/styles/',
				dest: 'dist/'
			},
			i18n: {
				src: 'i18n/*.json',
				dest: 'dist'
			}
		},

		buildloader: {
			iframe: {
				targetFile: '.docs/eg-iframe.html',
				template: '.docs/eg-iframe.html.template',
				modules: modules,
				load: [ 'visualEditor.desktop.standalone' ],
				pathPrefix: '../',
				indent: '\t\t'
			},
			desktopDemo: {
				targetFile: 'demos/ve/desktop.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.desktop.standalone.demo' ],
				env: {
					debug: true
				},
				pathPrefix: '../../',
				indent: '\t\t',
				placeholders: { menu: demoMenu }
			},
			mobileDemo: {
				targetFile: 'demos/ve/mobile.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.mobile.standalone.demo' ],
				env: {
					debug: true
				},
				pathPrefix: '../../',
				indent: '\t\t',
				placeholders: { menu: demoMenu }
			},
			test: {
				targetFile: 'modules/ve/test/index.html',
				template: 'modules/ve/test/index.html.template',
				modules: modules,
				env: {
					test: true
				},
				load: [ 'visualEditor.test' ],
				pathPrefix: '../../../',
				indent: '\t\t'
			}
		},
		jshint: {
			options: {
				jshintrc: true
			},
			all: [
				'*.js',
				'{.docs,build,demos,modules}/**/*.js'
			]
		},
		jscs: {
			src: [
				'<%= jshint.all %>',
				'!modules/ve/test/ce/imetests/*.js'
			]
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc'
			},
			all: '{.docs,build,demos,modules}/**/*.css'
		},
		banana: {
			all: 'modules/ve/i18n/'
		},
		qunit: {
			unicodejs: 'modules/unicodejs/index.html',
			ve: 'modules/ve/test/index.html'
		},
		watch: {
			files: [
				'.{csslintrc,jscsrc,jshintignore,jshintrc}',
				'<%= jshint.all %>',
				'<%= csslint.all %>',
				'<%= qunit.ve %>',
				'<%= qunit.unicodejs %>'
			],
			tasks: 'test'
		}
	} );

	grunt.registerTask( 'lint', [ 'jshint', 'jscs', 'csslint', 'banana' ] );
	grunt.registerTask( 'unit', 'qunit' );
	grunt.registerTask( 'build', [ 'clean', 'git-build', 'concat', 'copy', 'buildloader' ] );
	grunt.registerTask( 'test', [ 'build', 'lint', 'unit' ] );
	grunt.registerTask( 'default', 'test' );
};
