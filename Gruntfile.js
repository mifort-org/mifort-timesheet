'use strict';

module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-remove');
    grunt.loadNpmTasks('grunt-cache-breaker');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-angular-templates');


    grunt.initConfig({
        clean: {
            build: ['dist', '.tmp']
        },

        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'frontend',
                        src: [
                            'common/images/**',
                            '**/**/*.html',
                            '**/*.html'
                        ],
                        dest: 'dist/frontend'
                    }
                    //{
                    //    expand: true,
                    //    flatten: true,
                    //    src: 'frontend/bower_components/fontawesome/fonts/*',
                    //    dest: 'dist/assets/fonts'
                    //},
                    //{
                    //    expand: true,
                    //    flatten: true,
                    //    src: [
                    //        'frontend/bower_components/jquery-ui/themes/overcast/images/*'
                    //    ],
                    //    dest: 'dist/assets/images'
                    //}
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/frontend',
                        src: [
                            '**'
                        ],
                        dest: 'frontend'
                    }
                ]
            }
        },

        concat: {
            styles: {
                files: {
                    'dist/styles/vendors.css': [
                        'frontend/bower_components/angular-ui-grid/ui-grid.min.css',
                        'frontend/bower_components/angular-ui-notification/dist/angular-ui-notification.min.css',
                        'frontend/bower_components/bootstrap/dist/css/bootstrap.min.css',
                        'frontend/bower_components/bootstrap-daterangepicker/daterangepicker-bs3.css'
                    ],
                    'dist/styles/styles.css': [
                        'frontend/**/**/*.css',
                        'frontend/**/*.css',
                        '!frontend/bower_components/**'
                    ]
                },
                options: {
                    process: function(src) {
                        return src.replace(/(?:(?:(?:\.\.\/)+common\/)|(?:(?:\.\.\/)*))images\//g, '../images/');
                    }
                }
            },
            scripts: {
                src: (function(pattern) {
                    var scriptsPaths = grunt.file.expand(pattern);
                    return scriptsPaths.sort(function(a, b) {
                        var am = a.match(/-/g) || [],
                            bm = b.match(/-/g) || [];
                        return am.length - bm.length;
                    });
                })([
                    'frontend/**/*.js',
                    '!frontend/bower_components/**'
                ]),
                dest: 'dist/scripts/scripts.js'
            },
            vendors: {
                src: [
                    'frontend/bower_components/jquery/dist/jquery.min.js',
                    'frontend/bower_components/angular/angular.min.js',
                    'frontend/bower_components/angular-route/angular-route.min.js',
                    'frontend/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
                    'frontend/bower_components/underscore/underscore-min.js',
                    'frontend/bower_components/moment/min/moment.min.js',
                    'frontend/bower_components/angular-moment/angular-moment.min.js',
                    'frontend/bower_components/angular-cookies/angular-cookies.min.js',
                    'frontend/bower_components/angular-ui-grid/ui-grid.min.js',
                    'frontend/bower_components/angular-click-outside/clickoutside.directive.js',
                    'frontend/bower_components/bootstrap-daterangepicker/daterangepicker.js',
                    'frontend/bower_components/ng-bs-daterangepicker/dist/ng-bs-daterangepicker.min.js',
                    'frontend/bower_components/angular-ui-notification/dist/angular-ui-notification.min.js'
                ],
                dest: 'dist/scripts/vendors.js'
            }
        },

        usemin: {
            html: ['dist/index.html']
        },

        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'dist/scripts/scripts.js': ['dist/scripts/scripts.js']
                }
            }
        },

        //for later usage(caching html templates)
        ngtemplates: {
            app: {
                src: 'dist/**/*.html',
                dest: 'dist/scripts/templates.js',
                options: {
                    url: function(url) {
                        url = url.slice(url.indexOf('dist'));

                        return url.replace('dist/', '');
                    },
                    module: 'mifortTimelog',
                    htmlmin: {
                        collapseBooleanAttributes: false, // Otherwise 'sortable' attribute values are deleted
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: false, // Because some directives look like empty attributes
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            }
        },

        uglify: {
            options: {
                sourceMap: true
            },
            build: {
                files: {
                    'dist/scripts/scripts.min.js': ['dist/scripts/scripts.js'],
                    'dist/scripts/vendors.min.js': ['dist/scripts/vendors.js']
                }
            }
        },

        cssmin: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/styles/',
                        src: ['*.css', '!*.min.css'],
                        dest: 'dist/styles/',
                        ext: '.css'
                    }
                ]
            }
        },

        notify: {
            options: {
                enabled: true,
                title: 'Mifort'
            }
        },

        remove: {
            // Removes the webapp/app directory. Careful. Used to replace app with dist
            // in official build.
            app: {
                dirList: ['frontend/']
            },
            dist: {
                dirList: ['dist/frontend']
            }
        },

        cachebreaker: {
            scripts: {
                options: {
                    match: ['scripts.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/scripts/scripts.min.js'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            },
            vendorsscripts: {
                options: {
                    match: ['vendors.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/scripts/vendors.min.js'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            },
            vendors: {
                options: {
                    match: ['vendors.css'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/styles/vendors.css'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            },
            styles: {
                options: {
                    match: ['styles.css'],
                    replacement: 'md5',
                    src: {
                        path: 'dist/styles/styles.css'
                    }
                },
                files: {
                    src: ['dist/index.html']
                }
            }
            //,
            //favicon: {
            //    options: {
            //        match: ['favicon.ico'],
            //        replacement: 'md5',
            //        src: {
            //            path: 'dist/assets/images/favicon.ico'
            //        }
            //    },
            //    files: {
            //        src: ['dist/index.html']
            //    }
            //}
        }
    });

    grunt.registerTask('build', [
        'clean:build',
        'copy:build',
        'concat',
        'ngAnnotate',
        'usemin',
        'ngtemplates',
        'uglify',
        'cssmin',
        'notify',
        'cachebreaker',
        'clobberApp'
    ]);

    grunt.registerTask('clobberApp', [
        'remove:app',
        'copy:dist',
        'remove:dist'
    ]);

};
