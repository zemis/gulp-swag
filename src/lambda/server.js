'use strict';

var through      = require('through2'),
    gutil        = require('gulp-util'),
    http         = require('http'),
    jsonBody     = require('body/json'),
    connectRoute = require('connect-route'),
    connect      = require('connect'),
    Event        = require('./event'),
    Context      = require('./context'),
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
      routes   = require(path.join(rootPath, options.routes)),
      config   = require(path.join(rootPath, options.config)),
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
              var event   = new Event(config.deployment.stage.variables, endpoint.jsonRequestTemplate, req, json),
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
