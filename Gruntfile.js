/**
 * Here we go.
 */
module.exports = function(grunt) {

	'use strict';
	
	require('load-grunt-tasks')(grunt);

	var PORT= 10001;


	// Config.....................................................................

	grunt.initConfig ({

		sitemap_gui: [
			['Spirits', '/gui/index.html'],
			['Lifecycle', '/gui/lifecycle.html'],
			['Callbacks', '/gui/callbacks.html'],
			['Plugins', '/gui/plugins.html', [
				['action', '/gui/plugin-action.html'],
				['att', '/gui/plugin-att.html'],
				['box', '/gui/plugin-box.html'],
				['broadcast', '/gui/plugin-broadcast.html'],
				['config', '/gui/plugin-config.html'],
				['css', '/gui/plugin-css.html'],
				['dom', '/gui/plugin-dom.html'],
				['event', '/gui/plugin-event.html'],
				['life', '/gui/plugin-life.html'],
				['tick', '/gui/plugin-tick.html']
			]],
			['Classes', '/gui/classes.html'],
			['Projects', '/gui/projects.html'],
			['Caveats', '/gui/caveats.html'],
			['Contribute', '/gui/contribute.html']
		],

		sitemap_edb: [
			['Types', '/edb/index.html', [
				['Objects', '/edb/objects.html'],
				['Arrays', '/edb/arrays.html']
			]],
			['Output', '/edb/output.html'],
			['Observers', '/edb/observers.html'],
			['Plugins', '/edb/plugins.html']
		],

		// cleanup previous build
		clean: [
			'css/*.css',
			'js/*.js',
			'js/*.map'
		],

		// fetch latest spiritual (if found on disk)
		guibundles : {
			gui : {
				options : {
					banner : (
						'/**\n' +
						' * Spiritual GUI\n' +
						' * (c) 2015 Wunderbyte\n' +
						' * Spiritual is freely distributable under the MIT license.\n' +
						' */\n'
					 )
				},
				files : {
					'src/js/libs/spiritual-gui.js' : [
						'../spiritual-gui/src/gui@wunderbyte.com/build.json',
						'../spiritual-gui/src/gui-spirits@wunderbyte.com/build.json'
					]
				}
			},
			edb: {
				options : {
					banner : (
						'/**\n' +
						' * Spiritual EDB\n' +
						' * (c) 2015 Wunderbyte\n' +
						' * Spiritual is freely distributable under the MIT license.\n' +
						' */\n'
					 )
				},
				files: {
					'src/js/libs/spiritual-edb.js' : [
						'../spiritual-edb/src/edb@wunderbyte.com/build.json',
						'../spiritual-edbml/src/edbml@wunderbyte.com/build.json'
					]
				}
			},
			ghp : {
				files : {
					'temp/ghp-compiled.js' : [
						'src/js/ghp@wunderbyte.com/build.json'
					]
				}
			},
		},

		// compile HTML and EDBML files into main folder, injecting some tags
		edbml: {
			outline: {
				options: {},
				files: {
					'temp/edbml-compiled.js' : ['src/edbml/outline/*.edbml']
				}
			},
			inline: {
				expand: true,
				cwd: 'src/edbml/inline',
				src: ['**/*.html', '**/*.edbml'],
				dest: '.',
				options: {
					inline: true,
					beautify: true,
					process: function(html, abspath, path) {
						var sitemap, title, id, processor = require('./tasks/processor.js');
						if(path.indexOf('edbml') === 0) {
							sitemap = grunt.template.process('<%= JSON.stringify(sitemap_edbml,null) %>');
							title = 'Spiritual EDBML';
							id = 'edbml';
						} else if(path.indexOf('edb') === 0) {
							sitemap = grunt.template.process('<%= JSON.stringify(sitemap_edb,null) %>');
							title = 'Spiritual EDB';
							id = 'edb';
						} else if(path.indexOf('gui') === 0) {
							sitemap = grunt.template.process('<%= JSON.stringify(sitemap_gui,null) %>');
							title = 'Spiritual GUI';
							id = 'gui';
						}
						return processor.process(html, sitemap, title, id);
					}
				}
			}
		},

		// concat JS
		concat: {
			options: {
				separator: '\n\n\n'
			},
			js: {
				dest: 'js/scripts.js',
				src: grunt.file.readJSON('src/js/build.json').map(function(src) {
					return 'src/js/' + src;
				}).concat([
					'temp/ghp-compiled.js',
					'temp/edbml-compiled.js'
				])
			}
		},

		// crunch to minified JS
		uglify : {
			options : {
				mangle : false,
				beautify: false,
				sourceMap: true
			},
			js: {
				files: {
					'js/scripts.min.js' : 'js/scripts.js'
				}
			}
		},

		// compile LESS to minified CSS
		less: {
			common: {
				options: {
					relativeUrls: true,
					cleancss: true
				},
				files: {
					'css/styles.min.css': [
						'src/less/prism.css',
						'src/less/styles.less'
					]
				}
			}
		},

		// kill -9 $(lsof -t -i :PORT)
		devserver : {
			server: {},
			options : {
				cache: 'no-cache',
				port: PORT
			}
		},

		linkChecker: {
			dev: {
				site: 'localhost',
				options: {
					initialPort: PORT,
					initialPath: '/gui/index.html',
					callback: function (crawler) {
						crawler.addFetchCondition(function (url) {
							return url.path.indexOf('.html') >-1;
						});
					}
				}
			}
		},

		// rinse and repeat
		watch: {
			edbml_outline: {
				options: { interval: 5000 },
				tasks: ['edbml:outline', 'concat', 'uglify'],
				files: [ 
					'src/edbml/outline/*.edbml'
				]
			},
			edbml_inline: {
				options: { interval: 5000 },
				tasks: ['edbml:inline'],
				files: [ 
					'src/edbml/inline/**/*.html',
					'Gruntfile.js'
				]
			},
			js : {
				options: { interval: 5000 },
				tasks: ['guibundles:ghp', 'concat', 'uglify'],
				files: [ 
					'src/js/**/*.js',
					'src/js/build.json'
				]
			},
			less : {
				options: { interval: 5000 },
				tasks: ['less'],
				files: [ 
					'src/less/**/*.less',
					'src/less/**/*.css'
				]
			}
		},

		// run'em all
		concurrent: {
			target: {
				tasks: ['devserver', 'watch'],
				options: {
					logConcurrentOutput: true
				}
			}
		}		
	});


	// Tasks......................................................................

	grunt.registerTask('default', [
		'clean',
		'guibundles',
		'edbml',
		'concat',
		'uglify',
		'less',
		'concurrent'
	]);

	grunt.registerTask('links', ['linkChecker']);

};
