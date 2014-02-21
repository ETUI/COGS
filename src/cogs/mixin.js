/**
 * @function: mixin
 **/

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function () {
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