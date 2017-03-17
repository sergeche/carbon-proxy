'use strict';

const connect = require('connect');
const counter = require('./lib/counter');
const proxy = require('./lib/proxy');

const port = 8081;
const proxyHost = 'sup.emmet.io';

/**
 * Rewrites value of ads JSON
 * @param  {String} key   JSON key
 * @param  {String} value JSON value
 * @return {String}       New value for `key`
 */
function rewrite(key, value) {
	return `//${proxyHost}/${key === 'fetch' ? 'f' : 'p'}/${proxy.encodeUrl(value)}`;
}

connect()
.use('/ads', counter(req => `http://srv.carbonads.net${req.originalUrl}`, rewrite))
.use('/f', counter(req => proxy.decodeUrl(req.url), rewrite))
.use('/p', proxy())
.listen(port);

console.log('Started app http://localhost:', port);
