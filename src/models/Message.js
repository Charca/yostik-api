const bookshelf = require('../config/bookshelf');

module.exports = bookshelf.Model.extend({
  tableName: 'messages',
  hasTimestamps: true
});
