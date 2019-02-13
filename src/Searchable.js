'use strict'

const { ioc } = require('@adonisjs/fold')
const Config = ioc.use('Config')
const ModelHook = require('./ModelHook')
const Builder = require('./Builder')

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
     *
     * @return {Builder}
     */
    Model.search = function (query = '') {
      return new Builder(new Model(), query)
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
     * Get model unique key to index in the search engine.
     *
     * @return {String}
     */
    Model.prototype.getSearchableKey = function () {
      return this.primaryKeyValue
    }

    /**
     * Get the indexable data for the model in JSON format.
     *
     * @return {Object} JSON
     */
    Model.prototype.toSearchableJSON = function () {
      return this.toJSON()
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
      const Serializer = this.constructor.resolveSerializer()
      new Serializer([ this ]).searchable()
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
      const Serializer = this.constructor.resolveSerializer()
      new Serializer([ this ]).unsearchable()
    }

    /**
     * Get the search engine throught witch the model should be searchable.
     *
     * @return {Driver}
     */
    Model.prototype.searchableUsing = function () {
      return ioc.use('Scout').engine()
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

    /**
     * Hack into the serializer to inject `searchable` and `unsearchable`
     * methods to allow affecting a collection of models at once.
     */
    Model.resolveSerializer = function () {
      return (Searchable.resolveSerializer.bind(this))()
    }
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
   * Extend model Serializer adding `searchable` and `unsearchable` to his
   * instance methods.
   *
   * @instance
   *
   * @method resolveSerializer
   *
   * @return {Serializer}
   */
  static resolveSerializer () {
    const Serializer = typeof (this.Serializer) === 'string'
      ? ioc.use(this.Serializer)
      : this.Serializer

    Serializer.prototype.searchable = function () {
      Searchable.makeSearchable(this)
    }

    Serializer.prototype.unsearchable = function () {
      Searchable.makeUnsearchable(this)
    }

    return Serializer
  }

  /**
   * Dispatch the job to make the given models searchable throught
   * the search engine the given models are using.
   *
   * @todo Consider using queues to defer job execution.
   *
   * @param {Collection} models
   */
  static makeSearchable (models) {
    if (!models.size()) {
      return
    }
    return models.first().searchableUsing().update(models)
  }

  /**
   * Dispatch the job to remove the given models from the search index
   * the given models are using.
   *
   * @todo Consider using queues to defer job execution.
   *
   * @param {Collection} models
   */
  static makeUnsearchable (models) {
    if (!models.size()) {
      return
    }
    return models.first().searchableUsing().delete(models)
  }
}

module.exports = Searchable
