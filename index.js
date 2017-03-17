'use strict';

const programm = require('commander');
const connect = require('connect');
const counter = require('./lib/counter');
const proxy = require('./lib/proxy');

programm
.version(require('./package.json').version)
.option('-p, --port <n>', 'Server port', parseInt, 8081)
.option('-h, --host <s>', 'Proxy host', 'localhost')
.parse(process.argv);

/**
 * Rewrites value of ads JSON
 * @param  {String} key   JSON key
 * @param  {String} value JSON value
 * @return {String}       New value for `key`
 */
function rewrite(key, value) {
	return `//${programm.host}/${key === 'fetch' ? 'f' : 'p'}/${proxy.encodeUrl(value)}`;
}

connect()
.use('/ads', counter(req => `http://srv.carbonads.net${req.originalUrl}`, rewrite))
.use('/f', counter(req => proxy.decodeUrl(req.url), rewrite))
.use('/p', proxy())
.listen(programm.port);

console.log('Started app http://localhost:%d', programm.port);
