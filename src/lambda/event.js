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
  var event = {},
      data = {
        json   : body,
        params : req.params
      },
      environment = {
        stageVariables: stageVariables,
        input: {
          params : paramsFn,
          path   : pathFn,
          json   : jsonFn,
          data   : data
        }
      };

  if(template){
    try{
      event = JSON.parse(render(template, environment));
    }
    catch(err){
      console.log("JSON parsing error for mapping template :: ",template," :: error ::",err);
      throw err;
    }
  }

  function jsonFn(path){
    var res = jsonPath.eval(this.data.json, path)[0];
    return JSON.stringify(res);
  }

  function pathFn(){
    // TODO : define me
    throw 'define me';
  }

  function paramsFn(){
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


  return event;
}
