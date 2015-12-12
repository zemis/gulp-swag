'use strict';

var Event = require('../src/lambda/event'),
    expect = require('chai').expect;

describe('AWS Lambda Event', function(){
  var httpRequest, json, stageVariables, template;

  beforeEach(function(){
    httpRequest = {
      params: {}
    };

    stageVariables = {};
  });

  it('is empty when no template is provided', function(){
    var event = new Event(stageVariables, null, httpRequest, json);
    expect(event).to.be.empty;
  });

  describe('request json', function(){
    beforeEach(function(){
      template = '{ "foo": $input.json(\'$.foo\'), "name": $input.json(\'$.name\') }';
      json = {
        foo: ['bar', 'baz'],
        name: "pat"
      };
    });

    it('returns json input',function(){
      var event = new Event(stageVariables, template, httpRequest, json);
      expect(event).to.eql({
        foo: ['bar', 'baz'],
        name: "pat"
      });
    });

  });

  describe('request parameters', function(){
    var params;
    beforeEach(function(){
      params = {
        id: 1,
        fooId: 2
      };

      httpRequest.params = params;

      template = '{ "allParams": $input.params(), "id": $input.params(\'id\'), "fooId": $input.params(\'fooId\') }';
    });

    it('returns all request parameters', function(){
      var event = new Event(stageVariables, template, httpRequest, {});

      expect(event).to.eql({
        allParams: params,
        id: params.id,
        fooId: params.fooId
      });
    });
  });

});
