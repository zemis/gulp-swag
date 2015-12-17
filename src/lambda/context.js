'use strict';

module.exports = Context;

////////////////////////////////////

/*
 * AWS Lambda Context class
 */
function Context(cb){
  return {
    succeed: function (data) {
      cb(JSON.stringify(data, null, 2));
    },
    fail: function (data) {
      cb(JSON.stringify(data, null, 2));
    },
    done: function (err, data) {
      if(err) this.fail(err);
      else    this.succeed(data);
    }
  };
}
