module.exports = function(grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
//        meta : {
//            src   : ['/js/src/**/*.js']
//        },
//        watch: {
//            test : {
//                files: ['<%= meta.src %>'],
//                tasks: 'test'
//            },
//            dev : {
//                files: ['<%= meta.src %>'],
//                    tasks: 'jshint'
//            }
//        },
        connect: {
            options: {
                base: './'
            },
            run: {
                options: {
                    port: 9911,
                    keepalive: false
                }
            },
            server: {
                options: {
                    port: 9912,
                    keepalive: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');

    //grunt.registerTask('test', ['connect:run', 'jasmine']);
    grunt.registerTask('server', ['connect:server']);

    // Default task.
    grunt.registerTask('default', ['server']);

};