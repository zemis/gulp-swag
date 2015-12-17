'use strict';

var Context = require('../src/lambda/context'),
    expect  = require('chai').expect;

describe('AWS Lambda Context',function(){
  var context,
      testData;

  beforeEach(function(){
    context = new Context(function(data){
      expect(data).to.equal(JSON.stringify(testData,null,2));
    });
  });

  it('.succeed(data)', function(){
    testData = { ok: true};
    context.succeed(testData);
  });

  it('.fail(err)', function(){
    testData = { ok: false};
    context.fail(testData);
  });
  
  it('.done(null, data) for success', function(){
    testData = {success: true};
    context.done(null,testData);
  });

  it('.done(err) for an error', function(){
    testData = {err: true};
    context.done(testData);
  });

  it('.done() does nothing', function(){
    var undefined;
    testData = undefined;
    context.done();
  });
});

