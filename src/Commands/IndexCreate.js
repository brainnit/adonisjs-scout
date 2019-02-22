'use strict'

const { ioc } = require('@adonisjs/fold')
const ace = require('@adonisjs/ace')
const prettyHrTime = require('pretty-hrtime')
const { size, keys } = require('lodash')
const BaseIndex = require('./BaseIndex')

class IndexCreate extends BaseIndex {
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
   * Command signature required by ace
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature () {
    return `
    scout:indexCreate
    { -i, --importAll: Import all models to index after creating it }
    { --files=@value: Run only selected files }
    `
  }

  /**
   * Command description
   *
   * @method description
   *
   * @return {String}
   */
  static get description () {
    return 'Create specific Scout engine index.'
  }

  /**
   * Method called when command is executed. This method will require
   * the given IndexKeeper and execute its `up` method.
   *
   * @method handle
   *
   * @param  {Object} args
   *
   * @return {void|Array}
   */
  async handle (args, { importAll, files }) {
    try {
      const startTime = process.hrtime()

      files = typeof (files) === 'string' ? files.split(',') : null
      const allFiles = this.getIndexKeeperFiles(files)

      if (!size(allFiles)) {
        return this.viaAce ? this.warn(`Nothing to do`) : `Nothing to do`
      }

      for (const file of keys(allFiles)) {
        let keeperInstance = ioc.make(allFiles[file])
        if (typeof (keeperInstance.up) === 'function') {
          await keeperInstance.up()
        } else {
          this.warn(`${keeperInstance.constructor.name} does not have a run method`)
        }
      }

      /**
       * If importAll is passed, import all models into index
       */
      if (importAll) {
        await ace.call('scout:import')
      }

      const endTime = process.hrtime(startTime)
      this.success(`Executed in ${prettyHrTime(endTime)}`)
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  }
}

module.exports = IndexCreate
