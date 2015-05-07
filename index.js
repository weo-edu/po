/**
 * Modules
 */

var Promise = require('native-promise-only');
var foreach = require('foreach');
var sliced = require('sliced');
var isArray = Array.isArray;
var keys = Object.keys;


/**
 * Expose Po.
 */

module.exports = Po;

/**
 * Punk
 *
 * A function that returns a promise.
 */


/**
 * Initialize a `Po` instance
 * 
 * @param {Array|Object|Function|Punk, ...}
 * @return {Punk}
 */

function Po(arityPunk) {
  var pipeline = sliced(arguments).map(resolve);
  var arity = getArity(arityPunk);

  if (!pipeline.length)
    throw new Error('At least one argument required');

  function generator(args) {
    function po() {
      var lArgs = args.concat(sliced(arguments))
      if (lArgs.length >= arity)
        return series(pipeline, lArgs);
      else
        return generator(lArgs);
    }
    po.length = arity - args.length;
    return po;
  }
  
  return generator([]);
}


/**
 * Get arity of `v`
 * 
 * @param  {Mixed} v
 * @return {Number}
 */

function getArity(v) {
  var t = type(v);

  switch(t) {
    case 'function':
      return v.length;
    case 'array':
      return getArity(v[0]);
    case 'object':
      return getArity(v[keys(v)[0]]);
    case 'string':
      return parseInt(v);
    default:
      return v;
  }
}

/**
 * Resolve pipeline arg into a punk
 * 
 * @param  {Mixed} v 
 * @return {Punk}
 */

function resolve(v) {
  var t = type(v);

  if (t === 'object' || t === 'array')
    return parallel(v);
  else
    return v;

}

/**
 * Run punks in series, passing `args` to first punk
 * 
 * @param  {Array} pipeline 
 * @param  {Array} args
 * @return {Promise}
 */

function series(pipeline, args) {
  var i = 0;
  return new Promise(function(resolve, reject) {
    function next(prev) {
      var args = sliced(arguments);
      var fn = pipeline[i++];
      if (!fn) return resolve(prev);
      Promise.resolve(fn.apply(null, args)).then(next).catch(reject);
    }
    next.apply(null, args);
  });
}

/**
 * Resolve an object composed of values, promises, and punks.
 * 
 * @param  {Object|Array} obj
 * @return {Punk}
 */

function parallel(obj) {
  return function() {
    var args = sliced(arguments);
    return new Promise(function(resolve, reject) {
      var a  = [];
      foreach(obj, function(v, k) {
        var t = type(v);

        var fn = null;
        switch(t) {
          case 'function':
            fn = v;
            break;
          case 'array':
            fn = parallel(v);
            break;
          case 'object':
            if (!v.then) {
              fn = parallel(v);
              break;
            }
            // add thenable to all
          default:
            fn = function() {return v};
        }
        a.push(fn.apply(null, args));
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

/**
 * Checks if `v` is undefined
 * @param  {Mixed}  v
 * @return {Boolean}
 */

function isUndefined(v) {
  return v === undefined;
}
