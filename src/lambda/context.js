'use strict';

module.exports = Context;

////////////////////////////////////

/*
 * AWS Lambda Context class
 */
function Context(cb){
  return {
    succeed: function (data) {
      var result = JSON.stringify(data, null, 2);
      console.log('succeed: ' + result);
      cb(result);
    },
    fail: function (data) {
      var result = JSON.stringify(data, null, 2);
      console.log('fail: ' + result);
      cb(result);
    },
    done: function () {
      console.log('Done!');
      cb(JSON.stringify({}, null, 2));
    }
  };
}


