'use strict';

var AWS      = require('aws-sdk'),
    through  = require('through2'),
    gutil    = require('gulp-util'),
    path     = require('path'),
    extend   = require('xtend');

var PluginError = gutil.PluginError,
    PluginName = 'gulp-aws';

module.exports = {
  migrate: migrate
};

///////////////////////////////////////////////////////////////////

/*
 * Creates dynamoDb tables defined in db/definitions
 * @param {options} eg
{
  apiVersion: '2012-08-10',
  region   : 'us-west-2',
  endpoint : 'http://localhost:8000',
  table_namespace: 'dev'
}
 * if options.config it is used instead of supplied options
 */
function migrate(options) {
  var dbConfig = {
    DynamoDB: {
      apiVersion: '2012-08-10',
      region   : 'us-west-2',
      endpoint : 'http://localhost:8000'
    },
    tableNamespace: 'dev_'
  };

  if (options.config){
    var env      = (process.env.NODE_ENV || 'dev').toLowerCase(),
        filePath = options.config.replace('{NODE_ENV}', env),
        config = require(path.join(process.cwd(), filePath));

    dbConfig = {
      DynamoDB: {
        apiVersion : config.AWS.DynamoDB.apiVersion,
        region     : config.AWS.region,
        endpoint   : config.AWS.DynamoDB.endpoint
      },
      tableNamespace : config.deployment.stage.variables.tableNamespace
    };
  }
  else{
    dbConfig = extend(dbConfig, options);
  }

  var db = new AWS.DynamoDB(dbConfig.DynamoDB);

  gutil.log("Running migration using db endpoint:", dbConfig.DynamoDB.endpoint);
  gutil.log("Creating tables using table namespace:", dbConfig.tableNamespace);
  var stream = through.obj(
    function(file, enc, cb) {

      if (file.isNull()) {
        var err = new PluginError(PluginName, 'Not file supplied');
        cb(err);
        return;
      }

      if (file.isStream()) {
        var err = new PluginError(PluginName, 'Stream not supported !!!!');
        cb(err);
        return;
      }

      if (file.isBuffer()) {
        var params = JSON.parse(file.contents.toString()),
            t = file.path.split('/'),
            filebasename = t[t.length - 1];

        params.TableName = dbConfig.tableNamespace + params.TableName;

        db.createTable(params, function(err) {
          if (err) gutil.log(filebasename, ' :: ✘ ', err.message);
          else     gutil.log(filebasename, ' :: ✔︎');
        });
      }

      this.push(file);
      cb(null, file);
  });

  return stream;
}
