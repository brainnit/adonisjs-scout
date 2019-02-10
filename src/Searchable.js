'use strict'

const Config = use('Config')
const ModelHook = require('./ModelHook')

/**
 * @typedef {import('@adonisjs/lucid/src/Lucid/Model')} Model
 */

class Searchable {
  /**
   * Register trait to the model.
   *
   * @param {Model} Model
   * @param {Object} customOptions Trait custom options
   *
   * @return {void}
   */
  register (Model, customOptions = {}) {
    const defaultOptions = { autoSync: true }
    const options = Object.assign(defaultOptions, customOptions)

    /**
     * Simply boot the trait.
     */
    Searchable.bootSearchable(Model, options)

    /**
     * Perform a search against the model's indexed data.
     *
     * @method search
     *
     * @static
     *
     * @param {String} query
     * @param {function} callback
     *
     * @return {Builder}
     */
    Model.search = function (query = '', callback = null) {
      return undefined
    }

    /**
     * Get the index name for the model.
     *
     * @method searchableAs
     *
     * @instance
     *
     * @method searchableAs
     *
     * @return {String} Search index name
     */
    Model.prototype.searchableAs = function () {
      const prefix = Config.get('scout.prefix')
      return `${prefix}${this.constructor.table}`
    }

    /**
     * Determine if the model should be searchable.
     *
     * @method shouldBeSearchable
     *
     * @instance
     *
     * @return {Boolean}
     */
    Model.prototype.shouldBeSearchable = function () {
      return true
    }

    /**
     * Add the given model instance to the search index.
     *
     * @method searchable
     *
     * @instance
     *
     * @return {void}
     */
    Model.prototype.searchable = function () {
      // do the magic throught the collection
    }

    /**
     * Remove the given model instance from the search index.
     *
     * @method unsearchable
     *
     * @instance
     *
     * @return {void}
     */
    Model.prototype.unsearchable = function () {
      // do the magic throught the collection
    }
  }

  /**
   * Boot the trait.
   *
   * @param {Model} Model
   * @param {Object} options Trait options
   *
   * @return {void}
   */
  static bootSearchable (Model, options) {
    /**
     * Register hooks to keep the model automatically synced
     * to the search engine.
     */
    if (options.autoSync) {
      Searchable.registerObservers(Model)
    }

    Searchable.registerCollectionMacros(Model)
  }

  /**
   * Register model event observers to keep the model automatically synced
   * to the search engine.
   *
   * @param {Model} Model
   *
   * @return {void}
   */
  static registerObservers (Model) {
    Model.addHook('afterSave', ModelHook.saved)
    Model.addHook('afterDelete', ModelHook.deleted)
  }

  /**
   * Register the searchable query macros.
   *
   * @param {Model} Model
   *
   * @return {void}
   */
  static registerSearchableMacros (Model) {
    // add searchable|unsearchable to serializer
  }

  /**
   * Dispatch the job to make the given models searchable.
   *
   * @param {Collection} models
   */
  static makeSearchable (collection) {

  }
}

module.exports = Searchable
