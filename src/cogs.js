if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
     
define(['./cogs/ctor', './cogs/noop', './cogs/stub', './cogs/mixin', './cogs/observable', './cogs/event', './cogs/emittable', './cogs/prop'], 
    function (ctor, noop, stub, mixin, observable, event, emittable, prop) {
    var cogs = {};

    /**
     * @function noop
     * A ref to 'do nothing'
     **/
    if (Object.defineProperty){
        /* ECMAScript 5 to help validation */
        /* 
            and IE8 sucks, IE8 implemented a broken 
            defineProperty so we need to try catch here 
        */
        try{
            Object.defineProperty(cogs, 'noop', {
                writable: false, configurable: false, value: noop
            });
        }
        catch(ex){}
    }

    if (!cogs.noop){
        cogs.noop = noop;
    }

    cogs.ctor = ctor;

    cogs.stub = stub;

    cogs.mixin = mixin;

    cogs.observable = observable;

    cogs.event = event;

    cogs.emittable = emittable;

    cogs.prop = prop;

    return cogs;
});