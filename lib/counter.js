'use strict';

const http = require('http');
const parseUrl = require('url').parse;
const debug = require('debug')('carbon-proxy:counter');
const transport = require('./transport');

const replaceKeys = ['image', 'pixel', 'fetch', 'statlink', 'statimp'];

/**
 * Updates links in ads code
 */
module.exports = function(createUrl, jsonRewrite) {
	return (req, res, next) => {
		const url = createUrl(req);
		const payload = parseUrl(url, false, true);
		payload.headers = Object.assign({}, req.headers, {
			'Accept-Encoding': '',
			Host: payload.hostname
		});

		debug('requesting ads %s', url);
		transport(payload).get(payload, res2 => {
			debug('got ads response status: %d', res2.statusCode);

			readStream(res2)
			.then(content => {
				debug('replace urls in ads json');

				// replace URLs to proxy host in ads code
				content = rewriteAdsJSON(content.toString().trim(), jsonRewrite);

				debug('writing response');
				res.writeHead(res2.statusCode, Object.assign({}, res2.headers, {
					'content-length': Buffer.byteLength(content)
				}));
				res.end(content);
			})
			.catch(next);
		})
		.on('error', next);
	};
}

/**
 * Reads data from given stream
 * @param  {stream.Readble} stream
 * @return {Promise}
 */
function readStream(stream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		const onData = chunk => chunks.push(chunk);
		const onEnd = () => {
			cleanUp();
			resolve(Buffer.concat(chunks));
		};
		const onError = err => {
			cleanUp();
			reject(err);
		};
		const cleanUp = () => {
			stream.removeListener('end', onEnd);
			stream.removeListener('data', onData);
			stream.removeListener('error', onError);
		};

		stream.on('data', onData);
		stream.on('end', onEnd);
		stream.on('error', onError);
	});
}

function rewriteAdsJSON(json, rewrite) {
	let jsonpStart, jsonpEnd;

	const m = json.match(/^\w+\(/);
	if (m) {
		jsonpStart = m[0];
		jsonpEnd = ')';
		json = json.slice(jsonpStart.length).replace(/\);?$/, '');
	}

	json = JSON.parse(json);
	json.ads = json.ads.map(ad => {
		ad = updateKeys(ad, rewrite);
		if (ad.html) {
			ad.html = JSON.stringify( updateKeys(JSON.parse(ad.html), rewrite) );
		}
		return ad;
	});

	return jsonpStart + JSON.stringify(json) + jsonpEnd;
}

function updateKeys(json, rewrite) {
	return replaceKeys.reduce((json, key) =>
		key in json ? Object.assign({}, json, { [key]: rewrite(key, json[key]) }) : json,
		json);
}
