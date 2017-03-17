'use strict';

const program = require('commander');
const connect = require('connect');
const counter = require('./lib/counter');
const proxy = require('./lib/proxy');

program
.version(require('./package.json').version)
.option('-p, --port <n>', 'Server port', parseInt, 8081)
.option('-h, --host <s>', 'Proxy host', 'localhost')
.option('-a, --ads <s>', 'Host of ads JSON file', 'srv.carbonads.net')
.parse(process.argv);

/**
 * Rewrites value of ads JSON
 * @param  {String} key   JSON key
 * @param  {String} value JSON value
 * @return {String}       New value for `key`
 */
function rewrite(key, value) {
	return `//${program.host}/${key === 'fetch' ? 'f' : 'p'}/${proxy.encodeUrl(value)}`;
}

connect()
.use('/ads', counter(req => `http://${program.ads}${req.originalUrl}`, rewrite))
.use('/f', counter(req => proxy.decodeUrl(req.url), rewrite))
.use('/p', proxy())
.listen(program.port);

console.log('Started Carbon Proxy as http://localhost:%d and rewirte URLs to %s', program.port, program.host);
