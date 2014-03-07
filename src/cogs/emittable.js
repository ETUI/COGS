/**
 * @function emittable
 * add .on and .off to support any object
 */ 

//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

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