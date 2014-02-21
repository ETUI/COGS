/**
 * @function emittable
 * add .on and .off to support any object
 */ 

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['./event'], function (event) {

    function emittable(obj){
        obj['on'] = event.onFunc;
        obj['off'] = event.offFunc;
        obj['emit'] = event.emitFunc;

        return obj;
    };

    emittable(emittable.prototype); 

    return emittable;
});