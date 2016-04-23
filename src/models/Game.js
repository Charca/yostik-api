const bookshelf = require('../config/bookshelf');
const Platform = require('./Platform');

module.exports = bookshelf.Model.extend({
  tableName: 'games',
  hasTimestamps: true,
  platforms: function() {
    return this.belongsToMany(Platform);
  }
});
