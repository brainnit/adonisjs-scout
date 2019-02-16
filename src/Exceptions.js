'use strict'

const GE = require('@adonisjs/generic-exceptions')

class RuntimeException extends GE.RuntimeException {
  static get repo () {
    return '@brainnit/adonisjs-scout'
  }

  /**
   * This exception is raised when user is trying to use an
   * undefined search engine connection
   *
   * @method missingEngineConfig
   *
   * @param {String} name
   *
   * @return {Object}
   */
  static missingConfig (name) {
    return new this(
      `${name} is not defined inside config/scout.js file`,
      500,
      'E_MISSING_CONFIG',
      this.repo
    )
  }
}

class InvalidArgumentException extends GE.InvalidArgumentException {
  static get repo () {
    return '@brainnit/adonisjs-scout'
  }

  static invalidParameter (message) {
    return new this(message, 500, 'E_INVALID_PARAMETER', this.repo)
  }

  static invalidDriver (name) {
    return new this(
      `${name} is not a valid search engine driver`,
      500,
      'E_INVALID_DRIVER',
      this.repo
    )
  }
}

class LogicalException extends GE.LogicalException {
  static get repo () {
    return '@brainnit/adonisjs-scout'
  }

  static notImplementedMethod (name) {
    return new this(
      `Class did not implement method ${name}`,
      500,
      'E_METHOD_NOT_IMPLEMENTED',
      this.repo
    )
  }

  static ruleNotSupported (rule) {
    return new this(
      `Model does not support searchable rule ${rule}`,
      500,
      'E_UNSUPPORTED_SEARCHABLE_RULE',
      this.repo
    )
  }
}

module.exports = {
  RuntimeException,
  InvalidArgumentException,
  LogicalException
}
