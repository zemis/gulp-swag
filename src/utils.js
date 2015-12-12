'use strict';

module.exports = {
  env : env,
  interpolate: interpolate
};

///////////////////////////////

/**
 * @return {String} environment variable set in NODE_ENV
 */
function env(){
  var nodeEnv = process.env.NODE_ENV;
  if((typeof nodeEnv === 'undefined') || nodeEnv === 'null')
    nodeEnv = 'dev';

  return nodeEnv;
}

/**
 * @param {String} string to interpolate eg "./env/{NODE_ENV}/file.json
 * @return {String} with the current NODE_ENV variable set
 */
function interpolate(str){
  var token = '{NODE_ENV}';
  return str.replace(token, env());
}
