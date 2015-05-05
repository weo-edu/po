Po is simplified version of [Vo](https://github.com/lapwinglabs/po) that has a promise centric api.

## Features

- Composable parallel and series flows.
- Super simple

## Installation

```
$ npm install po
```

## Usage

### Basic

```js
var request = require('superagent-promise');
var po = require('po');

po(function(url) {
  return request('get', url).end();
})('http://weo.io').then(function() {
  //...
});

```

### Pipeline

```js
var request = require('superagent-promise');
var po = require('po');
var db = {};

function get(url) {
  return request('get', url).end();
}

function cache(res) {
  return db.set(res.url, res.body);
}

po(get, cache)('http://weo.io').then(function() {
  //...
});

```

### Parallel

```js
var request = require('superagent-promise');
var po = require('po');

function get(url) {
  return request('get', url).end();
}

po([
  get('https://weo.io'),
  get('https://google.com)
])().then(function(responses) {
  //...
});
```

### Parallel Object

```js
var request = require('superagent-promise');
var po = require('po');

function get(url) {
  return request('get', url).end();
}

po({
  weo: get('https://weo.io'),
  google: get('https://google.com)
})().then(function(responses) {
  // `responses` is object
});
```

### Composition

```js
var request = require('superagent-promise');
var cheerio = require('cheerio');
var po = require('po');

function get(url, fn) {
  return request.get(url).end();
}

function title(res) {
  var $ = cheerio.load(res.text);
  return $('title').text();
}

var req = po(get, title);

po({
  weo: req('http://weo.io'),
  google: req('http://google.com')
})(function(err, res) {
  // `res` is an object containing each title
})
```

