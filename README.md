# AdonisJs Scout

Adonis Scout provides a driver based solution for searching your Lucid models, heavily inspired by [Laravel Scout](https://github.com/laravel/scout) and [Scout Elasticsearch Driver](https://github.com/babenkoivan/scout-elasticsearch-driver).

## Instalation

Use npm or yarn to install the package:

```sh
npm -i @brainnit/adonisjs-scout
yarn add @brainnit/adonisjs-scout
```

Add Scout to the list of service providers at `start/app.js`:

```js
const providers = [
  // ...
  '@brainnit/adonisjs-scout/providers/ScoutProvider'
];
```

## Setup

@todo Add setup instructions

## Usage

Adds `@provider:Searchable` trait to your models and define only the methods you want to override to change default behaviour:

```js
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class User extends Model {
  static get traits () {
    return ['@provider:Searchable']
  }
}

module.exports = Users
```

## Search Rules

A search rule is a class that describes how a search query will be executed and allow you to build complex and reusable searches with the support of the [`Builder`](/src/Builder.js) instance.

To create a search rule use the following command:

```sh
adonis make:searchableRule MySearchRule
```

In the file app/Models/SearchableRules/MySearchRule.js you will find a class definition:

```js
'use strict'

/** @type {typeof import('@brainnit/adonisjs-scout/src/SearchRule')} */
const SearchRule = use('Scout/SearchRule')

class MySearchRule extends SearchRule {
  buildQuery () {
    return {
      'must': {
        'match': {
          'name': this.builder.query
        }
      }
    }
  }
}

module.exports = MySearchRule
```

To tell Scout about what search rules your model supports, just add the following method:

```js
  /**
   * Specify what search rules the model supports.
   * 
   * The return value(s) must always class namespaces that will be
   * resolved by IoC Container.
   *
   * @static
   * 
   * @method searchableRules
   * 
   * @return {Array|String} ES6 Class
   */
  static searchableRules () {
    return ['App/Models/SearchRules/MySearchRule']
  }
```
## Backlog

- Add setup instructions
- Add commands (searchable:flush, searchable:import, make:searchableModel, make:searchRule)
- Add badges for npm version, build status, coverals
- Add license scan
- Add better wiki/docs

What else? Please open an Issue for suggestions.
