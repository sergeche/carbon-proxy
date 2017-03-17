'use strict';

const http = require('http');
const parseUrl = require('url').parse;
const debug = require('debug')('carbon-proxy:proxy');

/**
 * Proxies encoded request
 */
module.exports = function() {
	return (req, res, next) => {
		const url = decodeUrl(req.url);
		debug('requested %s -> %s', req.url, url);

		const payload = parseUrl(url, false, true);
		payload.headers = Object.assign({}, req.headers, { Host: payload.hostname });

		http.get(payload, res2 => {
			debug('got response: %d', res2.statusCode);

			res.writeHead(res2.statusCode, res2.headers);
			res2.pipe(res);
		})
		.on('error', next);
	};
};

/**
 * Returns URL encoded in requested URL
 * @param {String} url
 * @type {String}
 */
const decodeUrl = module.exports.decodeUrl = function(url) {
	return Buffer.from(url.replace(/^\/+/, '').split('/')[0], 'base64').toString();
};

/**
 * Encodes URL for proxying
 * @param {String} url
 * @type {String}
 */
const encodeUrl = module.exports.encodeUrl = function(url) {
	return Buffer.from(url).toString('base64');
};
