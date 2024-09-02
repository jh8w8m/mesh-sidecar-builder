'use strict';

const Koa = require('koa');
const logger = require('koa-logger')
const koastatic = require('koa-static');
const initMesh = require('../../index');

const port = 3000;
const app = new Koa();

// call before app.listen
initMesh({
    appcode: 'test_consumer',
    enableLocalFileLog: true,
    enableConsoleLog: false,
    meshConfig: [ // message forwarding rules
        {
            host: 'my-test-producer.com',
            targetAppcode: 'test_producer',
            selector: 'prod'
        },
    ],
    interval: 4000,
    increaseInterval: 2000,
    execMode: 'thread',
});
const axiosTest = require('./axios-example');

app
  .use(logger())
  .use(koastatic(__dirname, {
    index: true,
    hidden: false,
    defer: true
  }))
  .use(axiosTest.routes())
  .use(axiosTest.allowedMethods());

app.listen(port, function(){
    console.log('app listening on port ' + port);
});
