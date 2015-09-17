// Karma configuration
// Generated on Fri Oct 10 2014 10:52:56 GMT-0700 (Pacific Daylight Time)

var RewirePlugin = require("rewire-webpack");

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'bin/test/index.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'bin/test/index.js' : ['webpack']
    },

    webpack: {
        cache: true,
        watch: true,
        devtool: 'inline-source-map',
        plugins: [
            new RewirePlugin()
        ],
        module: {
            postLoaders: [ {
                test: /\.js$/,
                exclude: /(test|node_modules|bower_components)(\/|\\)/,
                loader: 'istanbul-instrumenter'
            } ]
        }
    },

    webpackServer: {
        stats: {
            colors: true
        }
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type: 'lcov',
      dir: 'bin/coverage'
    },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};