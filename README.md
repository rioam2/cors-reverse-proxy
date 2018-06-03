# cors-reverse-proxy-firebase-cloud-functions

## The Problem: 
```
No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin '*' is therefore not allowed access. The response had HTTP status code 502. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```
ES6's new fetch API is great, but it will not allow you to fetch (GET/etc) any data from a server that does not explicitly white-list your origin (hostname, port...). This can be incredibly prohibitive for implimenting 3rd party API's into your web application.

## The Solution:

Create a proxy with firebase's cloud functions backend for intercepting your requests and forwarding their responses. Since cloud functions do not run within the browser, they do not have CORS limitations. The response from your proxy will then be injected with the appropriate CORS-resource headers, so that you can receive the result.

Request composition for use within your application:

`[Your Cloud Function URL]/cors?url=[Your Intended Fetch URL]`
