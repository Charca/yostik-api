const bookshelf = require('../config/bookshelf');
const Game = require('./Game');

module.exports = bookshelf.Model.extend({
  tableName: 'platforms',
  games: function() {
    return this.belongsToMany(Game);
  }
});
