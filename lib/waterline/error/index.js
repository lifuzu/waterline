/**
 * Module dependencies
 */

var util = require('util')
  , _ = require('lodash')
  , ERRORTYPES = require('./types')
  , _isValidationError = require('./isValidationError')
  , _isConstraintViolation = require('./isConstraintViolation')
  , _isAdapterError = require('./isAdapterError');



// Expose WLError constructor
module.exports = WLError;


// TODO:
// This problem could be more cleanly solved by subclassing WLError
// into WLInvalidError, WLConstraintError, WLAdapterError, but that
// can be done in a future refactoring.  The usage can remain consistent
// regardless, so backwards compatiblity is ensured, since users will
// need to ducktype errors using type/code/status properties.



/**
 * WLError
 *
 * A classifier which normalizes a mystery error into a simple,
 * consistent format.  WLError ensures that the instance that is
 * "new"-ed up belongs to one of a handful of distinct categories
 * and has a predictable method signature and properties.
 *
 * @param  {?} err
 * @constructor {WLError}
 */
function WLError(err) {

  // If specified `err` is already a WLError, just return it.
  if (typeof err === 'object' && err instanceof WLError) return err;

  // Save reference to original error.
  this.originalError = err;

  // Logical validation error  (`E_VALIDATION`)
  // 
  // i.e. detected before talking to adapter, like `minLength`
  if ( _isValidationError(this.originalError) ) {
    this.status = ERRORTYPES.E_VALIDATION.status;
    this.code = ERRORTYPES.E_VALIDATION.code;
    this.msg = ERRORTYPES.E_VALIDATION.msg;
    this.invalidAttributes = this.originalError.ValidationError;
  }

  // Constraint validation error  (`E_CONSTRAINT`)
  // 
  // i.e. constraint violation reported by adapter, like `unique`
  else if ( _isConstraintViolation(this.originalError) ) {
    this.status = ERRORTYPES.E_CONSTRAINT.status;
    this.code = ERRORTYPES.E_CONSTRAINT.code;
    this.msg = ERRORTYPES.E_CONSTRAINT.msg;
  }

  // Adapter error  (`E_ADAPTER`)
  // 
  // Miscellaneous physical-layer consistency violation
  // i.e. reported by adapter via `waterline-errors`
  else if ( _isAdapterError(this.originalError) ) {
    this.status = ERRORTYPES.E_ADAPTER.status;
    this.code = ERRORTYPES.E_ADAPTER.code;
    this.msg = ERRORTYPES.E_ADAPTER.msg;

  }

  // Unexpected miscellaneous error  (`E_UNKNOWN`)
  // 
  // (i.e. helmet fire. The database crashed or something. Or there's an adapter
  //  bug. Or a bug in WL core.)
  else {
    this.status = ERRORTYPES.E_UNKNOWN.status;
    this.code = ERRORTYPES.E_UNKNOWN.code;
    this.msg = ERRORTYPES.E_UNKNOWN.msg;
  }

}


/**
 * @return {Object}
 */
WLError.prototype.toJSON = WLError.prototype.toPOJO =
  function toPOJO() {

    // Best case, if we know the type of the original error, provide
    // a sexier toString() message.
    if (this.code !== 'E_UNKNOWN') {
      // TODO: actually write this part
      // return '????';
    }

    // Worst case, try to dress up the original error as much as possible.
    return {
      message: this.msg,
      // TODO: make this better (i.e. not a hard-coded check-- use the inheritance approach discussed in TODO at top of this file and override the toJSON() function for the validation error case)
      details: this.invalidAttributes || this.toString(),
      code: this.code
    };
};


/**
 * @return {String}
 */
WLError.prototype.toString = function () {

    // Best case, if we know the type of the original error, provide
    // a sexier toString() message.
    if (this.code !== 'E_UNKNOWN') {
      // TODO: actually write this part
      // return '????';
    }
    

    // Worst case, try to dress up the original error as much as possible.
    var stringifiedErr;
    if (_.isString(this.originalError)) {
      stringifiedErr = this.originalError;
    }
    // Run toString() on Errors
    else if (_.isObject(this.originalError) && this.originalError instanceof Error && _.isFunction(this.originalError.toString) ) {
      stringifiedErr = this.originalError.toString();
    }
    // But for other objects, use util.inspect()
    else {
      stringifiedErr = util.inspect(this.originalError);
    }
    return stringifiedErr;
};