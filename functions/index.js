const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

// Define whitelisted hostnames here to prevent abuse. Use '*'
// to whitelist all hostnames (not recommended):
const origin_whitelist = ['127.0.0.1', 'localhost:5000'];
const endpoint_whitelist = ['google.com'];

exports.cors = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Grab URL from URI or Req. Body:
    let url = !req.query.url ? req.body.url : req.query.url;
    if (!url) {
      res.status(403).send('Endpoint URL not specified.');
      return;
    }

    // Validate request origin and destination endpoints with whitelist:
    const regexHostname = /(?:http(?:s)?:\/\/)?(((\S+)(?:.(com|net|edu|org|app)|:\d+)))/;
    const reqOrigin = (req.headers.origin || req.headers.host).match(
      regexHostname
    )[1];
    const reqDest = url.match(regexHostname)[1];
    console.log(reqOrigin, reqDest);
    if (
      (!endpoint_whitelist.includes('*') &&
        !endpoint_whitelist.includes(reqDest)) ||
      (!origin_whitelist.includes('*') && !origin_whitelist.includes(reqOrigin))
    ) {
      // Send 403: Forbidden if endpoint or host are not in whitelists:
      res.status(403).send('Forbidden.');
      return;
    }

    // Add queries back to url:
    Object.keys(req.query).forEach(query => {
      if (query === 'url') return; // Skip url query. Already added as base
      // If control reaches this point, query is not url, add to request uri
      url += `&${query}=${decodeURI(req.query[query])}`;
    });

    // Define source request headers to retain in transmit request.
    const headersKeep = [
      'accept-encoding',
      'accept-language',
      'authorization',
      'content-security-policy',
      'content-type',
      'referrer-policy',
      'x-frame-options'
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
