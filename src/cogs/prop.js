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
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define(function (argument) {

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