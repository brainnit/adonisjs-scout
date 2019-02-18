'use strict'

const { ioc } = require('@adonisjs/fold')
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
     * Perform a raw search against the model's indexed data
     * using the desired engine directly.
     *
     * @method searchRaw
     *
     * @static
     *
     * @param {String} query
     *
     * @return {*}
     */
    Model.searchRaw = function (...params) {
      const model = new Model()
      return model.searchableUsing().searchRaw(model.searchableAs(), ...params)
    }

    /**
     * The search rules to be used for searching data in reusable ways.
     * The return value(s) must always be ES6 class(es).
     *
     * By default it is empty.
     *
     * @override
     *
     * @method searchableRules
     *
     * @static
     *
     * @return {Array|String} ES6 Class
     */
    if (!Model.searchableRules) {
      Model.searchableRules = function () {
        return []
      }
    }

    /**
     * Get the key name used to index the model.
     *
     * @override
     *
     * @method getSearchableKey
     *
     * @static
     *
     * @return {String}
     */
    if (!Model.getSearchableKeyName) {
      Model.getSearchableKeyName = function () {
        return Model.primaryKey
      }
    }

    /**
     * Get the index name for the model.
     *
     * @override
     *
     * @method searchableAs
     *
     * @instance
     *
     * @method searchableAs
     *
     * @return {String} Search index name
     */
    if (!Model.prototype.searchableAs) {
      Model.prototype.searchableAs = function () {
        const prefix = ioc.use('Config').get('scout.prefix')
        return `${prefix}${this.constructor.table}`
      }
    }

    /**
     * Determine if the model should be searchable.
     *
     * @override
     *
     * @method shouldBeSearchable
     *
     * @instance
     *
     * @return {Boolean}
     */
    if (!Model.prototype.shouldBeSearchable) {
      Model.prototype.shouldBeSearchable = function () {
        return true
      }
    }

    /**
     * Get the key value to index the model.
     *
     * @override
     *
     * @method getSearchableKey
     *
     * @instance
     *
     * @return {String}
     */
    if (!Model.prototype.getSearchableKey) {
      Model.prototype.getSearchableKey = function () {
        return this.primaryKeyValue
      }
    }

    /**
     * Get the indexable data for the model in JSON format.
     *
     * @override
     *
     * @method toSearchableJSON
     *
     * @instance
     *
     * @return {Object} JSON
     */
    if (!Model.prototype.toSearchableJSON) {
      Model.prototype.toSearchableJSON = function () {
        return this.toJSON()
      }
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

    /**
     * Get the requested models from an array of object IDs.
     *
     * @method getScoutModelsByIds
     *
     * @instance
     *
     * @param {Builder} builder
     * @param {Array} ids
     *
     * @return {*}
     */
    Model.prototype.getScoutModelsByIds = function (builder, ids) {
      const query = Model.query()

      if (builder.queryCallback) {
        builder.queryCallback(query)
      }

      return query.whereIn(Model.getSearchableKeyName(), ids).fetch()
    }

    /**
     * Get the cursor for the model instance, needed for the `CursorPaginator`.
     *
     * @method getSearchableCursor
     *
     * @instance
     *
     * @param {Builder} builder
     * @param {Array} columns
     *
     * @return {Array}
     */
    Model.prototype.getSearchableCursor = function (columns) {
      return columns.map(column => this[column])
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
