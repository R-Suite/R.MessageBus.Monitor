﻿module.exports = function(grunt) {

    var cssFiles = [
        "bower_components/select2/select2.css",
        "bower_components/toastr/toastr.css",
        "bower_components/gridster/dist/jquery.gridster.css",
        "bower_components/backgrid/lib/backgrid.css",
        "bower_components/backgrid-filter/backgrid-filter.css",
        "bower_components/backgrid-paginator/backgrid-paginator.css",
        "bower_components/fontawesome/css/font-awesome.css",
        "app/css/select2-bootstrap.css",
        "bower_components/vis/dist/vis.min.css",
        "bower_components/backgrid-moment-cell/backgrid-moment-cell.css",
        "app/css/bootstrap-datetimepicker.min.css",
        "bower_components/slickgrid/slick.grid.css",
        "app/css/slick-default-theme.css",
        "app/css/bootstrap.css",
        "app/css/style.css",
        "bower_components/slickgrid/controls/slick.columnpicker.css"
    ];

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        
        jsbeautifier: {
            files: ["app/**"],
            options: {}
        },

        requirejs: {
            compile: {
                options: {
                    baseUrl: ".",
                    name: "main",
                    include: "require.js",
                    out: "dist/serviceconnect.monitor.min.js",
                    wrap: true,
                    preserveLicenseComments: false,
                    mainConfigFile: "main.js"
                }
            }
        },

        cssmin: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            combine: {
                files: {
                    'dist/serviceconnect.monitor.min.css': cssFiles
                }
            }
        },

        jshint: {
            files: ['app/**/*.js', '!app/lib/**/*.js']
        },

        sloc: {
            'js': {
                files: {
                    'app': [ '**.js' ]
                }
            }
        },

        watch: {
            files: ["app/**"],
            tasks: ['default']
        }
        
    });

    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('server', ['connect', 'watch']);
    grunt.registerTask('default', ['cssmin', 'jsbeautifier', 'jshint']);
    grunt.registerTask('dist', ['jsbeautifier', 'jshint', 'cssmin', 'requirejs', 'sloc']);
};
