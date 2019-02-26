'use strict'

const { ioc } = require('@adonisjs/fold')
const { Command } = require('@adonisjs/ace')
const prettyHrTime = require('pretty-hrtime')

class Flush extends Command {
  constructor (Database, Event) {
    super()
    this.Database = Database
    this.Event = Event
  }

  /**
   * IoC container injections
   *
   * @method inject
   *
   * @return {Array}
   */
  static get inject () {
    return ['Adonis/Src/Database', 'Adonis/Src/Event']
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
    scout:flush { model : Model to flush from index }
    { -f, --force: Forcefully run flush in production }
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
    return 'Flushes the given model from the search index'
  }

  /**
   * Method called when command is executed. This method will
   * sync all models to index after creating it.
   *
   * @method handle
   *
   * @param  {Object} args
   *
   * @return {void|Array}
   */
  async handle ({ model }, { force }) {
    try {
      const startTime = process.hrtime()

      if (process.env.NODE_ENV === 'production' && !force) {
        throw new Error(
          'Cannot run flush in production. Use --force flag to continue'
        )
      }

      if (!model) {
        return this.viaAce ? this.warn(`Nothing to do`) : `Nothing to do`
      }

      const Model = ioc.use(`App/Models/${model}`)

      await Model.makeAllUnsearchable()

      const endTime = process.hrtime(startTime)
      this.success(
        `All ${Model.name} models were flushed in ${prettyHrTime(endTime)}`
      )
    } catch (error) {
      this.error(error)
      process.exit(1)
    }
  }
}

module.exports = Flush
