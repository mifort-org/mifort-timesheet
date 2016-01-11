'use strict';

module.exports = function (grunt) {
    //grunt.loadNpmTasks('grunt-usemin');

    grunt.initConfig({
        clean: {
            build: ['src/main/webapp/dist', '.tmp']
        },

        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/main/webapp/app',
                        src: [
                            'assets/images/**',
                            '**/*.html',
                            '**/*Columns.json',
                            '!testFramework/**/*',
                            'customerManagement/orgsManagement/orgNotes/fixtureData.json'
                        ],
                        dest: 'src/main/webapp/dist'
                    },
                    {
                        expand: true,
                        cwd: 'src/main/webapp/app/testFramework',
                        src: [
                            '**'
                        ],
                        dest: 'src/main/webapp/dist/testFramework'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'src/main/webapp/app/bower_components/angular-i18n/angular-locale_de.js',
                            'src/main/webapp/app/bower_components/angular-i18n/angular-locale_en.js',
                            'src/main/webapp/app/bower_components/angular-i18n/angular-locale_ru.js'
                        ],
                        dest: 'src/main/webapp/dist/assets/scripts/i18n'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'src/main/webapp/app/updateBrowser/updateBrowserBanner.js'
                        ],
                        dest: 'src/main/webapp/dist/assets/scripts/updateBrowser'
                    },
                    {
                        expand: true,
                        cwd: 'src/main/webapp/app/updateBrowser',
                        src: [
                            '**',
                            '!updateBrowserBanner.js'
                        ],
                        dest: 'src/main/webapp/dist/updateBrowser'
                    },
                    {
                        expand: true,
                        cwd: 'src/main/webapp/app/tjvmDocument',
                        src: [
                            '**'
                        ],
                        dest: 'src/main/webapp/dist/tjvmDocument'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: 'src/main/webapp/app/bower_components/fontawesome/fonts/*',
                        dest: 'src/main/webapp/dist/assets/fonts'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: 'src/main/webapp/app/bower_components/bootstrap/dist/fonts/*',
                        dest: 'src/main/webapp/dist/assets/fonts'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'src/main/webapp/app/bower_components/angular-ui-grid/ui-grid.ttf',
                            'src/main/webapp/app/bower_components/angular-ui-grid/ui-grid.woff'
                        ],
                        dest: 'src/main/webapp/dist/assets/styles'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'src/main/webapp/app/bower_components/jquery-ui/themes/overcast/images/*'
                        ],
                        dest: 'src/main/webapp/dist/assets/images'
                    }
                ]
            },
            dist: {

                files: [
                    {
                        expand: true,
                        cwd: 'src/main/webapp/dist',
                        src: [
                            '**'
                        ],
                        dest: 'src/main/webapp/app'
                    }
                ]
            }
        },

        concat: {
            styles: {
                files: {
                    'src/main/webapp/dist/assets/styles/vendors.css': [
                        'src/main/webapp/app/components/ng-table/ng-table.min.css',
                        'src/main/webapp/app/components/nvd3/build/nv.d3.min.css',
                        'src/main/webapp/app/bower_components/bootstrap/dist/css/bootstrap.min.css',
                        'src/main/webapp/app/bower_components/fontawesome/css/font-awesome.min.css',
                        'src/main/webapp/app/bower_components/select2/select2.css',
                        'src/main/webapp/app/bower_components/ngprogress/ngProgress.css',
                        'src/main/webapp/app/bower_components/angular-bootstrap-toggle-switch/style/bootstrap3/angular-toggle-switch-bootstrap-3.css',
                        'src/main/webapp/app/bower_components/ng-joyride/ng-joyride.css',
                        'src/main/webapp/app/bower_components/angular-ui-select/dist/select.min.css',
                        'src/main/webapp/app/bower_components/angular-ui-grid/ui-grid.min.css',
                        'src/main/webapp/app/bower_components/ng-tags-input/ng-tags-input.min.css',
                        'src/main/webapp/app/bower_components/ng-tags-input/ng-tags-input.bootstrap.min.css',
                        'src/main/webapp/app/bower_components/jquery-ui/themes/overcast/jquery-ui.min.css'
                    ],
                    'src/main/webapp/dist/assets/styles/styles.css': [
                        'src/main/webapp/app/**/*.css',
                        '!src/main/webapp/app/vendors/**/*.css',
                        '!src/main/webapp/app/bower_components/**',
                        '!src/main/webapp/app/updateBrowser/updateBrowser.css',
                        '!src/main/webapp/app/tjvmDocument/tjvmDocument.css',
                        '!src/main/webapp/app/components/angular-nvd3/**',
                        '!src/main/webapp/app/components/nvd3/**',
                        '!src/main/webapp/app/components/d3/**'
                    ]
                },
                options: {
                    process: function (src) {
                        return src.replace(/(?:(?:(?:\.\.\/)+assets\/)|(?:(?:\.\.\/)*))images\//g, '../images/');
                    }
                }
            },
            scripts: {
                src: (function (pattern) {
                    var scriptsPaths = grunt.file.expand(pattern);
                    return scriptsPaths.sort(function (a, b) {
                        var am = a.match(/-/g) || [],
                            bm = b.match(/-/g) || [];
                        return am.length - bm.length;
                    });
                })([
                    'src/main/webapp/app/**/*.js',
                    '!src/main/webapp/app/testFramework/init.js',
                    '!src/main/webapp/app/components/vm-custom/**/*.js',
                    '!src/main/webapp/app/components/d3/**',
                    '!src/main/webapp/app/components/nvd3/**',
                    '!src/main/webapp/app/components/angular-nvd3/**',
                    '!src/main/webapp/app/vendors/**/*.js',
                    '!src/main/webapp/app/bower_components/**',
                    '!src/main/webapp/app/updateBrowser/updateBrowserBanner.js',
                    '!src/main/webapp/app/tjvmDocument/tjvmDocument.js'
                ]),
                dest: 'src/main/webapp/dist/assets/scripts/scripts.js'
            },
            vmscripts: {
                src: ['src/main/webapp/app/testFramework/init.js', 'src/main/webapp/app/components/vm-custom/**/*.js'],
                dest: 'src/main/webapp/dist/assets/scripts/vmscripts.js'
            },
            vendors: {
                src: [
                    'src/main/webapp/app/bower_components/jquery/dist/jquery.min.js',
                    'src/main/webapp/app/bower_components/jquery-ui/jquery-ui.min.js',
                    'src/main/webapp/app/bower_components/jquery-placeholder/jquery.placeholder.js',
                    'src/main/webapp/app/bower_components/angular/angular.min.js',
                    'src/main/webapp/app/bower_components/select2/select2.js',
                    'src/main/webapp/app/bower_components/angular-route/angular-route.min.js',
                    'src/main/webapp/app/bower_components/ngprogress/build/ngProgress.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-select2/src/select2.js',
                    'src/main/webapp/app/bower_components/bootstrap/dist/js/bootstrap.min.js',
                    'src/main/webapp/app/bower_components/angular-bootstrap/ui-bootstrap.min.js',
                    'src/main/webapp/app/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-event/dist/event.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-unique/unique.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-highlight/highlight.min.js',
                    'src/main/webapp/app/components/d3/d3.min.js',
                    'src/main/webapp/app/components/nvd3/build/nv.d3.min.js',
                    'src/main/webapp/app/components/angular-nvd3/dist/angular-nvd3.min.js',
                    'src/main/webapp/app/bower_components/angular-google-analytics/dist/angular-google-analytics.min.js',
                    'src/main/webapp/app/bower_components/angular-touch/angular-touch.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-sortable/sortable.min.js',
                    'src/main/webapp/app/bower_components/angularjs-placeholder/src/angularjs-placeholder.js',
                    'src/main/webapp/app/bower_components/angular-bootstrap-toggle-switch/angular-toggle-switch.min.js',
                    'src/main/webapp/app/bower_components/ng-joyride/ng-joyride.js',
                    'src/main/webapp/app/bower_components/momentjs/min/moment-with-locales.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-select/dist/select.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-grid/ui-grid.min.js',
                    'src/main/webapp/app/bower_components/angular-validation/angular-validation.min.js',
                    'src/main/webapp/app/bower_components/angular-validation/angular-validation-rule.min.js',
                    'src/main/webapp/app/bower_components/angular-file-upload/angular-file-upload.min.js',
                    'src/main/webapp/app/bower_components/file-saver/file-saver.js',
                    'src/main/webapp/app/bower_components/xml2json/xml2json.js',
                    'src/main/webapp/app/bower_components/ng-tags-input/ng-tags-input.min.js',
                    'src/main/webapp/app/bower_components/ng-focus-if/focusIf.min.js',
                    'src/main/webapp/app/bower_components/angular-ui-slider/src/slider.js'
                ],
                dest: 'src/main/webapp/dist/assets/scripts/modules.js'
            }
        },

        usemin: {
            html: ['src/main/webapp/dist/index.html']
        },

        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'src/main/webapp/dist/assets/scripts/scripts.js': ['src/main/webapp/dist/assets/scripts/scripts.js'],
                    'src/main/webapp/dist/assets/scripts/vmscripts.js': ['src/main/webapp/dist/assets/scripts/vmscripts.js']
                }
            }
        },

        ngtemplates: {
            app: {
                src: 'src/main/webapp/dist/**/*.html',
                dest: 'src/main/webapp/dist/assets/scripts/templates.js',
                options: {
                    url: function (url) {
                        url = url.slice(url.indexOf('dist'));

                        return url.replace('dist/', '');
                    },
                    module: 'egx',
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
                    'src/main/webapp/dist/assets/scripts/scripts.min.js': ['src/main/webapp/dist/assets/scripts/scripts.js'],
                    'src/main/webapp/dist/assets/scripts/vmscripts.min.js': ['src/main/webapp/dist/assets/scripts/vmscripts.js'],
                    'src/main/webapp/dist/assets/scripts/modules.min.js': ['src/main/webapp/dist/assets/scripts/modules.js'],
                    'src/main/webapp/dist/assets/scripts/templates.min.js': ['src/main/webapp/dist/assets/scripts/templates.js']
                }
            }
        },

        cssmin: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/main/webapp/dist/assets/styles/',
                        src: ['*.css', '!*.min.css'],
                        dest: 'src/main/webapp/dist/assets/styles/',
                        ext: '.css'
                    }
                ]
            }
        },

        notify: {
            options: {
                enabled: true,
                title: 'EGX'
            }
        },

        remove: {
            // Removes the webapp/app directory. Careful. Used to replace app with dist
            // in official build.
            app: {
                dirList: ['src/main/webapp/app/']
            },
            dist: {
                dirList: ['src/main/webapp/dist/']
            }
        },

        cachebreaker: {
            scripts: {
                options: {
                    match: ['scripts.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/scripts/scripts.min.js'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            vmscripts: {
                options: {
                    match: ['vmscripts.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/scripts/vmscripts.min.js'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            modules: {
                options: {
                    match: ['modules.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/scripts/modules.min.js'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            updateBrowser: {
                options: {
                    match: ['updateBrowserBanner.js'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/scripts/updateBrowser/updateBrowserBanner.js'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            locale: {
                options: {
                    match: ['angular-locale_\\${locale}.js'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/scripts/i18n/angular-locale_en.js'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            templates: {
                options: {
                    match: ['templates.min.js'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/scripts/templates.min.js'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            vendors: {
                options: {
                    match: ['vendors.css'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/styles/vendors.css'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            styles: {
                options: {
                    match: ['styles.css'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/styles/styles.css'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            },
            favicon: {
                options: {
                    match: ['favicon.ico'],
                    replacement: 'md5',
                    src: {
                        path: 'src/main/webapp/dist/assets/images/favicon.ico'
                    }
                },
                files: {
                    src: ['src/main/webapp/dist/index.html']
                }
            }
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
