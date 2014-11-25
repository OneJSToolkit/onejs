module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'requirejs', 'chai'],
        files: [
            'test-main.js',
            {pattern: 'app/**/*.js', included: false}
        ],
        reporters: ['progress', 'coverage'],
        preprocessors: { 'app/**/*.js': ['coverage'] },
        coverageReporter: {
            type: 'lcov',
            dir: 'coverage'
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['PhantomJS'],
        singleRun: false
    });
};
