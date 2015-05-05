/**
 * Module Dependencies
 */

var Promise = require('es6-promise').Promise;
var assert = require('assert');
var Po = require('..');

/**
 * Tests
 */

describe('sync functions: po(fn)', function() {
  it('should work with synchronous functions', function(done) {
    function sync(a) {
      assert.equal(a, 'a');
      return a;
    }

    Po(sync)('a').then(function(v) {
      assert.equal(v, 'a');
      done();
    }).catch(done);
  })

  it('should catch thrown errors', function(done) {
    function sync(a) {
      assert.equal(a, 'a');
      throw new Error('some error');
      return a + b;
    }

    Po(sync)('a').catch(function(err) {
      assert.equal('some error', err.message);
      done();
    })
  })
});

describe('promises: po(promise)', function() {
  it('should work with asynchronous functions', function(done) {
    function async(a) {
      return promise_timeout(1, a);
    }

    Po(async)('a').then(function(v) {
      assert.equal(v, 'a');
      done();
    }).catch(done);
  });

  it('should handle errors', function(done) {
    function async(a,fn) {
      assert.equal(a, 'a');
      return promise_timeout(1, new Error('some error'));
    }

    Po(async)('a').catch(function(err) {
      assert.equal('some error', err.message);
      done();
    })
  })
});


// TODO: add generator support
/*
describe('generators: po(*fn)', function() {
  it('should work with generators', function(done) {
    function *gen(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      return yield timeout(50);
    }

    Po(gen)('a', 'b', function(err, v) {
      if (err) return done(err);
      assert.equal(v, 50);
      done();
    });
  })

  it('should catch thrown errors', function() {
    function *gen(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      throw new Error('some error');
      return a + b;
    }

    Po(gen)('a', 'b', function(err, v) {
      assert.equal('some error', err.message);
      assert.equal(undefined, v);
      done();
    });
  })
});*/

describe('series: po(fn, ...)', function() {
  it('should run in series', function(done) {
    var o = [];

    function a(a) {
      o.push('a');
      assert.equal('a', a);
      return 'a';
    }

    function b(a) {
      o.push('b');
      assert.equal('a', a);
      return promise_timeout(1, 'b1');
    }

    function c(a) {
      assert.equal('b1', a);
      o.push('c');
      return promise_timeout(1, 'c');
    }

    Po(a, b, c)('a').then(function(v) {
      assert.deepEqual(['a', 'b', 'c'], o);
      assert.equal('c', v);
      done();
    });
  })

  it('should handle errors', function(done) {
    var o = [];

    function a(a, b) {
      o.push('a');
      assert.equal('a', a);
      return 'a';
    }

    function b(a) {
      o.push('b');
      assert.equal('a', a);
      return promise_timeout(1, 'b1');
    }

    function c(a) {
      o.push('c');
      assert.equal(a, 'b1');
      return promise_timeout(null, 'c');
    }

    function d() {
      o.push('d');
    }


    Po(a, b, c, d)('a').catch(function(err) {
      assert.equal('no ms present', err.message);
      assert.deepEqual(['a', 'b', 'c'], o);
      done();
    })
  })
});


describe('arrays: po([...])', function() {
  function to(ms, arr) {
    return function() {
      return promise_timeout(ms).then(function(v) {
        arr.push(v);
        return ms;
      });
    }
  }

  it('should run an array of functions in parallel', function(done) {
    var o = [];

    Po([to(50, o), to(150, o), to(100, o)])().then(function(v) {
      assert.deepEqual([50, 150, 100], v);
      assert.deepEqual([50, 100, 150], o);
      done();
    }).catch(done);

  })

  it('should handle errors', function(done) {
    var o = [];

    Po([to(50, o), to(0, o), to(100, o)])().catch(function(err) {
      assert.equal('no ms present', err.message);
      done();
    });
  });
});


describe('objects: po({...})', function() {
  function to(ms, arr) {
    return function() {
      return promise_timeout(ms).then(function(v) {
        arr.push(v);
        return ms;
      });
    }
  }

  it('should run an object of functions in parallel', function(done) {
    var o = [];

    Po({ a: to(50, o), b: to(150, o), c: to(100, o) })().then(function(v) {
      assert.deepEqual(v, {
        a: 50,
        b: 150,
        c: 100
      });

      assert.deepEqual([50, 100, 150], o);
      done();
    });
  })

  it('should catch any errors', function(done) {
    var o = [];

    Po({ a: to(50, o), b: to(150, o), c: to(0, o) })().catch(function(err) {
      assert.equal('no ms present', err.message);
      done();
    })
  })
});


describe('composition: po(po(...), [po(...), po(...)])', function() {

  it('should support series composition', function(done) {
    var o = [];

    function a(a) {
      o.push(a);
      return 'b';
    }

    function b(a) {
      o.push(a);
      return promise_timeout(50, 'c');
    }

    Po(Po(a, b), a, b)('a').then(function(v) {
      assert.equal('c', v);
      assert.deepEqual(['a', 'b', 'c', 'b'], o);
      done();
    });


  });

  it('should support async composition', function(done) {
    function to(ms, arr) {
      return function() {
        return promise_timeout(ms).then(function(v) {
          arr.push(v);
          return v;
        });
      }
    }

    var o = [];
    var a = Po([to(50, o), to(150, o)]);
    var b = Po([to(100, o), to(200, o)]);

    Po([a, b])().then(function(v) {
      assert.deepEqual([[50, 150], [100, 200]], v);
      assert.deepEqual([50, 100, 150, 200], o);
      done();
    });
  })

  it('should support async composition with objects', function(done) {
    function to(ms, arr) {
      return function() {
        return promise_timeout(ms).then(function(v) {
          arr.push(v);
          return v;
        });
      }
    }

    var o = [];
    var a = Po({ a1: to(50, o), a2: to(150, o) });
    var b = Po({ b1: to(100, o), b2: to(200, o) });

    Po({ c1: a, c2: b })().then(function(v) {
      assert.deepEqual(v, {
        c1: {
          a1: 50,
          a2: 150
        },
        c2: {
          b1: 100,
          b2: 200
        }
      });
      assert.deepEqual([50, 100, 150, 200], o);

      done();
    });
  });

  it('should propagate errors', function(done) {
    function to(ms, arr) {
      return function() {
        return promise_timeout(ms).then(function(v) {
          arr.push(v);
          return v;
        });
      }
    }

    var o = [];
    var a = Po({ a1: to(50, o), a2: to(0, o) });
    var b = Po({ b1: to(100, o), b2: to(200, o) });

    Po({ c1: a, c2: b })().catch(function(err) {
      assert.equal('no ms present', err.message);
      done();
    });
  });
})

/**
 * Promise timeout
 *
 * @param {Number} ms
 * @param {Promise}
 */

function promise_timeout(ms, arg) {
  return new Promise(function(resolve, reject) {
    // error
    if (!ms) {
      setTimeout(function() {
        reject(new Error('no ms present'))
      }, 0)
    }

    setTimeout(function() {
      if (arg instanceof Error)
        reject(arg);
      else
        resolve(arg || ms);
    }, ms);
  });
}

