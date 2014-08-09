/*!
 * Grunt file
 *
 * @package VisualEditor
 */

/*jshint node:true */
module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-csslint' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-cssjanus' );
	grunt.loadNpmTasks( 'grunt-jscs' );
	grunt.loadNpmTasks( 'grunt-karma' );
	grunt.loadTasks( 'build/tasks' );

	// We want to use `grunt watch` to start this and karma watch together.
	grunt.renameTask( 'watch', 'runwatch' );

	var modules = grunt.file.readJSON( 'build/modules.json' ),
		moduleUtils = require( './build/moduleUtils' ),
		introBuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.buildfiles.intro' ] ),
		coreBuildFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.build' ] ),
		testFiles = moduleUtils.makeBuildList( modules, [ 'visualEditor.test' ] ).scripts;

	// FIXME: This doesn't work and you still get 404s. Bad karma.
	testFiles = testFiles.concat(
		{ pattern: 'i18n/*.json', included: false, served: true },
		{ pattern: 'lib/oojs-ui/i18n/*.json', included: false, served: true }
	);

	function demoMenu( callback ) {
		var pages = {},
			files = grunt.file.expand( 'demos/ve/pages/*.html' );
		files.forEach( function ( file ) {
			var matches = file.match( /^.*(pages\/(.+).html)$/ ),
				path = matches[1],
				name = matches[2];

			pages[name] = path;
		} );
		callback( JSON.stringify( pages, null, '\t' ).split( '\n' ).join( '\n\t\t' ) );
	}

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		clean: {
			dist: [ 'dist/*/', 'dist/*.*', 'test-coverage/*/' ]
		},
		concat: {
			buildJs: {
				dest: 'dist/visualEditor.js',
				src: introBuildFiles.scripts
					.concat( coreBuildFiles.scripts )
			},
			buildCss: {
				dest: 'dist/visualEditor.css',
				src: introBuildFiles.styles
					.concat( coreBuildFiles.styles )
			}
		},
		cssjanus: {
			dist: {
				src: 'dist/visualEditor.css',
				dest: 'dist/visualEditor.rtl.css'
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
				dest: 'dist/'
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
			desktopDemoDist: {
				targetFile: 'demos/ve/desktop-dist.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.desktop.standalone.demo.dist' ],
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
			mobileDemoDist: {
				targetFile: 'demos/ve/mobile-dist.html',
				template: 'demos/ve/demo.html.template',
				modules: modules,
				load: [ 'visualEditor.mobile.standalone.demo.dist' ],
				pathPrefix: '../../',
				indent: '\t\t',
				placeholders: { menu: demoMenu }
			}
		},
		jshint: {
			options: {
				jshintrc: true
			},
			all: [
				'*.js',
				'{.docs,build,demos,src,tests}/**/*.js'
			]
		},
		jscs: {
			src: [
				'<%= jshint.all %>',
				'!tests/ce/imetests/*.js'
			]
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc'
			},
			all: '{.docs,build,demos,src,tests}/**/*.css'
		},
		banana: {
			all: 'i18n/'
		},
		karma: {
			options: {
				files: testFiles,
				frameworks: [ 'qunit' ],
				reporters: [ 'dots' ],
				singleRun: true,
				autoWatch: false
			},
			phantomjs: {
				browsers: [ 'PhantomJS' ],
				preprocessors: {
					'src/**/*.js': [ 'coverage' ]
				},
				reporters: [ 'dots', 'coverage' ],
				coverageReporter: { reporters: [
					{ type: 'html', dir: 'test-coverage/visualeditor' },
					{ type: 'text-summary', dir: 'test-coverage/visualeditor' }
				] }
			},
			local: {
				browsers: [ 'Firefox', 'Chrome' ]
			},
			bg: {
				browsers: [ 'PhantomJS', 'Firefox', 'Chrome' ],
				singleRun: false,
				background: true
			}
		},
		runwatch: {
			files: [
				'.{csslintrc,jscsrc,jshintignore,jshintrc}',
				'<%= jshint.all %>',
				'<%= csslint.all %>'
			],
			tasks: [ 'test', 'karma:bg:run' ]
		}
	} );

	grunt.registerTask( 'lint', [ 'jshint', 'jscs', 'csslint', 'banana' ] );
	grunt.registerTask( 'unit', [ 'karma:phantomjs' ] );
	grunt.registerTask( 'build', [ 'clean', 'git-build', 'concat', 'cssjanus', 'copy', 'buildloader' ] );
	grunt.registerTask( 'test', [ 'build', 'lint', 'karma:phantomjs' ] );
	grunt.registerTask( 'watch', [ 'karma:bg:start', 'runwatch' ] );
	grunt.registerTask( 'default', 'test' );
};
