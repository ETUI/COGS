// # APIs and Annotation

// ## Multiple environment support
// COGS supports multiply JavaScript environment including:

;(function(name, factory){
    var cogs = factory(this);

    if (this.require && this.define && this.define.amd){
        // * AMD loader such as requirejs or curl: 
        // `require('path/to/cogs', callback);`
        define(function(){
            return cogs;
        });
    }
    else if (typeof exports != 'undefined'　&& typeof module != 'undefined'){
        // * Nodejs module loading:
        //   `var cogs = require('path/to/cogs');`
        module.exports = cogs;
    }
    else{
        // * `cogs` will be a global variable if its factory was ran 
        //   without AMD loader
        this[name] = cogs;
    }

})

("cogs", function(global, undef){

    "use strict";

    var cogs = {}, ver = '0.1', global = this;

    /**
     * @function ctor
     * A contructor helper, it returns a contructor which its prototype has
     * same member methods as the prototype of base, also calls into
     * the constructor of base when the new constructor is get called.
    */
    !function(){
        // for internal use
        var noop = function(){};

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
                    writable: false, configurable: false, value: function(){}
                });
            }
            catch(ex){}
        }

        if (!cogs.noop){
            cogs.noop = function(){};
        }

        var ctorCreator = function(ctor, base) {

            // internal construction argument holder
            var argsHolder, key;

            var hasBase = base != null;

            // CONSTRUCTOR WRAPPER INSTANTIATION

            // the function which will be returned as an constructor wrapper
            var ret = function() {
                var instance, argsHolder, args;

                // setup Calling chain
                var cchain = this[CHAIN_CALLING], cchainCreator = false;

                if (!cchain){
                    this[CHAIN_CALLING] = cchain = new CallingChain();
                    cchainCreator = true;
                }
                if (!(cchain instanceof CallingChain)){
                    // somebody already taken the name?
                    throw 'Pls do not occupy the member name:' + CHAIN_CALLING + 
                        ', it is reserved by cogs.ctor()'; 
                }

                if (this == global || this == undef){
                    argsHolder = Array.prototype.slice.call(arguments);
                    instance = new ret();
                    argsHolder = null;
                    return instance;
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

        cogs.ctor = function(){
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

    }();

    /**
     * @function: observable
     **/
    !function(){

        function Box(){
            this.ref = null;
            this.next = null;
        }

        /**
         * @function newBox
         * @private
         * Create a node
         **/
        function newBox() {
            return new Box;
        };

        function checkIsFunc(func){
            if (Object.prototype.toString.call(func).toLowerCase() !==
                '[object function]'){
                throw new Error('hookee is not a function');
            }
        };

        function hookFunc(func){
            checkIsFunc(func);

            this.cur.next = newBox();

            this.cur = this.cur.next;
            this.cur.ref = func;

            return true;
        };

        function unhookFunc(func){
            checkIsFunc(func);

            // traversing link ds
            var c = this.head;
            var p = null;
            while (c.next != null) {
                p = c;
                c = c.next;
                if (c.ref === func) {
                    p.next = c.next;

                    // we are deleting the last element
                    if (c.next == null){
                        // reset this.cur
                        this.cur = p;
                    }

                    c = null;
                    return true;
                }
            }

            return false;
        };

        function hookOnceFunc(func){
            var scope = this;
            var funcWrapper = function(){
                unhookFunc.call(scope, funcWrapper);
                func.apply(this, arguments);
            };

            hookFunc.call(scope, funcWrapper);
        };

        function invokeFunc(){
            var args = Array.prototype.slice.call(arguments);
            var context = args.shift();
            var c = this.head;
            var p = null, tmp = null, result=null;
            while (c.next != null) {
                p = c;
                c = c.next;
                if (c.ref != null) {

                    tmp = null;
                    try {
                        tmp = c.ref.apply(context, args);
                    }
                    catch (ex) {
                        // we need to throw the exception but meanwhile keep 
                        // casting. so we decided to throw in another ui task
                        // the advantage are:
                        //  1. it is more synmatically correct, an inner exception
                        //      should be thrown rather than console.error()
                        //  2. it also developer to determine the issue more easily
                        //      and ealier on IEs (while the other browsers hide the
                        //      js err) 
                        //  3. you can catch the error on window.onerror and process
                        setTimeout(function(){
                            throw ex;
                        }, 0); 
                    }
                    if (tmp != null) {
                        result = tmp;
                    }
                }
            }

            return result;
        };

        var observableCtor = function(retFunc) {

            var result = null;
            var ret = retFunc?retFunc:function(){
                return ret.invoke.apply(this, arguments);
            };

            ret.head = newBox();

            // init head node
            ret.head.ref = cogs.noop;

            // point cursor to head
            ret.cur = ret.head;

            // hook a func
            ret.hook = hookFunc;

            // hook func and unhook it once it is been called.
            ret.once = hookOnceFunc;

            // unhook a func
            ret.unhook = unhookFunc;

            // make sure the context of hookees are same as 
            // the context when ret.invoke is executed.
            ret.invoke = function(){
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                invokeFunc.apply(ret, args);
            };

            return ret;
        };

        cogs.observable = observableCtor;
    }();

    /**
     * @function: event
     * Create a event-like delegate object, supports multicast

     * sample:
     * Create a observable object:
     * obj.onMouseDown = cogs.event();
     *
     * sample:
     * Hook a function to the event:
     * Obj.onMouseDown.hook(function(){});
     *
     * sample:
     * Remove a function reference from the event:
     * Obj.onMouseDown.unhook(funcVariable);
     *
     * sample:
     * Cast the event
     * onMouseDown(arg1, arg2);
     *
     **/
    cogs.event = function(){
        var ret = cogs.observable();
        
        ret.onHook = cogs.observable();
        ret.onUnhook = cogs.observable();

        var hook = ret.hook;
        ret.hook = function(func){
            if (ret.onHook(this, func) === false){
                return false;
            }
            return hook.apply(this, arguments);
        };

        var unhook = ret.unhook;
        ret.unhook = function(func){
            if (ret.onUnhook(this, func) === false){
                return false;
            }
            return unhook.apply(this, arguments);
        };

        return ret;
    };

    !function(){
        function onFunc(eventName, callback){
            var name = eventName.charAt(0).toUpperCase() + eventName.substr(1),
                evt = this['on' + name];

            if (!evt){
                evt = cogs.event();
                this['on' + name] = evt;
            }

            if (evt.hook){
                evt.hook(callback);
            }
            else{
                throw "The member name '" + eventName + "' is occupied.";
            }
        }

        function offFunc(){
            var name = eventName.charAt(0).toUpperCase() + eventName.substr(1),
                evt = this['on' + name];

            if (!evt){
                return;
            }

            if (evt.unhook){
                evt.unhook(callback);
            }
            else{
                throw "The member name '" + eventName + "' might be over written.";
            }
        }

        function emitFunc(eventName){
            var name = eventName.charAt(0).toUpperCase() + eventName.substr(1),
                evt = this['on' + name], args = Array.prototype.slice.call(arguments);

            args.shift();

            if (evt){
                evt.apply(this, args);
            }
        };

        /**
         * @function emittable
         * add .on and .off to support any object
         */ 
        cogs.emittable = function(obj){
            obj['on'] = onFunc;
            obj['off'] = offFunc;
            obj['emit'] = emitFunc;
        };
    }();

    /**
     * @function prop
     * Property creator.
     *
     * It returns a function. when called with parameter,
     * it is considered as 'setting', then setter will be invoked in current
     * context and the value to be set will be passed in as is.
     *
     * when called without parameter or the first parameter is undefined,
     * it is considered as 'getting', then getter will be invoked in current
     * context and the return value of getter will be returned.
     *
     **/
    !function(undef){
        function defaultGetter(){
            return this.value;
        };
        
        function defaultSetter(value){
            this.value = value;
            return value;
        };
        cogs.prop = function(getter, setter){
            var ret, data;
            if (getter == null &&
                setter == null){
                data = {};
                getter = defaultGetter.bind(data);
                setter = defaultSetter.bind(data);
            }
            ret = function(value){
                if (value === undef){
                    return getter.apply(this);
                }
                else{
                    if (!setter){
                        throw "Setting readonly property";
                    }
                    return setter.apply(this, arguments);
                }
            };

            // expose it 
            ret.getter = getter;
            ret.setter = setter;

            return ret;
        };
    }();

    cogs.ver = ver;

    return cogs;

});