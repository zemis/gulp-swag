# gulp-swag [![Build Status](https://api.travis-ci.org/zemis/gulp-swag.svg?branch=master)](https://travis-ci.org/zemis/gulp-swag)

Gives the ability to develop and test your API locally and deploy it on AWS.
It uses API Gateway and Lambda at its core.

In your gulpfile.js:


    var swag       = require('gulp-swag'),
        db         = swag.db
        lambda     = swag.lambda,
        apigateway = swag.apigateway,
        i          =  swag.utils.interpolate

    gulp.task('db:migrate', function(){
      return gulp.src('./db/definitions/*.json')
        .pipe(db.migrate({
          config: i('./env/{NODE_ENV}/config.json')
        }));
    });
    
    gulp.task('lambda:server', function() {
      gulp.src('./handlers/*')
        .pipe(lambda.server({
          config : i('./env/{NODE_ENV}/config'),
          routes : i('./env/{NODE_ENV}/routes'),
          port   : 5000
        }));
    });
    
    gulp.task('lambda:deploy', function(){
      gulp.src('./handlers/*')
        .pipe(lambda.deploy({
          config : i('./env/{NODE_ENV}/config'),
          routes : i('./env/{NODE_ENV}/routes')
      }));
    });
    
    gulp.task('apigateway:deploy', function(){
      gulp.src(i('./env/{NODE_ENV}/routes.json'))
        .pipe(apigateway.deploy({
          handlers: './handlers',
          version : i('./env/{NODE_ENV}/version'),
          config  : i('./env/{NODE_ENV}/config')
        }));
    });
  

## Sample project file structure using 'gulp-swag'


      db
        definitions
          createTable.json     
      env
        development
          config.json
          routes.json
          version.json
      handlers
        lambdaFN1
          index.js
          intergation
            request
              application_json.vm
          node_modules    
        lambdaFN2
          index.js
          intergation
            request
              application_json.vm
          node_modules


## Integration templates

### Request template
Use to define the 'event' object passed to the lambda function.
https://docs.aws.amazon.com/apigateway/latest/developerguide/stage-variables.html
NB: $stageVariables are defined in the config.json file


    {
      "db": {
        "tableNamespace": "$stageVariables.tableNamespace",
        "config": {
          "endpoint"  : "$stageVariables.dynamoDbEndpoint",
          "apiVersion": "$stageVariables.dynamoDbApiVersion",
          "region"    : "$stageVariables.dynamoDbRegion"
        }
      },
      "article": $input.json('$.article')
    }
      

## Examples configuration files of routes.json

### config.json
This file store AWS settings for the services used (region, api version, db endpoint).

    
    {
      "AWS":{
        "region"    : "us-west-2",
        "DynamoDB"  : {
          "apiVersion" : "2012-08-10",
          "endpoint"   : "http://localhost:8000"
        },
        "Lambda"    : { "apiVersion" : "2015-03-31" },
        "APIGateway": { "apiVersion" : "2015-07-09" }
      },
    
      "deployment": {
        "api"        : { "name": "MyNewApi" },
        "credentials": "arn:aws:iam::11111111111:role/DeployApiGateway",
        "stage"      : {
          "name"       : "dev",
          "description": "Development stage (Edge)",
          "variables"  : { 
            "tableNamespace": "dev_",
            "dynamoDbEndpoint"    : "http://localhost:8000",
            "dynamoDbApiVersion"  : "2012-08-10",
            "dynamoDbRegion"      : "us-west-2"
          }
        }
      }
    }


### routes.json
This file defines the associatons between path and lambda functions.

    
    {
      "/": {
        "methods": {
          "POST": "lambdaFn1",
          "GET" : {
            "enableCORS": false,
            "role": "arn:aws:iam::1111111111:role/APIGatewayLambdaExecRole",
            "name": "lambdaFn2"
          }
        },
        "enableCORS": true,
        "role": "arn:aws:iam::1111111111:role/APIGatewayLambdaExecRole"
      }
    }


### version.json
Specifies which lambda function version to use for the deployment.


    {
      "Lambda":{
        "lambdaFn1": "$LATEST",
        "lambdaFn2": 2
      }
    }
