const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

exports.cors = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		// Grab URL from URI or Req. Body:
		let url = !req.query.url ? req.body.url : req.query.url;
		if (!url) res.status(403).send('URL is empty.');
		// Add queries back to url:
		Object.keys(req.query).forEach(query => {
			if (query === 'url') return; // Skip url query. Already added as base
			// If control reaches this point, query is not url, add to request uri
			url += `&${query}=${decodeURI(req.query[query])}`;
		});
		// Define source request headers to retain in transmit request.
		const headersKeep = [
			'accept-encoding',
			'content-type',
			'accept-language',
			'authorization'
		];
		// Iterate through headers and transfer kept keys to new header object.
		const headers = Object.keys(req.headers)
			.filter(key => headersKeep.includes(key))
			.reduce((obj, key) => {
				obj[key] = req.headers[key];
				return obj;
			}, {});
		// Send Interpreted Request to intended endpoint:
		return fetch(url, {
			method: req.method,
			body:
				req.get('content-type') === 'application/json'
					? JSON.stringify(req.body)
					: req.body,
			headers
		}).then(r => {
			r.body.on('data', chunk => {
				res.write(chunk);
			});
			return new Promise(resolve => {
				r.body.on('end', () => {
					resolve(res.end(null));
				});
			});
		});
	});
});
