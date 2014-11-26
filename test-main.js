// PhantomJS doesn't support Function.prototype.bind
if (!Function.prototype.bind) {
  var slice = Array.prototype.slice;
  Function.prototype.bind = function(context) {
    var func = this;
    var args = slice.call(arguments, 1);

    function bound() {
      var calledAsConstructor = func.prototype && (this instanceof func);
      return func.apply(
        // ignore context when called as a constructor
        !calledAsConstructor && context || this,
        args.concat(slice.call(arguments))
      );
    }

    bound.prototype = func.prototype;

    return bound;
  };
}

var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

var pathToModule = function(path) {
  return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    allTestFiles.push(pathToModule(file));
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',
    paths: {
        "chai": "/base/node_modules/chai/chai"
    },

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
