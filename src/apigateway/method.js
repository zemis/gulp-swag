'use strict';

var __    = require('underscore'),
    async = require('async'),
    gutil = require('gulp-util'),
    fs    = require('fs'),
    path  = require('path'),
    Q     = require('q');

module.exports = step;

///////////////////////////////////////

function step(apigateway, config, lambda, version, handlersPath){
  /*
    @param {Object} eg
{
  restApi: {
    id: 'satnhe23',
    name: 'api-name',
    createdDate: 'Tue Apr 12 2015 12:31:18 GMT+0000 (GMT)'
  },
  routes: {
    '/articles': {
      "enableCORS": true,
      "role": "arn:aws:iam::232222222222:role/APIGatewayLambdaExecRole",
      "methods": {
        "POST": {
          "name": "create_article",
          "role": "arn:aws:iam::232222222222:role/APIGatewayLambdaExecRole",
          },
          "GET": "list_articles
        }
      }
    }
  },
  resources: [
    {
      id: '34uouo4',
      parentId: 'snth2eoeu4',
      pathPart: 'articles',
      path: '/articles'
    },
    {
      id: '234230oeu',
      path: '/'
    }
  ]
}
   */

  function methodStep(input, cbk){
    gutil.log("Starting method step");

      async.eachSeries(
        input.resources,
        function(resource, callback){
          var resourceConfig = input.routes[resource.path];
          if(typeof resourceConfig === 'undefined') callback();

          var params = {
            restApiId : input.restApi.id,
            resource  : resource,
            methods   : resourceConfig.methods
          };

          deleteMethods(params).
            then(addMethods).
            then(addMethodIntegrations).
            then(addMethodResponses).
            then(addMethodIntegrationResponses).
            then(function(data){
              callback(data);
            });
        },

        function(){
          gutil.log("Method step done ::: ✔︎");
          cbk(null, input);
        }
      );
  }

  /*
   * deletes all methods for each resource provided
   * @param {Object} eg :
   {
     restApiId: 'stnh',
     resource : {id: 'stnh', path: '/articles', parentId: 'snth2eoeu4', pathPart: 'articles'},
     methods  : {"POST": {}} || "create_articles
   }
  */
  function deleteMethods(opt){
    var deferred = Q.defer();

    async.eachSeries(
      ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
      function(method,cb){
        apigateway.deleteMethod({
          httpMethod : method,
          resourceId : opt.resource.id,
          restApiId  : opt.restApiId
        }).send();
        cb();
      },
      function(){
        deferred.resolve(opt);
      });

    return deferred.promise;
  }

  /*
   * adds defined methods to resource
   * @param {Object} eg :
   {
     restApiId: 'stnh',
     resource : {id: 'stnh', path: '/articles', parentId: 'snth2eoeu4', pathPart: 'articles'},
     methods  : {"POST": {}} || "create_articles
   }
  */
  function addMethods(opt){
    var deferred = Q.defer();

    async.forEachOfSeries(
      opt.methods,
      function(obj, method, cb){
        var params = {
          authorizationType : 'NONE',               /* required NONE | IAM |*/
          httpMethod        : method.toUpperCase(), /* required */
          resourceId        : opt.resource.id,      /* required */
          restApiId         : opt.restApiId,        /* required */
          apiKeyRequired    : false,                /* true || false */
          requestModels     : requestModels(),
          requestParameters : requestParameters(opt.resource.path),
        };

        apigateway.putMethod(params, function(err) {
          if (err) {
            gutil.log(opt.resource.path, " -- error in method addition ", err, ' with params :', params);
            cb(err);
          }
          else {
//            gutil.log(opt.resource.path, " -- success in method addition ", data);
            cb();
          }
        });
      },
      function(err){
        if(err) deferred.reject(err);
        else    deferred.resolve(opt);
      });

    return deferred.promise;
  }

  /*
   * adds method Integrations to resource
   * @param {Object} eg :
   {
     restApiId: 'stnh',
     resource : {id: 'stnh', path: '/articles', parentId: 'snth2eoeu4', pathPart: 'articles'},
     methods  : {"POST": {name: "create_article", enableCORS: true}, "GET": "create_articles"}
   }
  */
  function addMethodIntegrations(opt){
    var deferred = Q.defer();

    async.forEachOfSeries(
      opt.methods,
      function(methodDetails, httpMethod, cb){
        var lambdaFnName = methodDetails.name || methodDetails;
        lambdaUri(lambdaFnName, version.Lambda[lambdaFnName], config.AWS)
          .then(function(uri){
            return [uri, requestTemplate(lambdaFnName, handlersPath)];
          })
          .spread(function(uri, jsonTemplate){
            var params = {
              httpMethod : httpMethod.toUpperCase(), /* required */
              resourceId : opt.resource.id,          /* required */
              restApiId  : opt.restApiId,            /* required */
              type       : 'AWS',                    /* 'HTTP | AWS | MOCK',  required */
              cacheKeyParameters: [
                /* more items */
              ],
              // cacheNamespace: 'STRING_VALUE',
              credentials           : config.deployment.credentials,
              integrationHttpMethod : httpMethod.toUpperCase(),
              requestParameters     : requestParameters(opt.resource.path),
              requestTemplates      : jsonTemplate,
              uri                   : uri
            };

            apigateway.putIntegration(params, function(err) {
              if (err) cb(err);
              else     cb();
            });

          });
      },
      function(err){
        if(err) deferred.reject(err);
        else    deferred.resolve(opt);
      });

    return deferred.promise;
  }


  /*
   * creates method response
   */
  function addMethodResponses(opt){
    var deferred = Q.defer();

    async.forEachOfSeries(
      opt.methods,
      function(methodDetails, method, cb){

        var responseParameters = {};
        if (config.enableCORS){
          responseParameters['method.response.header.Access-Control-Allow-Origin'] = false;
        }

        var params = {
          httpMethod  : method.toUpperCase(), /* required */
          resourceId  : opt.resource.id,      /* required */
          restApiId   : opt.restApiId,        /* required */
          statusCode  : '200',                /* required */
          responseModels: { 'application/json': 'Empty' },
          responseParameters: responseParameters
        };

        apigateway.putMethodResponse(params, function(err, data) {
          if (err) cb(err);
          else     cb();
        });
      },
      function(err){
        if(err) deferred.reject(err);
        else    deferred.resolve(opt);
      });

    return deferred.promise;
  }


  function addMethodIntegrationResponses(opt){
    var deferred = Q.defer();

    async.forEachOfSeries(
      opt.methods,
      function(methodDetails, method, cb){

        var responseParameters = {};
        if (config.enableCORS){
          responseParameters['method.response.header.Access-Control-Allow-Origin'] = "'*'";
        }

        var params = {
          httpMethod  : method.toUpperCase(), /* required */
          resourceId  : opt.resource.id,      /* required */
          restApiId   : opt.restApiId,        /* required */
          statusCode  : '200',                /* required */
          responseParameters: responseParameters,
          responseTemplates : { 'application/json': null },
          selectionPattern  : null
        };

        apigateway.putIntegrationResponse(params, function(err, data) {
          if (err) cb(err);
          else     cb();
        });
      },
      function(err){
        if(err) deferred.reject(err);
        else    deferred.resolve(opt);
      });

    return deferred.promise;
  }

  /////////////////////////////////////////////////////////////////////////////////////
  ///                      HELPER FUNCTIONS                                         ///
  /////////////////////////////////////////////////////////////////////////////////////

  /*
   * @param {String} path eg '/foo/{fooId}/bar/{id}
   * @return {Object} eg {'method.request.path.fooId': true, 'method.request.path.id': true}
   */
  function requestParameters(path){
    var pathParams = __.map(path.match(/\{\w*\}/g), function(e) {
      return e.replace(/\{(\w*)\}/, '$1');
    });

    return __.reduce(pathParams,function(obj, param) {
      obj["method.request.path."+param] = true;
      return obj;
    },{});
  }

  function requestModels(){
    return {
      /* someKey: 'STRING_VALUE', */
    };
  }

  /*
   * Contructs requestTemplate object by reading template file
   * @param {String} lambda function name
   * @param {String} path to handlers dir
   * @return {Promise} with { "application/json": "$input.articles" }
   */
  function requestTemplate(lambdaName, pathToHandlers){
    var deferred  = Q.defer();

    fs.readFile(
      path.join(pathToHandlers, lambdaName, 'integration','request','application_json.vm'),
      function(err, data){
        if(err) deferred.reject();
        else    deferred.resolve({ "application/json": data.toString() });
      });
    return deferred.promise;
  }

  /*
   * Fetches lambda details then constructs uri
   * @param {String} lambda fn name
   * @param {String} version
   * @param {Object} AWS config
   * @return {Promise} of lambda uri string for api gateway
   */
  function lambdaUri(name, version, AWSConfig){
    var deferred = Q.defer();
    findLambda(name, version).then(function(data){
      deferred.resolve(apiGatewayLambdaUri(data.Configuration.FunctionArn, AWSConfig));
    });
    return deferred.promise;
  }

  /*
   * Fetches details about lambda function
   * @param {name}     lambda function name
   * @param {version}  lambda function version or latest if null
   * @return {promise}
   */
  function findLambda(name, version){
    var deferred = Q.defer();
    var params = {
      FunctionName : name, /* required */
      Qualifier    : version.toString()
    };
    lambda.getFunction(params, function(err, data) {
      if (err) {
        gutil.log("error in get lambda fn :: ",err);
        deferred.reject(err);}
      else     deferred.resolve(data);
    });
    return deferred.promise;
  }

  /*
   * build uri for putIntegration call
   * @param {String} lambda function arn
   * @param {Object} lambda region and verison
   * @return {String} api gateway lambda uri
   */
  function apiGatewayLambdaUri(fnArn, c){
    return "arn:aws:apigateway:" + c.region + ":lambda:path/" + c.Lambda.apiVersion + "/functions/" + fnArn + "/invocations";
  }

  return methodStep;
}
