'use strict';

var apigateway = require('./src/apigateway'),
    dynamodb   = require('./src/dynamodb'),
    lambda     = require('./src/lambda'),
    utils      = require('./src/utils');

module.exports = {
  apigateway : apigateway,
  dynamodb   : dynamodb,
  lambda     : lambda,
  utils      : utils
};
