'use strict';

var utils  = require('../src/utils'),
    expect = require('chai').expect;

describe('gulp-swag utils', function(){

  describe('env()', function(){
    it('retuns the env variable set in NODE_ENV', function(){
      process.env.NODE_ENV = 'test';
      expect(utils.env()).to.equal('test');
    });

    it('defaults to \"dev\" when NODE_ENV not set', function(){
      delete process.env.NODE_ENV
      expect(utils.env()).to.equal('dev');
    });
  });

  describe('interpolate()', function(){
    it('replaces {NODE_ENV} with env() value', function(){
      var str = utils.interpolate('./env/{NODE_ENV}/file.json');
      expect(str).to.equal('./env/dev/file.json');
    });
  });
});

