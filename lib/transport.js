'use strict';

const http = require('http');
const https = require('https');
const parseUrl = require('url').parse;

module.exports = function(url) {
	if (typeof url === 'string') {
		url = parseUrl(url, false, true);
	}

	return url.protocol === 'https:' ? https : http;
};
