const bookshelf = require('../config/bookshelf');
const Platform = require('./Platform');

module.exports = bookshelf.Model.extend({
  tableName: 'stores',
  hasTimestamps: true,
  platforms: function() {
    return this.belongsToMany(Platform);
  }
});
