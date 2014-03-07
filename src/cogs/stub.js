/**
 * @function: stub
 **/

//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(function () {
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