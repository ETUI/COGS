(function() { 
var global = new Function('return this')();var parentDefine = global.define || (function(factory){ var ret = factory();typeof module != 'undefined' && (module.exports = ret) ||(global.cogs = ret); }) ;/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});

/*
 * Environment independent global object
 */


define('cogs/global',[],function () {
    return (new Function("return this;"))();
});
define('cogs/noop',[],function(){
    return function(){};
});
/**
 * @function ctor
 * A contructor helper, it returns a contructor which its prototype has
 * same member methods as the prototype of base, also calls into
 * the constructor of base when the new constructor is get called.
*/


define('cogs/ctor',['./global', './noop'], function(global, noop){

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
/**
 * @function: stub
 **/


define('cogs/stub',[],function () {
    function NOT_IMP(){
        throw 'This method is not implemented yet.';
    }

    var stub = function(obj, methods){
        var name, l;
        var ret = obj;

        if (!obj){
            throw 'Stub object must be specified';
        }

        if (typeof obj == 'function'){
            obj = obj.prototype;
        }

        if (!methods || (~~methods.length == 0) ){
            return;
        }

        for(l = methods; l--;){
            name = methods[l];

            if (name in obj){
                continue;
            }

            obj[name] = NOT_IMP;
        }

        return ret;
    };

    return stub;
});
/**
 * @function: mixin
 **/


define('cogs/mixin',[],function () {
    var getDescriptor = Object.getOwnPropertyDescriptor;
    var setDescriptor = Object.defineProperty;

    try{
        Object.getOwnPropertyDescriptor({f:1}, 'f');
    }
    catch(ex){
        // in case it is the fake getDescriptor on ie
        getDescriptor = undef;
        setDescriptor = undef;
    }

    function getAncestorDescriptor(obj, name){
        var ret, tmp;

        while(ret == null && obj != null){
            ret = getDescriptor(obj, name);
            tmp = Object.getPrototypeOf(obj);

            if (tmp === obj){
                break;
            }

            obj = tmp;
        }

        return ret;
    }

    function setMember(target, source, name){
        var srcDesc, tgtDesc;
        if (getDescriptor){
            srcDesc = getDescriptor(source, name);
            tgtDesc = getAncestorDescriptor(target, name);

            if(tgtDesc != null && (srcDesc.get || srcDesc.set)){
                srcDesc.get = (srcDesc.get || tgtDesc.get);
                srcDesc.set = (srcDesc.set || tgtDesc.set);
            }

            setDescriptor(target, name, srcDesc);
        
        }
        else{
            target[name] = source[name];
        }
    }

    var mixin = function(target){
        var name, l, source;

        if (!target){
            return;
        }

        var ret = target;

        if (typeof target == 'function'){
            target = target.prototype;
        }

        for(l = arguments.length; l--;){
            if (arguments[l] == null){
                continue;
            }

            source = arguments[l];

            if (typeof source == 'function'){
                source = source.prototype;
            }

            for (name in source){
                var desc = getDescriptor ? getAncestorDescriptor(target, name) : null;
                if (!source.hasOwnProperty(name) && 
                    name in target && 
                    (
                        desc ? 
                            (desc && desc.value != NOT_IMP) : 
                            target[name] != NOT_IMP
                    )
                    ){
                    continue;
                }

                setMember(target, source ,name);
            }
        }

        return ret;

    };

    return mixin;
});
/**
 * @function: observable
 **/


define('cogs/observable',['./noop'], function (noop) {

    function EventLinkBox(){
        this.ref = null;
        this.next = null;
    }

    /**
     * @function newBox
     * @private
     * Create a node
     **/
    function newBox() {
        return new EventLinkBox;
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
            if (c.ref === func || 
                // allow to remove all hooked functions when func is mot specified
                func == null) {
                p.next = c.next;

                // we are deleting the last element
                if (c.next == null){
                    // reset this.cur
                    this.cur = p;
                }

                c.ref = null;
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
        var args = Array.prototype.slice.call(arguments, 1);
        var context = arguments[0];
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

    function observable(retFunc) {

        var result = null;
        var ret = retFunc?retFunc:function(){
            return ret.invoke.apply(this, arguments);
        };

        ret.head = newBox();

        // init head node
        ret.head.ref = noop;

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

    observable.EventLinkBox = EventLinkBox;

    return observable;
});
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


define('cogs/event',['./observable'], function(observable){
    var ON = 'on';

    function event(){
        var ret = observable();
        
        ret.onHook = observable();
        ret.onUnhook = observable();

        var hook = ret.hook;
        var once = ret.once;
        ret.hook = function(func){
            if (ret.onHook(this, func) === false){
                return false;
            }
            return hook.apply(this, arguments);
        };

        ret.once = function(func){
            if (ret.onHook(this, func) === false){
                return false;
            }
            return once.apply(this, arguments);
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

    function onFunc(eventName, callback){
        var name = eventName.charAt(0).toUpperCase() + eventName.substr(1),
            evt = this[ON + name];

        if (!evt){
            evt = event();
            this[ON + name] = evt;
        }

        if (evt.hook){
            evt.hook(callback);
        }
        else{
            throw "The member name '" + eventName + "' is occupied.";
        }
    }

    function offFunc(eventName, callback){
        if (!eventName){
            
            // if there is no eventName specified, that simply means
            // we want to clear all event on current obj
            for(var key in this){
                if (key.indexOf(ON) != 0 ||
                    // if it is not a cogs event object
                    !(this[key].head instanceof observable.EventLinkBox)){
                    continue;
                }

                offFunc(key.substr(2));
            }

            return;
        }

        var name = eventName.charAt(0).toUpperCase() + eventName.substr(1),
            evt = this[ON + name];

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
        var name = [eventName.charAt(0).toUpperCase(), eventName.substr(1)].join(''),
            evt = this[ON + name], args;

        if (evt){
            args = Array.prototype.slice.call(arguments, 1);
            evt.apply(this, args);
        }
    };

    event.onFunc = onFunc;
    event.offFunc = offFunc;
    event.emitFunc = emitFunc;

    return event;
});
/**
 * @function emittable
 * add .on and .off to support any object
 */ 


define('cogs/emittable',['./event'], function (event) {

    function emittable(obj){
        obj['on'] = event.onFunc;
        obj['off'] = event.offFunc;
        obj['emit'] = event.emitFunc;

        return obj;
    };

    emittable(emittable.prototype); 

    return emittable;
});
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
define('cogs/prop',['require'],function (argument) {

    function defaultGetter(){
        return this.value;
    };
    
    function defaultSetter(value){
        this.value = value;
        return value;
    };

    function prop(getter, setter){
        var ret, data;
        if (getter == null &&
            setter == null){
            data = {};
            getter = bind.call(defaultGetter, data);
            setter = bind.call(defaultSetter, data);
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

    return prop;
});
     
define('cogs',['./cogs/ctor', './cogs/noop', './cogs/stub', './cogs/mixin', './cogs/observable', './cogs/event', './cogs/emittable', './cogs/prop'], 
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
parentDefine(function() { return require('cogs'); }); 
}());