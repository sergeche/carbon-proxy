'use strict';

const http = require('http');
const parseUrl = require('url').parse;
const debug = require('debug')('carbon-proxy:counter');

const replaceKeys = ['image', 'pixel', 'fetch', 'statlink'];

/**
 * Updates links in ads code
 */
module.exports = function(origin, host) {
	return (req, res, next) => {
		const url = parseUrl(req.url, true);
		const proxyHost = (url.query && url.query._proxy) || host;

		// download original ads code

		const adsUrl = `http://${origin}${req.originalUrl}`;
		const payload = parseUrl(adsUrl);
		payload.headers = Object.assign({}, req.headers, {
			'Accept-Encoding': '',
			Host: origin
		});

		debug('requesting ads %s', adsUrl);
		http.get(payload, res2 => {
			debug('got ads response: %d', res2.statusCode);
			readStream(res2)
			.then(content => {
				debug('replace ads urls with: %s', proxyHost);

				// replace URLs to proxy host in ads code
				content = replaceHost(content.toString().trim(), proxyHost);

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

function replaceHost(json, host) {
	let jsonpStart, jsonpEnd;

	const m = json.match(/^\w+\(/);
	if (m) {
		jsonpStart = m[0];
		jsonpEnd = ')';
		json = json.slice(jsonpStart.length).replace(/\);?$/, '');
	}

	json = JSON.parse(json);
	json.ads = json.ads.map(ad => {
		ad = updateKeys(ad, host);
		if (ad.html) {
			ad.html = JSON.stringify( updateKeys(JSON.parse(ad.html), host) );
		}
		return ad;
	});

	return jsonpStart + JSON.stringify(json) + jsonpEnd;
}

function updateKeys(json, host) {
	return replaceKeys.reduce((json, key) =>
		key in json ? Object.assign({}, json, { [key]: proxyUrl(json[key], host) }) : json,
		json);
}

function proxyUrl(url, host) {
	return `//${host}/p/${Buffer.from(url).toString('base64')}`;
}
