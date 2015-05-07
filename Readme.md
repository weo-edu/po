[ ![Codeship Status for weo-edu/po](https://codeship.com/projects/aacf3bb0-d594-0132-a9ce-26dfd4cc1a97/status?branch=master)](https://codeship.com/projects/78124)

Po is simplified version of [Vo](https://github.com/lapwinglabs/po) that has a promise centric api.

## Features

- Composable parallel and series flows.
- Super simple

## Installation

```
$ npm install po
```

## Usage

### Punk

A punk is po's atom. It's a function that returns a promise. Po takes punks as args and returns a punk. Punks that do not initiate a pipeline must only take one arg.

```js

function punk(arg) {
  return Promise.resolve(arg);
}
```

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
var db = require('ioredis');

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
  get('https://google.com')
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
  google: get('https://google.com')
})().then(function(responses) {
  // `responses` is object
});
```

### Composition

```js
var request = require('superagent-promise');
var cheerio = require('cheerio');
var po = require('po');

function get(url) {
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
})().then(function(res) {
  // `res` is an object containing each title
})
```

### Currying

Po returns an auto currying punk. The arity of a po instance is defined by the arity of the first punk in the pipeline. The po pipeline is not actually executed until sufficient args are passed. 

In the example below `req` has an arity of 2, and `weoGoogle` has an arity of 1. 

```js
var request = require('superagent-promise');
var cheerio = require('cheerio');
var po = require('po');

function get(url, data) {
  return request.get(url, data).end();
}

function title(res) {
  var $ = cheerio.load(res.body);
  return $('title').text();
}

var req = po(get, title);

var weoGoole = po({
  weo: req('http://weo.io'),
  google: req('http://google.com')
});

weoGoole({limit: 10}).then(function(res) {
  // `res` is an object containing the text of 10 titles for each site
})
```

