const bookshelf = require('../config/bookshelf');
const Game = require('./Game');
const Platform = require('./Platform');
const Store = require('./Store');

module.exports = bookshelf.Model.extend({
  tableName: 'deals',
  hasTimestamps: true,
  game: function() {
    return this.hasOne(Game);
  },
  platform: function() {
    return this.hasOne(Platform);
  },
  store: function() {
    return this.hasOne(Store);
  }
});
