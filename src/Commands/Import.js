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
    scout:import { model: Model to sync to index }
    { -c, --chunck: Chunk size }
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
  async handle ({ model }, { chunck }) {
    try {
      const startTime = process.hrtime()

      if (!model) {
        return this.viaAce ? this.warn(`Nothing to do`) : `Nothing to do`
      }

      chunck = chunck || 25

      const Model = ioc.make(`App/Models/${model}`)

      let lastPage = 1

      for (let page = 1; page <= lastPage; page++) {
        /**
         * Search for first users
         */
        let users = await Model.query().paginate(page, chunck)

        /**
         * Make all users searchable adding them to index
         */
        await users.searchable()

        lastPage = users.lastPage

        this.info(`Imported ${page * chunck} models...`)
      }

      const endTime = process.hrtime(startTime)
      this.success(`Imported all models in ${prettyHrTime(endTime)}`)
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  }
}

module.exports = Import
