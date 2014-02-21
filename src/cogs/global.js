/*
 * Environment independent global object
 */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function () {
    return (new Function("return this;"))();
});