'use strict'

const { ioc } = require('@adonisjs/fold')
const prettyHrTime = require('pretty-hrtime')
const { size, keys } = require('lodash')
const BaseIndex = require('./BaseIndex')

class IndexDown extends BaseIndex {
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
    scout:down
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
    return 'Delete all/specific Scout engine indexes.'
  }

  /**
   * Method called when command is executed. This method will require
   * the given IndexKeeper and execute its `down` method.
   *
   * @method handle
   *
   * @param  {Object} args
   *
   * @return {void|Array}
   */
  async handle (args, { files }) {
    try {
      const startTime = process.hrtime()

      files = typeof (files) === 'string' ? files.split(',') : null
      const allFiles = this.getIndexKeeperFiles(files)

      if (!size(allFiles)) {
        return this.viaAce ? this.warn(`Nothing to do`) : `Nothing to do`
      }

      for (const file of keys(allFiles)) {
        let keeperInstance = ioc.make(allFiles[file])
        if (typeof (keeperInstance.down) === 'function') {
          await keeperInstance.down()
          this.success(`Finished executing ${keeperInstance.constructor.name}.`)
        } else {
          this.warn(`${keeperInstance.constructor.name} does not have a run method`)
        }
      }

      const endTime = process.hrtime(startTime)
      this.success(`Scout indexes removed in ${prettyHrTime(endTime)}`)
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  }
}

module.exports = IndexDown
