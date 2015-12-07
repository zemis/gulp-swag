'use strict';

var server = require('./lambda/server'),
    d      = require('./lambda/deploy');

module.exports = {
  server : server,
  build  : d.build,
  deploy : d.deploy
};
