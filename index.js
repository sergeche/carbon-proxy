'use strict';

const connect = require('connect');
const counter = require('./lib/counter');
const proxy = require('./lib/proxy');

const port = 8081;

connect()
.use('/ads', counter('srv.carbonads.net', 'sup.emmet.io'))
.use('/p', proxy())
.listen(port);

console.log('Started app http://localhost:', port);
