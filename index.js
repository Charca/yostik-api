'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const Game = require('./src/models/Game');
const Deal = require('./src/models/Deal');
const Message = require('./src/models/Message');
const WatchlistItem = require('./src/models/WatchlistItem');

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
});

server.route({
  method: 'POST',
  path: '/api/v1/watchlist',
  handler: function(request, reply) {
    const data = {
      messenger_platform_id: request.payload.messenger_platform_id,
      external_user_id: request.payload.external_user_id,
      game_id: request.payload.game_id,
      platform_id: request.payload.platform_id
    };

    const item = new WatchlistItem(data).fetch();
    item.then((existingItem) => {
      if (!existingItem) {
        data.low_price = request.payload.low_price;
        data.active = 1;
        // insert
        return new WatchlistItem(data).save()
          .then((newItem) => {
            return new Game({id: newItem.get('game_id')}).fetch().then((game) => {
              const response = newItem.toJSON();
              response.game_name = game.get('name');
              reply({
                success: true,
                action: 'watchlist_item_added',
                item: response
              });
            });
          })
          .catch((err) => {
            console.error(err);
            reply(err);
          });
      }
      // update
      existingItem.set({ low_price: request.payload.low_price, active: 1 }).save()
        .then((newItem) => {
          return new Game({id: newItem.get('game_id')}).fetch().then((game) => {
            const response = newItem.toJSON();
            response.game_name = game.get('name');
            reply({
              success: true,
              action: 'watchlist_item_updated',
              item: response
            });
          });
        })
        .catch((err) => {
          console.error(err);
          reply(err);
        });
    });
  },
  config: {
    validate: {
      payload: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_user_id: Joi.number().required(),
        game_id: Joi.number().required(),
        platform_id: Joi.number().required(),
        low_price: Joi.string().required()
      })
    }
  }
});

server.route({
  method: 'DELETE',
  path: '/api/v1/watchlist',
  handler: function(request, reply) {
    return new WatchlistItem({ id: request.payload.id }).save({
      active: 0
    }).then((item) => {
      reply({
        success: true,
        action: 'watchlist_item_removed',
        item: item.toJSON()
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
        id: Joi.number().required()
      })
    }
  }
});

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
