'use strict';

var Q     = require('q'),
    gutil = require('gulp-util');

module.exports = step;

////////////////////////////////////////

function step(apigateway, config, routes){
  /*
   * creates or updates the api specified in options
   * @param {Fn} callback fn used by async.waterfall
   */
  function apiStep(cbk){
    gutil.log("Starting api step");
    findApi({ name: config.deployment.api.name }).
      then(updateApi, createApi).
      then(function(data){
        gutil.log("Api step done ::: ✔︎");
        cbk(null, {restApi: data, routes: routes});
      });
  }

  /*
   * finds a rest api by name
   * @param {Object} eg {name: 'apiName'}
   */
  function findApi(opt){
    var deferred = Q.defer(),
        promiseParams = {
          name: opt.name
        },
        params = {
          limit: 100
        };

    apigateway.getRestApis(params, function(err, data) {
      if (err) {
        promiseParams.err = err;
        deferred.reject(promiseParams);
      }
      else{
        data.items.forEach(function(e){
          if (e.name.toLowerCase() == opt.name.toLowerCase()){
            deferred.resolve(e);
          }
        });
        if(deferred.promise.inspect().state === 'pending'){
          promiseParams.err = {msg: ("No api of name " + opt.name + " found")};
          deferred.reject(promiseParams);
        }
      }
    });

    return deferred.promise;
  }

  /*
   * create an rest api
   */
  function createApi(opts){
    var deferred = Q.defer(),
        params = {
          name        :  opts.name,
          description :  opts.description
        };

    apigateway.createRestApi(params, function(err, data) {
      if (err) deferred.reject(err);
      else     deferred.resolve(data);
    });

    return deferred.promise;
  }

  /*
   *  does nothing
   */
  function updateApi(opts){
    // NOOP function
    var deferred = Q.defer();
    deferred.resolve(opts);
    return deferred.promise;
  }

  return apiStep;
}
