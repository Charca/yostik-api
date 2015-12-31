'use strict';

const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();

const knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'yostik',
    charset  : 'utf8'
  }
});

const bookshelf = require('bookshelf')(knex);

var Platform = bookshelf.Model.extend({
  tableName: 'platforms'
});

server.connection({
    host: 'localhost',
    port: 8000
});

// Add the route
server.route({
    method: 'GET',
    path:'/platforms',
    handler: function (request, reply) {
      Platform.fetchAll()
        .then((platforms) => {
          return reply(platforms.toJSON());
        });
    }
});

// Start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
