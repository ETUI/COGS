var chai, spies, should, cogs, assert, expect;

if (require){
    chai = require('chai');
    spies = require('chai-spies');

    cogs = require('../cogs');
}
else{
    chai = this.chai;
    spies = chai_spies;
}

chai.use(spies);

expect = chai.expect;
assert = chai.assert;

describe('.event', function(){

    it('should be a function', function(){

        expect(cogs.event).is.a('function');

    });

    it('should return a function when called', function(){

        var onSomething = cogs.event();

        expect(onSomething).is.a('function');

    });

    it('can hook another function', function(){

        var spy = function(){};

        var onSomething = cogs.event();

        onSomething.hook(spy);

    });

    it('can call into hooked functions with same context and argument when itself is called.', function(){
        var scope,
            foobar = {},
            context = {};

        var spy = chai.spy(function(arg1){
            expect(arg1).equal(foobar);
            expect(this).equal(context);
        });

        var onSomething = cogs.event();

        onSomething.hook(spy);

        onSomething.call(context, foobar);

        expect(spy).called.once;

    });

});
