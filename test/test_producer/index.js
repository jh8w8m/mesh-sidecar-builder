'use strict';

const Koa = require('koa');
const logger = require('koa-logger')
const koastatic = require('koa-static');
const initMesh = require('../../index');

const port = 3000;
const app = new Koa();

// call before app.listen
initMesh({
    appcode: 'test_producer',
    enableLocalFileLog: true,
    enableConsoleLog: false,
    interval: 1000,
    increaseInterval: 2000,
    execMode: 'thread',
});
const providerTest = require('./provider-example');

app
  .use(logger())
  .use(koastatic(__dirname, {
    index: true,
    hidden: false,
    defer: true
  }))
  .use(providerTest.routes())
  .use(providerTest.allowedMethods());

app.listen(port, function(){
    console.log('app listening on port ' + port);
});
