'use strict'

const { ioc } = require('@adonisjs/fold')
const { Command } = require('@adonisjs/ace')
const prettyHrTime = require('pretty-hrtime')

class Import extends Command {
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
    scout:import { model : Model to import into index }
    { -a, --keep-alive: Do not close database connection when import finishes }
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
    return 'Import the given model into the search index'
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
  async handle ({ model }, { keepAlive }) {
    try {
      const startTime = process.hrtime()

      if (!model) {
        return this.viaAce ? this.warn(`Nothing to do`) : `Nothing to do`
      }

      const Model = ioc.use(`App/Models/${model}`)

      let count = 0
      const listener = async models => {
        count += models.size()
        this.info(`Imported ${count} ${Model.name} models...`)
      }

      this.Event.on('scout::modelsImported', listener)

      await Model.makeAllSearchable()

      this.Event.removeListener('scout::modelsImported', listener)

      const endTime = process.hrtime(startTime)
      this.success(
        `All ${Model.name} models were imported in ${prettyHrTime(endTime)}`
      )

      /**
       * Close the connection when seeder are executed and keep alive is
       * not passed
       */
      if (!keepAlive) {
        this.Database.close()
      }
    } catch (error) {
      this.error(error)
      process.exit(1)
    }
  }
}

module.exports = Import
