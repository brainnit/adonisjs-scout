'use strict'

const Config = use('Config')

/**
 * @typedef {import('@adonisjs/lucid/src/Lucid/Model')} Model
 */

class ModelHook {
  /**
   * Handle the `afterSave` event for the model.
   *
   * @param {Model} modelInstance
   *
   * @return {void}
   */
  static saved (modelInstance) {
    if (!!modelInstance.shouldBeSearchable() === false) {
      modelInstance.unsearchable()
      return
    }
    modelInstance.searchable()
  }

  /**
   * handle the `afterDelete` event for the model.
   *
   * @param {Model} modelInstance
   *
   * @return {void}
   */
  static deleted (modelInstance) {
    modelInstance.unsearchable()
  }
}

module.exports = ModelHook
