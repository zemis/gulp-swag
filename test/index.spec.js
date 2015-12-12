'use strict';

var swag  = require('../index'),
    expect = require('chai').expect;

describe('gulp-swag', function(){

  ['apigateway', 'dynamodb', 'lambda', 'utils']
    .forEach(function(fn){
      it('exposes feature '+fn, function(){
        expect(swag).to.have.property(fn);
      });
    });

});
