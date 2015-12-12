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

  it('.succeed()', function(){
    testData = { ok: true};
    context.succeed(testData);
  });

  it('.fail()', function(){
    testData = { ok: false};
    context.succeed(testData);
  });
  
  it('.done()', function(){
    testData = {};
    context.succeed(testData);
  });
});

