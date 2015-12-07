# gulp-swag

Gives the ability to develop and test your API locally and deploy it on AWS.
It uses API Gateway and Lambda at its core.

In your gulpfile.js:


    gulp.task('db:migrate', function(){
      return gulp.src('./db/definitions/*.json')
        .pipe(db.migrate({
          config: './env/{NODE_ENV}/config.json'
        }));
    });
    
    gulp.task('lambda:server', function() {
      gulp.src('./handlers/*')
        .pipe(lambda.server({
          config : './env/{NODE_ENV}/config',
          routes : './env/{NODE_ENV}/routes',
          port   : 5000
        }));
    });
    
    gulp.task('lambda:deploy', function(){
      gulp.src('./handlers/*')
        .pipe(lambda.deploy({
          config : './env/{NODE_ENV}/config',
          routes : './env/{NODE_ENV}/routes'
      }));
    });
    
    gulp.task('apigateway:deploy', function(){
      var path = './env/{NODE_ENV}/routes.json'.replace('{NODE_ENV}',(process.env.NODE_ENV || 'dev'));
    
      gulp.src(path)
        .pipe(apigateway.deploy({
          handlers: './handlers',
          version : './env/{NODE_ENV}/version',
          config  : './env/{NODE_ENV}/config',
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
        "lambdaRootPost": "$LATEST",
        "lambdaRootGet": 2
      }
    }
