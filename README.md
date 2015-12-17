# gulp-swag [![Build Status](https://api.travis-ci.org/zemis/gulp-swag.svg?branch=master)](https://travis-ci.org/zemis/gulp-swag)

Gives the ability to develop and test your API locally and deploy it on AWS.
It uses API Gateway and Lambda at its core.

## Install
```sh
$ npm install -D gulp-swag
```

## Sample project
This [Demo](https://github.com/zemis/gulp-swag-demo) creates an API with one endpoint /articles.
It uses AWS Api Gateway, Lambdas and DynamoDB.


## Details
In your gulpfile.js:
```js
var swag       = require('gulp-swag'),
    db         = swag.db
    lambda     = swag.lambda,
    apigateway = swag.apigateway,
    i          = swag.utils.interpolate

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
```

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
More information on [mapping template](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html).
Find out about Api Gateway [Stage Variables](https://docs.aws.amazon.com/apigateway/latest/developerguide/stage-variables.html).

NB: $stageVariables are defined in the config.json file

```js
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
```

## Examples configuration files of routes.json

### config.json
This file store AWS settings for the services used (region, api version, db endpoint).
```js
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
```
The property deployment.credentials is set to the IAM Role ARN with at least the following permissions:
* lambda:InvokeFunction
* iam:PassRole


and needs to have the Trust Relationships set like below:
```js
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"    
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### routes.json
This file defines the associatons between path and lambda functions.
```js
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
```

The role property is set to ARN role defined with sufficent permission depending on what services are used. More information on how to create it [here](http://docs.aws.amazon.com/lambda/latest/dg/intro-permission-model.html).


### version.json
Specifies which lambda function version to use for the deployment.
```js
{
  "Lambda":{
    "lambdaRootPost": "$LATEST",
    "lambdaRootGet": 2
  }
}
```
NB: At the moment version.json is only used for deployed API.
the local server uses the latest version of lambda handlers.