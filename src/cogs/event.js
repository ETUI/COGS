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

//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(['./observable'], function(observable){
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
})