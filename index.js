'use strict';

var dynamodb   = require('./src/dynamodb'),
    lambda     = require('./src/lambda'),
    apigateway = require('./src/apigateway');

module.exports = {
  dynamodb   : dynamodb,
  lambda     : lambda,
  apigateway : apigateway
};
