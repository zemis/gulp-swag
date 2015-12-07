'use strict';

var AWS            = require('aws-sdk'),
    async          = require('async'),
    path           = require('path'),
    through        = require('through2'),
    gutil          = require('gulp-util'),
    apiStep        = require('./apigateway/api'),
    resourceStep   = require('./apigateway/resource'),
    methodStep     = require('./apigateway/method'),
    deploymentStep = require('./apigateway/deployment');

var PluginError = gutil.PluginError;

module.exports = {
  deploy: deploy
};

//////////////////////////////////////////////////////////////////////////////

/*
* publishes a rest api based on the routes.json
*/
function deploy(options){
  var rootPath     = process.cwd(),
      env          = (process.env.NODE_ENV || 'dev').toLowerCase(),
      handlersPath = path.join(rootPath, options.handlers),
      versionPath  = options.version.replace('{NODE_ENV}', env),
      configPath   = options.config.replace('{NODE_ENV}', env),
      version      = require(path.join(rootPath, versionPath)),
      config       = require(path.join(rootPath, configPath));


  var apigateway = new AWS.APIGateway({
    region: config.AWS.region,
    apiVersion: config.AWS.APIGateway.apiVersion
  });

  var lambda = new AWS.Lambda({
    region: config.AWS.region,
    apiVersion: config.AWS.Lambda.apiVersion
  });

  var stream = through.obj(function(file, enc, cb){
    var self           = this,
        routes         = JSON.parse(file.contents.toString());

    async.waterfall(
      [
        apiStep(       apigateway, config, routes),
        resourceStep(  apigateway),
        methodStep(    apigateway, config, lambda, version, handlersPath),
        deploymentStep(apigateway, config)
      ],
      function(err, result){
        if(err){
          self.emit('error', new PluginError('Deploy ',err));
          cb(null, file);
          return;
        }
        else{
          gutil.log("Deployment done ::: ✔︎");
          gutil.log("deployment details ::: ", result);
          gutil.log("---------------------------------");
          gutil.log("API url ::: ", apiUrl({
            restApiId: result.restApi.id,
            region   : config.AWS.region,
            stage    : config.deployment.stage.name
          }));
          gutil.log("---------------------------------");
          cb();
        }
      });
  });

  function apiUrl(obj){
    return "https://"+ obj.restApiId + ".execute-api." + obj.region + ".amazonaws.com/" + obj.stage;
  }

  return stream;
}
