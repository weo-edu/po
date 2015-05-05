/**
 * Modules
 */

var Promise = require('es6-promise').Promise;
var foreach = require('foreach');
var sliced = require('sliced');
var isArray = Array.isArray;
var keys = Object.keys;


/**
 * Expose Po.
 */

module.exports = Po;


/**
 * Initialize a `Pop` instance
 * 
 */


function Po() {
  var pipeline = sliced(arguments).map(resolve);

  function po(arg) {
    return {
      then: function(resolve, reject) {
        return series(pipeline, arg).then(resolve, reject);
      },
      catch: function(reject) {
        return series(pipeline, arg).catch(reject);
      }
    };
  }

  return po;
}


function promisify(fn, pipeline, arg) {
  
}


function resolve(v) {
  var t = type(v);

  switch(t) {
    case 'object':
    case 'array':
      return parallel(v);
    default:
     return v;
  }
}

function series(pipeline, arg) {
  var i = 0;
  return new Promise(function(resolve, reject) {
    function next(prev) {
      var fn = pipeline[i++];
      if (!fn) return resolve(prev);
      Promise.resolve(fn(prev)).then(next).catch(reject);
    }
    next(arg);
  });
}

/**
 * Resolve an object/array recursively (sync)
 *
 * @param {Object|Array} obj
 * @return {Function}
 */

function parallel(obj) {
  return function(arg) {
    return new Promise(function(resolve, reject) {
      var a  = [];
      foreach(obj, function(v, k) {
        var t = type(v);

        switch(t) {
          case 'function':
            a.push(v(arg));
            break;
          case 'array':
          case 'object':
            a.push(parallel(v, arg));
            break;
          default:
            a.push(v);
        }
      });

      Promise.all(a).then(function(val) {
        if (isArray(obj)) {
          return resolve(val);
        }

        var i = 0;
        var out = {};
        foreach(obj, function(v, k) {
          out[k] = val[i++];
        });
        resolve(out);
      }, reject);

    });
  }
}



/**
 * Get the type
 *
 * @param {Mixed} v
 * @return {String}
 */

function type(v) {
  return isArray(v) 
    ? 'array'
    : typeof v;
}

function isUndefined(v) {
  return v === undefined;
}
