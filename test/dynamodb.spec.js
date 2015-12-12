var dynamodb = require('../src/dynamodb'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    join = require('path').join,
    expect   = require('chai').expect;

function randomStr(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

describe('swag.dynamodb',function(){
  it('exposes feature migrate', function(){
    expect(dynamodb).to.have.key('migrate');
  });

  describe('.migrate()', function(){

    xit('creates table',function(done){
      var stream = gulp.src('./test/fixtures/tableDefinition.json');
      stream.on('created', function(data){
        console.log('calling donne :::', data)
        done();
      });

      stream
        .pipe(dynamodb.migrate({
          DynamoDB: {
            apiVersion: '2012-08-10',
            region   : 'us-west-2',
            endpoint : 'http://localhost:8000'
          },
          tableNamespace: randomStr(4) + '_'
        }));

    });

    describe('emits an error',function(){
      var recordedError;

      xit('when input file is null',function(done){
        gulp.src(join(__dirname,'./fixtures/empty.json'))
          .pipe(dynamodb.migrate({
            DynamoDB: {
              apiVersion: '2012-08-10',
              region   : 'us-west-2',
              endpoint : 'http://localhost:8000'
            },
            tableNamespace: 'test_'
          }))
          .on('error', function(error){
            expect(error).to.be.instanceof(gutil.PluginError);
            done();
          });
      });

      xit('when file is null',function(done){
        var originalException = process.listeners('uncaughtException').pop(),
            fakeFile = new gutil.File({
              contents: null
            });

        process.removeListener('uncaughtException', originalException);
        process.once("uncaughtException", function (error) {
          recordedError = error;
        });

        gulp.src('').
          pipe(dynamodb.migrate({})).
          write(fakeFile).
          end();

        process.nextTick(function () {
          process.listeners('uncaughtException').push(originalException);
          expect(recordedError).to.be.an.instanceof(gutil.PluginError);
          done();
        });
      });

    });

  });
});
