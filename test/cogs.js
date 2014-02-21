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

});