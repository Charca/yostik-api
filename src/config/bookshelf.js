const dbConfig = require('./db.config');
const knex = require('knex')(dbConfig);
module.exports = require('bookshelf')(knex);
