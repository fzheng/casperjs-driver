'use strict';

module.exports = function gruntFile(grunt) {
  grunt.initConfig({
    env: {
      options: {},
      dev: {
        NODE_ENV: grunt.option('env') || 'test',
      },
    },
    exec: {
      'eslint-nofix': {
        command: 'npx eslint .',
        options: {
          maxBuffer: 500 * 1024,
        },
      },
      'eslint-autofix': {
        command: 'npx eslint . --fix',
        options: {
          maxBuffer: 500 * 1024,
        },
      },
      'run-test': {
        command: 'node tests/index.js',
        options: {
          maxBuffer: 500 * 1024,
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('coverage', ['env:dev', 'exec:eslint-autofix', 'exec:run-test']);
};
