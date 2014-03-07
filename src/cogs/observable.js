/**
 * @function: observable
 **/

//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(['./noop'], function (noop) {

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
})