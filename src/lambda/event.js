'use strict';

var jsonPath = require('JSONPath'),
    velocity = require('velocityjs');

module.exports = Event;

/////////////////////////////////////////////
/*
 * AWS Lambda Event class
 * @param {Object} config 
 */
function Event(stageVariables, template, req, body){
  var event = {};

  function json(path){
    var res = jsonPath.eval(this.data.json, path)[0];
    return JSON.stringify(res);
  }

  function path(){
    // TODO : define me
    throw 'define me';
  }

  function params(){
    if(arguments[0]){
      return this.data.params[arguments[0]];
    }
    else{
      return JSON.stringify(this.data.params);
    }
  }

  function render(tmpl, env){
    return (new velocity.Compile(velocity.parse(tmpl))).render(env);
  }

  var data = {
    json   : body,
    params : req.params
  };

  var env = {
    stageVariables: stageVariables,
    input: {
      params : params,
      path   : path,
      json   : json,
      data   : data
    }
  };

  if(template){
    event = JSON.parse(render(template, env));
  }

  return event;
}
