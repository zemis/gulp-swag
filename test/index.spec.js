var gwada  = require('../index'),
    expect = require('chai').expect;

describe('gulp-gwada', function(){
  it('exposes feature dynamodb', function(){
    expect(gwada).to.have.property('dynamodb');
  });

  it('exposes feature lambda', function(){
    expect(gwada).to.have.property('lambda');
  });

  it('exposes feature apigateway', function(){
    expect(gwada).to.have.property('apigateway');
  });  
});
