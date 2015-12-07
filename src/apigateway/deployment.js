'use strict';

var gutil = require('gulp-util'),
    extend = require('xtend'),
    dateTime = require('date-time');

module.exports = step;

///////////////////////////////////////

function step(apigateway, config){
  function deploymentStep(input, cbk){
    gutil.log('Starting deployment step');

    var params = {
      restApiId          : input.restApi.id,              /* required */
      stageName          : config.deployment.stage.name,  /* required */
      cacheClusterEnabled: false,                         /* true || false */
      // cacheClusterSize: '0.5 | 1.6 | 6.1 | 13.5 | 28.4 | 58.2 | 118 | 237',
      description: "Auto deploy "+ dateTime(),
      variables          : config.deployment.stage.variables,
      stageDescription   : config.deployment.stage.description
    };

    apigateway.createDeployment(params, function(err, data) {
      if (err) {
        gutil.log("deployment error ::: ", err);
        cbk(err);
      }
      else{
        gutil.log("Deployment step done ::: ✔︎");
        cbk(null,extend(input,{deployment: data}));
      }
    });
  }

  return deploymentStep;
}
