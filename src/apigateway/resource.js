'use strict';

var __     = require('underscore'),
    async  = require('async'),
    extend = require('xtend'),
    gutil  = require('gulp-util'),
    Q      = require('q');

module.exports = step;

////////////////////////////////////////////////

function step(apigateway){
  /*
   * Finds existing resources for an api
   * and synchronises resources defined in routes.json and existing resources
   */
  function resourceStep(input, cbk){
    gutil.log("Starting resource step");
    findResources(input).
      then(syncResources).
      then(function(data){
        gutil.log("Resource step done ::: ✔︎");
        cbk(null, extend(input, {resources: data}));
      });
  }

  /*
   * returns 100 first current resources
   */
  function findResources(input){
    var deferred = Q.defer(),
        promiseParams = {
          restApiId  : input.restApi.id,
          restApiName: input.restApi.name,
          routes     : input.routes
        },
        params   = {
          restApiId : input.restApi.id,
          limit: 100
        };

    apigateway.getResources(params, function(err, data) {
      if (err) {
        promiseParams.err = err;
        deferred.reject(promiseParams);
      }
      else{
        deferred.resolve(extend(promiseParams,{resources: data.items}));
      }
    });

    return deferred.promise;
  }


  /*
   * synchronises resources defined in routes.json
   */
  function syncResources(input){
    var deferred      = Q.defer(),
        promiseParams = input.resources;

    var existingResources = __.pluck(input.resources, 'path'),
        definedResources  = Object.keys(input.routes);

    var resourcesToCreate = __.difference(definedResources, existingResources),
        resourcesToDelete = __.rest(__.difference(existingResources, definedResources));

//    gutil.log("resourcesToCreate :: ", resourcesToCreate);
//    gutil.log("resourcesToDelete :: ", resourcesToDelete);

    function getResourceId(path){
      return __.filter(input.resources, function(r) { return r.path === path;})[0].id;
    }

    function findParentId(path){
      return __.filter(promiseParams, function(e) { return e.path === path; })[0].id;
    }

    function storeResource(details){
      return promiseParams.push(details);
    }

    /* resources To Delete */
    async.eachSeries(
      resourcesToDelete,
      function deleteResource(path, callback){
        var params = {
          resourceId: getResourceId(path), /* required */
          restApiId : input.restApiId      /* required */
        };

        apigateway.deleteResource(params, function(err) {
          if (err) gutil.log("Error deleting "+ path +" ::: ✘", err);
          else {
            gutil.log("Resource "+ path +" deleted ::: ✔︎");
            callback();
          }
        });
      });

    /* resources To Create */
    async.eachSeries(
      resourcesToCreate,
      function createResource(path, callback){
        var parts      = path.split('/'),
            pathPart   = parts.pop(),
            parentPath = parts.join('/');

        if(parentPath === '') parentPath = '/';

        var params = {
          parentId:  findParentId(parentPath), /* required */
          pathPart:  pathPart,                 /* required */
          restApiId: input.restApiId           /* required */
        };

        apigateway.createResource(params, function(err, data) {
          if(err) callback(err);
          else {
            gutil.log("Resource "+ path +" created ::: ✔︎");
            storeResource(data);
            callback();
          }
        });
      },
      function(err){
        if(err) deferred.reject(err);
        else    deferred.resolve(promiseParams);
      });

    return deferred.promise;
  }

  return resourceStep;
}
