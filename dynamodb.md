# Running DynamoDB on Your Computer

[Follow instructions](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Tools.DynamoDBLocal.html)


## Working with Tables in DynamoDB
More information [here](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithTables.html).

Example createArticlesTable.json
```js
{
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
}
```

In your gulpfile.js:
```js
var swag = require('gulp-swag'),
    db   = swag.db
    i    = swag.utils.interpolate

gulp.task('db:migrate', function(){
  return gulp.src('./db/definitions/*.json')
    .pipe(db.migrate({
      config: i('./env/{NODE_ENV}/config.json')
    }));
});
```