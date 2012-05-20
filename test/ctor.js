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

describe('cogs', function(){

    it('should be a object', function(){
        expect(cogs).is.a("object");

        expect(cogs.ctor).is.a('function');

        expect(cogs.event).is.a('function');

        expect(cogs.emittable).is.a('function');

        expect(cogs.prop).is.a('function');
    });

    describe('.ctor', function(){

        it('should be a function', function(){

            expect(cogs.ctor).is.a('function');

        });

        it('should return a constructor which internally call into the first argument', function(){
            var scope;
            var spy = chai.spy(function(){
                scope = this;
            });
            var foobar = cogs.ctor(spy);

            var newObject = new foobar();

            expect(spy).called.once;

            expect(scope).equal(newObject);

        });

        it('should return a constructor that creates object which inherits from latter argument', 
            function(){

            var baseScope, derivedScope;
            
            var base = chai.spy(function(){

                    expect(derived).not_called;

                    baseScope = this;
                }), 
                derived = chai.spy(function(){

                    expect(base).called.once;

                    derivedScope = this;

                });

            base.prototype.method1 = function(){

            };

            base.prototype.method2 = function(){

            };

            base.prototype.method3 = function(){

            };

            derived.prototype.method2 = function(){

            };

            var ctor = cogs.ctor(derived, base);

            ctor.prototype.method3 = function(){

            };

            var newObject = new ctor();

            expect(base).called.once;

            expect(derived).called.once;

            expect(baseScope).equal(newObject);

            expect(derivedScope).equal(newObject);

            expect(newObject.method1).equal(base.prototype.method1);

            expect(newObject.method2).equal(derived.prototype.method2);

            expect(newObject.method3).equal(ctor.prototype.method3);

        });

        it('should return a constructor which internally ' + 
            'call into the latter argument and then call the former', 
            function(){

            

        });

    });

});