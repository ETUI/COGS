/*
 * Environment independent global object
 */

//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(function () {
    return (new Function("return this;"))();
});