'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const Game = require('./src/models/Game');
const Deal = require('./src/models/Deal');
const Message = require('./src/models/Message');

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
      qb.orderByRaw('deal_price is null, deal_price desc');
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
  method: 'POST',
  path: '/api/v1/logmessage',
  handler: function(request, reply) {
    const data = {
      messenger_platform_id: request.payload.messenger_platform_id,
      external_message_id: request.payload.external_message_id,
      external_user_id: request.payload.external_user_id,
      type: request.payload.type,
      text: request.payload.text
    };

    const message = new Message(data).save();
    message.then((message) => {
      reply({
        success: true,
        message_id: message.id
      });
    })
    .catch((err) => {
      console.error(err);
      reply(err);
    });
  },
  config: {
    validate: {
      payload: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_message_id: Joi.string().required(),
        external_user_id: Joi.number().required(),
        type: Joi.string().required(),
        text: Joi.string().required()
      })
    }
  }
})

server.route({
  method: 'GET',
  path: '/api/v1/subscribe',
  handler: function(request, reply) {
    reply({
      hello: 'world!!!!'
    });
  }
});

server.start((err) => {
  if (err) {
      throw err;
  }
  console.log('Server running at:', server.info.uri);
});
