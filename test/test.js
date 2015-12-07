var assert = require('assert'),
    gulp = require('gulp'),
    stream = require('stream'),
    gutil = require('gulp-util'),
    db = require('../src/dynamodb');

exports['test async uncaught'] = function(assert, done) {
  var s = gulp.src('');

  var fakeStream = new stream.Readable();
  var fakeFileS = new gutil.File({
    contents: fakeStream
  });

  s.on('error', function(e){
    console.log("error event ",e)
    assert(e.message, 'nnnnnnnnn')
    done()
  });

  s.pipe(db.migrate({}))
  s.write(fakeFileS)

  s.emit('error', new Error())
  s.end()
}

if (module == require.main) require('test').run(exports)
