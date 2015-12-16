'use strict';

var gulp    = require('gulp'),
    through = require('through2'),
    gutil   = require('gulp-util'),
    zip     = require('gulp-zip'),
    path    = require('path'),
    Q       = require('q'),
    extend  = require('xtend'),
    AWS     = require('aws-sdk');

var PluginError = gutil.PluginError,
    PluginName = 'gulp-swag';

module.exports = {
  deploy : deploy
};

//////////////////////////////////////////////////////////////////////////////////////////

/*
 * Deploys an lambda deployment package to AWS
 *
 */
function deploy(options){
  var stream = through.obj(function(file, enc, callback) {
    var tmp     = file.path.split('/'),
        zipName = tmp[tmp.length - 1];

    var desc = require(path.join(file.path,'package')).description;

    gulp.src('**/*', {cwd: file.path})
      .pipe(zip(zipName+'.zip'))
      .pipe(upload(extend(options, {lambdaDesc: desc})));

    callback();
  });

  return stream;
}


/*
 * Uploads a lambda deployment package
 * and connects it to end ApiGateway endpoint
 *
 * @params {routes config file}
 */
function upload(options){
  var rootPath   = process.cwd(),
      routes     = require(path.join(rootPath, options.routes)),
      config     = require(path.join(rootPath, options.config)),
      self;

  var lambda = new AWS.Lambda({
    region : config.AWS.region,
    apiVersion: config.AWS.Lambda.apiVersion
  });

  var stream = through.obj(function(file, enc, cb){
    self = this;
    var genericLambdaRole, role;

    var tmp  = file.path.split('/'),
        lambdaName = tmp[tmp.length - 1].replace('.zip', '');

    for (var resource in routes) {
      genericLambdaRole = routes[resource].role;

      for(var method in routes[resource].methods) {
        var currentMethod = routes[resource].methods[method];

        if (currentMethod === lambdaName || currentMethod === lambdaName){
          role = currentMethod.role || genericLambdaRole;
        }
      }
    }

    find({
      file: file,
      role: role,
      description: options.lambdaDesc
    })
      .then(update, create)
      .then(cb);
  });

  ////////////////////////////////////////////////////////////////

  function find(options){
    var tmp    = options.file.path.split('/'),
        fnName = tmp[tmp.length - 1].split('.')[0];

    var deferred = Q.defer(),
        params    = {
          FunctionName : fnName
        },
        input = extend(params, {
          vinylFile : options.file,
          role      : options.role,
          description: options.description
        });

    lambda.getFunction(params,function(err, data){
      if(err) deferred.reject(extend(err, input));
      else    deferred.resolve(extend(data, input));
    });
    return deferred.promise;
  }

  function create(data){
    var params = {
      Code: {                           /* required */
        ZipFile: data.vinylFile.contents
      },
      FunctionName : data.FunctionName, /* required */
      Handler      : 'index.handler',   /* required */
      Role         : data.role  ,       /* required */
      Runtime      : 'nodejs',          /* required */
      Description  : data.description,  /* from handler package.json */
      MemorySize   : 128,               /* multiple of 64 */
      Publish      : true,
      Timeout      : 3
    };

    lambda.createFunction(params,function(err, data){
      if(err) self.emit('error', new PluginError(PluginName, err));
      else {
        gutil.log('Lambda '+ data.FunctionName +' created :: ✔︎');
//        gutil.log(data);
      }
    });
  }

  function update(data){
    var params = {
      FunctionName : data.FunctionName, /* required */
      Publish      : true,
      ZipFile      : data.vinylFile.contents
    };
    lambda.updateFunctionCode(params, function(err, data) {
      if (err) self.emit('error', new PluginError(PluginName, err));
      else {
        gutil.log('Lambda '+ data.FunctionName +' updated :: ✔︎');
//        gutil.log(data);
      }
    });
  }

  ////////////////////////////////////////////////////////////////

  return stream;
}
