var dynamodb = require('../src/dynamodb'),
    stream  = require('stream'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    join = require('path').join,
    nock  = require('nock'),
    expect   = require('chai').expect;


describe('swag.dynamodb',function(){
  it('exposes feature migrate', function(){
    expect(dynamodb).to.have.key('migrate');
  });

  describe('.migrate()', function(){
    var fakeFile;
    var tableDefinition = {
      "TableName" : "Articles",
      "KeySchema": [       
        { "AttributeName": "title", "KeyType": "HASH" }
      ],
      "AttributeDefinitions": [       
        { "AttributeName": "title", "AttributeType": "S" }
      ],
      "ProvisionedThroughput": {
        "ReadCapacityUnits": 1, 
        "WriteCapacityUnits": 1
      }
    };
    var awsCall;

    beforeEach(function(){
      var content = new Buffer(JSON.stringify(tableDefinition));
      var empty = new Buffer('');
      fakeFile = new gutil.File({
        path: '/path/to/lambdaFn',
        contents: content
      });

      // awsCall = nock('http://localhost:8000')
      //   .post('/')
      //   .reply(200, {
      //     TableDescription:
      //     { AttributeDefinitions: [ { AttributeName: 'title', AttributeType: 'S' } ],
      //       TableName: 'Articles',
      //       KeySchema: [ { AttributeName: 'title', KeyType: 'HASH' } ],
      //       TableStatus: 'ACTIVE',
      //       CreationDateTime: new Date(),
      //       ProvisionedThroughput:
      //       { LastIncreaseDateTime: new Date(),
      //         LastDecreaseDateTime: new Date(),
      //         NumberOfDecreasesToday: 0,
      //         ReadCapacityUnits: 1,
      //         WriteCapacityUnits: 1 },
      //       TableSizeBytes: 0,
      //       ItemCount: 0,
      //       TableArn: 'arn:aws:dynamodb:ddblocal:000000000000:table/Articles' } 
      //   });
    });

    xit('makes aws api call for createTable',function(done){
      gulp.src('')
        .write(fakeFile)
        .pipe(dynamodb.migrate({}))
        .end();

      expect(awsCall.done()).to.throw(Error);
      done();
    });

    describe('emits an error',function(){
      var recordedError;

      it('when input file is null',function(done){
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
