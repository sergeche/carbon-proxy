'use strict';

const http = require('http');
const parseUrl = require('url').parse;
const debug = require('debug')('carbon-proxy:proxy');

/**
 * Proxies encoded request
 */
module.exports = function() {
	return (req, res, next) => {
		const url = Buffer.from(req.url.replace(/^\/+/, '').split('/')[0], 'base64').toString();
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
}
