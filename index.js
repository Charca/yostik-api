'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const Game = require('./src/models/Game');
const Deal = require('./src/models/Deal');

const server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
  port: 8000
});

server.route({
  method: 'GET',
  path: '/api/v1/search',
  handler: function(request, reply) {
    const title = request.query.title;
    const platform = request.query.platform;
    const limit = request.query.limit;

    Deal.query((qb) => {
      qb.where('title', 'LIKE', `%${title}%`);
      if (platform) {
        qb.where('platform_id', '=', platform);
      }
      if (limit) {
        qb.limit(limit);
      }
    })
      .fetchAll()
      .then((deals) => {
        const results = (deals) ? deals.toJSON() : []
        const response = {
          count: results.length,
          results
        };
        return reply(response);
      });
  },
  config: {
    validate: {
      query: {
        title: Joi.string(),
        platform: Joi.number(),
        limit: Joi.number()
      }
    }
  }
});

server.route({
  method: 'GET',
  path: '/api/v1/subscribe',
  handler: function(request, reply) {
    reply({
      hello: 'world'
    });
  }
});

server.start((err) => {
  if (err) {
      throw err;
  }
  console.log('Server running at:', server.info.uri);
});
