'use strict';

var through      = require('through2'),
    gutil        = require('gulp-util'),
    http         = require('http'),
    jsonBody     = require('body/json'),
    connectRoute = require('connect-route'),
    connect      = require('connect'),
    jsonPath     = require('JSONPath'),
    velocity     = require('velocityjs'),
    Q            = require('q'),
    fs           = require('fs'),
    path         = require('path');

module.exports = server;

////////////////////////////////////////////////////////////////////

/*
 * Runs a local server for all lambda handlers
 * connected to the endpoint defined in config/routes
 */
function server(options){
  var rootPath = process.cwd(),
      env      = (process.env.NODE_ENV || 'dev').toLowerCase(),
      routesPath = options.routes.replace('{NODE_ENV}', env),
      configPath = options.config.replace('{NODE_ENV}', env),
      routes   = require(path.join(rootPath, routesPath)),
      config   = require(path.join(rootPath, configPath)),
      app      = connect();

  // Create server
  var stream = through.obj(function(file, enc, callback) {

    app.use(connectRoute(function (router) {
      apiEndpoint(file, routes).then(function(endpoint){

        router[endpoint.httpMethod](parsePath(endpoint.path), function (req, res) {
          jsonBody(req, res, function(err, json){
            res.setHeader("content-type", "application/json");
            if (err) res.end(JSON.stringify({msg: "bad json payload"}));
            else{
              var event   = new Event(config, endpoint.jsonRequestTemplate, req, json),
                  context = new Context(function(data){
                    if(endpoint.enableCORS) res.setHeader("Access-Control-Allow-Origin", "*");
                    res.end(data);
                  });

              endpoint.lambda.handler(event, context);
            }
          });
        });
      });

    }));

    this.push(file);
    callback();
  });

  var webserver = http.createServer(app).listen(options.port);
  gutil.log('Webserver started at', gutil.colors.cyan('http' + '://localhost:' + options.port));

  stream.on('kill', function() {
    webserver.close();
  });

  return stream;
}


/*
 * Lambda Event class
 */
function Event(config, template, req, body){
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
    stageVariables: config.deployment.stage.variables,
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


/*
 * Lambda Context class
 */
function Context(cb){
  return {
    succeed: function (data) {
      var result = JSON.stringify(data);
      console.log('succeed: ' + result);
      cb(JSON.stringify(result, null, 2));
    },
    fail: function (data) {
      var result = JSON.stringify(data);
      console.log('fail: ' + result);
      cb(JSON.stringify(result, null, 2));
    },
    done: function () {
      console.log('Done!');
      cb(JSON.stringify({}, null, 2));
    }
  };
}


/*
 * Transforms path from ApiGateway format to connect-route format
 * @params  {path} eg '/a/{id}'
 * @returns {path} eg '/a/:id'
 */
function parsePath(path){
  return path.replace(/\{/g, ':').replace(/\}/g, '');
}


/*
 * Extracts lambda configuration for api endpoint
 *
 * @param {file} Vinyl file
 * @param {routes} config file
 * @return {object} with httpMethod, path, lambdaFn
 */
function apiEndpoint(file, routes){
  var tmp        = file.path.split('/'),
      lambdaName = tmp[tmp.length - 1],
      deferred   = Q.defer(),
      enableCORS;

  for (var resource in routes) {
    enableCORS = routes[resource].enableCORS;

    for(var method in routes[resource].methods) {
      var currentMethod = routes[resource].methods[method];

      if (currentMethod === lambdaName || currentMethod.name === lambdaName){
        /* load integration request template for json */
        var endpoint = {
          enableCORS      : currentMethod.enableCORS || enableCORS,
          path            : resource.toLowerCase(),
          httpMethod      : method.toLowerCase(),
          lambda          : require(file.path)
        };

        var d = Q.defer();
        fs.readFile(
          path.join(file.path,'integration','request','application_json.vm'),
          function(err, data){
            if(err) d.reject();
            else    d.resolve(data.toString());
          });

        d.promise.then(
          function(template) {
            endpoint.jsonRequestTemplate = template;
            deferred.resolve(endpoint);
          },
          function(err){ deferred.resolve(endpoint); });
      }
    }
  }

  return deferred.promise;
}
