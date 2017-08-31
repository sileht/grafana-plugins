module.exports = function(config) {
  'use strict';

  config.set({
    frameworks: ['browserify', 'mocha', 'expect'],

    plugins : [
      'karma-browserify',
      'karma-mocha',
      'karma-expect',
      'karma-phantomjs-launcher'
    ],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/es6-shim/es6-shim.js',
      'node_modules/systemjs/dist/system.src.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/lodash/lodash.js',
      'dist/specs/gnocchi-datasource-specs.js',
    ],

    preprocessors: {
      'dist/specs/gnocchi-datasource-specs.js': ['browserify'],
    },

    // list of files to exclude
    exclude: [],

    reporters: ['dots'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    captureTimeout: 20000,
    singleRun: true,
    autoWatchBatchDelay: 1000,
    browserNoActivityTimeout: 60000,
    browserify: {debug:true}

  });

};

