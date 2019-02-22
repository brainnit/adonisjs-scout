'use strict'

const path = require('path')
const requireAll = require('require-all')
const { Command } = require('@adonisjs/ace')
const { find } = require('lodash')

class BaseIndex extends Command {
  constructor (Helpers, Scout) {
    super()
    this._appRoot = Helpers.appRoot()
    this.scout = Scout
  }

  /**
   * IoC container injections
   *
   * @method inject
   *
   * @return {Array}
   */
  static get inject () {
    return ['Adonis/Src/Helpers', 'Adonis/Addons/Scout']
  }

  /**
   * Returns path to the index keepers directory or a
   * specific file to the index keepers directory.
   *
   * @method getIndexKeepers
   *
   * @param {Object} selectedFiles
   *
   * @return {String}
   */
  getIndexKeeperFiles (selectedFiles) {
    return requireAll({
      dirname: path.join(this._appRoot, '/app/Models/IndexKeepers'),
      filter: (fileName) => {
        if (!selectedFiles && fileName.match(/(.*)\.js$/)) {
          return fileName
        }
        return find(selectedFiles, (file) => file.trim().endsWith(fileName))
      }
    })
  }

  /**
   * Throws exception when trying to run migrations are
   * executed in production and not using force flag.
   *
   * @method _validateState
   *
   * @param  {Boolean}       force
   *
   * @return {void}
   *
   * @private
   *
   * @throws {Error} If NODE_ENV is production
   */
  _validateState (force) {
    if (process.env.NODE_ENV === 'production' && !force) {
      throw new Error('Cannot run index keepers in production. Use --force flag to continue')
    }
  }

  /**
   * Executes the function when conditional
   * is false
   *
   * @method execIfNot
   *
   * @param {Boolean} conditional
   * @param {Function} fn
   */
  execIfNot (conditional, fn) {
    if (!conditional) {
      fn()
    }
  }
}

module.exports = BaseIndex
