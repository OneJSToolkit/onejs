// this file loads all of the tests so webpack can emit a single bundle


declare var require;

// PhantomJS doesn't have Function.bind
if (!Function.prototype.bind) {
    Function.prototype.bind = (function () {
        var slice = Array.prototype.slice;
        return function () {
            var originalFunc = this, thisArg = arguments[0], boundArgs = slice.call(arguments, 1);
            return function () {
                return originalFunc.apply(thisArg, slice.call(boundArgs, 0).concat(slice.call(arguments, 0)));
            };
        };
    })();
}
var testsContext = require.context(".", true, /test$/);
testsContext.keys().forEach(testsContext);