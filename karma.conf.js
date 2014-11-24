module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'requirejs', 'chai'],
        files: [
            'test-main.js',
            {pattern: 'app/**/*.js', included: false}
        ],
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Chrome'],
        singleRun: false
    });
};
