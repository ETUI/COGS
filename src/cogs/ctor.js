/**
 * @function ctor
 * A contructor helper, it returns a contructor which its prototype has
 * same member methods as the prototype of base, also calls into
 * the constructor of base when the new constructor is get called.
*/

//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(['./global', './noop'], function(global, noop){

    var undef;

    var CHAIN_CALLING = '__callingChain__';

    // CallingChain constructor;
    function CallingChain(){
        this.funcs = [];
    }
    // keep it POLA
    CallingChain.prototype = {
        has: function(func){
            var funcs = this.funcs;
            for(var l = funcs.length; l--;){
                if (funcs[l] === func){
                    return true;
                }
            }

            return false;
        },
        add: function(func){
            this.funcs.unshift(func);
        }
    };

    var ctorCreator = function(ctor, base) {

        // internal construction argument holder
        var argsHolder, key;

        var hasBase = base != null;

        // CONSTRUCTOR WRAPPER INSTANTIATION

        // the function which will be returned as an constructor wrapper
        var ret = function() {
            var instance, argsHolder, args;

            if (this == global || this == undef){
                argsHolder = Array.prototype.slice.call(arguments);
                instance = new ret();
                argsHolder = null;
                return instance;
            }

            // setup Calling chain
            var cchain = this[CHAIN_CALLING], cchainCreator = false;

            if (!cchain){
                this[CHAIN_CALLING] = cchain = new CallingChain();
                cchainCreator = true;
            }
            // checking cchain instanceof CallingChain will cause code failure
            // when multiple version cogs is used together
            if (!cchain.has && !cchain.add){
                // somebody already taken the name?
                throw 'Pls do not occupy the member name:' + CHAIN_CALLING + 
                    ', it is reserved by cogs.ctor()'; 
            }

            args = arguments;

            if (argsHolder){
                args = argsHolder;
            }

            if (hasBase && !cchain.has(base)) {
                // calls into base ctor before call into current ctor
                base.apply(this, args);
                cchain.add(base);
            }

            if (!cchain.has(ctor)){
                // calls into current ctor with all arguments
                ctor.apply(this, args);
                cchain.add(ctor);
            }

            if (cchainCreator){
                delete this[CHAIN_CALLING];
            }
        };

        // INHERITANT CHAIN SETUP

        // create a obj to holds info
        var coreInfo = {};

        if (hasBase){
            // set .base to appropriate base constructor
            if (base.prototype.__core__ != null &&
                base.prototype.__core__.wrapper != null) {
                coreInfo.base = base.prototype.__core__.wrapper;
            }
            else {
                coreInfo.base = base;
            }
        }
        else{
            coreInfo.base = null;
        }

        // store the ref to original constructor;
        coreInfo.ctor= ctor;
        coreInfo.wrapper = ret;

        // PROTOTYPE SETUP

        if (hasBase) {
            // create an empty constructor so ret can safely have
            // all members of base.prototype
            noop.prototype = base.prototype;
            ret.prototype = new noop;

            // allow sub class access super prototype
            // by accessing ctorWrapper.base.
            ret.base = base.prototype;

        }

        // copy over members from ctor.prototype to the new constructor wrapper
        for(var key in ctor.prototype){

            if (key === 'constructor'){
                continue;
            }

            ret.prototype[key] = ctor.prototype[key];
        }
        
        ret.prototype.__core__ = coreInfo;

        // repoint it in case the prototype is been overrided.
        ret.prototype.constructor = ret;

        return ret;
    };

    var ctor = function(){
        var l = arguments.length, ret;

        if (l <= 0){
            return;
        }

        if (l === 1){
            return ctorCreator(arguments[l - 1]);
        }

        l--;
        ret = arguments[l];

        while(l--){
            ret = ctorCreator(arguments[l], ret);
        }

        return ret;
    };

    return ctor;
});