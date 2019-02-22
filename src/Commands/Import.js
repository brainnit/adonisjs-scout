'use strict'

const { ioc } = require('@adonisjs/fold')
const { Command } = require('@adonisjs/ace')
const prettyHrTime = require('pretty-hrtime')

class Import extends Command {
  constructor (Helpers, Scout) {
    super()
    this._appRoot = Helpers.appRoot()
    this.Scout = Scout
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
   * Command signature required by ace
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature () {
    return `
    scout:import { model : Model to sync to index } { chunck?=25 : Chunk size }
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
  async handle ({ model, chunck }, { keepAlive }) {
    try {
      const startTime = process.hrtime()

      if (!model) {
        return this.viaAce ? this.warn(`Nothing to do`) : `Nothing to do`
      }

      const Model = ioc.use(`App/Models/${model}`)

      let importedCount = 0
      let lastPage = 1

      for (let page = 1; page <= lastPage; page++) {
        /**
         * Get users chunk and make them searchable.
         *
         * @todo Start doing this in bulk for gods sake!
         */
        let users = await Model.query()
          .orderBy(Model.primaryKey)
          .paginate(page, chunck)

        await users.searchable()

        /**
         * Add chunck to importedCount and print it
         */
        importedCount += users.size()
        this.info(`Imported ${importedCount} models to index...`)

        lastPage = users.pages.lastPage
      }

      const endTime = process.hrtime(startTime)
      this.success(`Finished importing models in ${prettyHrTime(endTime)}`)

      /**
       * Close the connection when seeder are executed and keep alive is
       * not passed
       */
      if (!keepAlive) {
        ioc.use('Database').close()
      }
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  }
}

module.exports = Import
