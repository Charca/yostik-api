const bookshelf = require('../config/bookshelf');
const Platform = require('./Platform');

module.exports = bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  platforms: function() {
    return this.belongsToMany(Platform);
  }
});
