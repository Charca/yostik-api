'use strict';

const _ = require('lodash');
const Hapi = require('hapi');
const Joi = require('joi');
const Game = require('./src/models/Game');
const Deal = require('./src/models/Deal');
const Message = require('./src/models/Message');
const Platform = require('./src/models/Platform');
const User = require('./src/models/User');
const WatchlistItem = require('./src/models/WatchlistItem');
const facebookConfig = require('./src/config/facebook.config');
const requestPromise = require('request-promise');
const romanize = require('./src/utils/romanize');

// Based on: http://www.gobloggingtips.com/wp-content/uploads/2014/08/Google-stopwords.txt
const STOPWORDS = ['a', 'an', 'as', 'at', 'be', 'for', 'from', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'what'];

const server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
  port: 8000
});

server.route({
  method: 'GET',
  path: '/api/v1/search',
  handler: function(request, reply) {
    const platform = request.query.platform;
    const limit = request.query.limit;
    const title = request.query.title;
    const queryArray = title.replace(/[^a-z 0-9]/gi, '').trim().toLowerCase().split(' ');

    if (!queryArray.length) {
      return reply({error: 'Invalid query'});
    }

    Deal.query((qb) => {
      queryArray.map((q) => {
        if(isNaN(q)) {
          return qb.where('title', 'LIKE', `%${q}%`);
        }

        qb.whereRaw(`(title LIKE '%${q}%' OR title LIKE '%${romanize.toRoman(q)}%')`);
      });
      if (platform) {
        qb.where('platform_id', 'IN', platform);
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
        platform: Joi.array(),
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
  method: 'GET',
  path: '/api/v1/watchlist/{messenger_platform_id}/{external_user_id}',
  handler: function(request, reply) {
    return WatchlistItem.query((qb) => {
      qb.where('messenger_platform_id', '=', request.params.messenger_platform_id);
      qb.where('external_user_id', '=', request.params.external_user_id);
      qb.where('active', '=', '1');
      qb.orderBy('updated_at', 'desc');
    })
    .fetchAll({withRelated: ['game', 'platform']})
    .then((items) => {
      const results = (items) ? items.toJSON() : [];
      const response = {
        count: results.length,
        results
      };
      return reply(response);
    })
    .catch((err) => {
      return reply(err);
    })
  },
  config: {
    validate: {
      params: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_user_id: Joi.number().required()
      })
    }
  }
})

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
  method: 'POST',
  path: '/api/v1/watchlist-remove',
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
  path: '/api/v1/user/{messenger_platform_id}/{external_user_id}',
  handler: function(request, reply) {
    if (request.query.access_token !== facebookConfig.access_token) {
      return reply({
        error: true,
        errorMessage: 'Invalid access token'
      });
    }
    const userObj = {
      'messenger_platform_id': request.params.messenger_platform_id,
      'external_user_id': request.params.external_user_id
    };
    return new User(userObj).fetch({withRelated: ['platforms']})
      .then((user) => {
        if (!user) {
          const graphDataUrl = `https://graph.facebook.com/v2.6/${userObj.external_user_id}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${facebookConfig.access_token}`;
          const createUser = (userObj) => {
            return new User(userObj).save()
              .then((user) => {
                return reply({
                  data: user.toJSON(),
                  isNew: true
                });
              })
              .catch((err) => {
                console.error(err);
                reply(err);
              });
          };
          return requestPromise({ uri: graphDataUrl, json: true })
            .then((json) => {
              if (json) {
                userObj.first_name = json.first_name;
                userObj.last_name = json.last_name;
                userObj.profile_pic = json.profile_pic;
                userObj.locale = json.locale;
                userObj.timezone = json.timezone;
                userObj.gender = json.gender;
              }
              return createUser(userObj);
            })
            .catch((err) => {
              // If GraphAPI request fails, create the user anyway
              return createUser(userObj);
            });
        }
        return reply({
          data: user.toJSON(),
          isNew: false
        });
      });
  },
  config: {
    validate: {
      params: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_user_id: Joi.number().required()
      }),
      query: Joi.object({
        access_token: Joi.string()
      })
    }
  }
});

server.route({
  method: 'POST',
  path: '/api/v1/reply-context/{messenger_platform_id}/{external_user_id}',
  handler: function(request, reply) {
    if (request.query.access_token !== facebookConfig.access_token) {
      return reply({
        error: true,
        errorMessage: 'Invalid access token'
      });
    }
    const userObj = {
      'messenger_platform_id': request.params.messenger_platform_id,
      'external_user_id': request.params.external_user_id
    };
    return new User(userObj).fetch({withRelated: ['platforms']})
      .then((user) => user.save({
        reply_context: (request.payload.reply_context === 'NULL') ? null : request.payload.reply_context
      }, {
        patch: true
      }))
      .then((user) => {
        return reply({
          data: user.toJSON(),
          isNew: false
        });
      });
  },
  config: {
    validate: {
      params: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_user_id: Joi.number().required()
      }),
      query: Joi.object({
        access_token: Joi.string()
      }),
      payload: Joi.object({
        reply_context: Joi.string()
      })
    }
  }
});

server.route({
  method: 'POST',
  path: '/api/v1/add-platform/{messenger_platform_id}/{external_user_id}',
  handler: function(request, reply) {
    if (request.query.access_token !== facebookConfig.access_token) {
      return reply({
        error: true,
        errorMessage: 'Invalid access token'
      });
    }
    const userObj = {
      'messenger_platform_id': request.params.messenger_platform_id,
      'external_user_id': request.params.external_user_id
    };
    return new User(userObj).fetch({withRelated: ['platforms']})
      .then((user) => {
        return new Platform({id: request.payload.platform_id}).fetch()
          .then((platform) => user.related('platforms').create(platform))
      })
      .then((platform) => {
        return reply({
          platform: platform.toJSON()
        });
      });
  },
  config: {
    validate: {
      params: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_user_id: Joi.number().required()
      }),
      query: Joi.object({
        access_token: Joi.string()
      }),
      payload: Joi.object({
        platform_id: Joi.number()
      })
    }
  }
});

server.route({
  method: 'POST',
  path: '/api/v1/remove-platform/{messenger_platform_id}/{external_user_id}',
  handler: function(request, reply) {
    if (request.query.access_token !== facebookConfig.access_token) {
      return reply({
        error: true,
        errorMessage: 'Invalid access token'
      });
    }
    const userObj = {
      'messenger_platform_id': request.params.messenger_platform_id,
      'external_user_id': request.params.external_user_id
    };
    return new User(userObj).fetch({withRelated: ['platforms']})
      .then((user) => {
        return new Platform({id: request.payload.platform_id}).fetch()
          .then((platform) => user.related('platforms').detach(platform))
      })
      .then((platform) => {
        return reply({
          platform: platform.toJSON()
        });
      });
  },
  config: {
    validate: {
      params: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_user_id: Joi.number().required()
      }),
      query: Joi.object({
        access_token: Joi.string()
      }),
      payload: Joi.object({
        platform_id: Joi.number()
      })
    }
  }
});

server.route({
  method: 'POST',
  path: '/api/v1/update-plus/{messenger_platform_id}/{external_user_id}',
  handler: function(request, reply) {
    if (request.query.access_token !== facebookConfig.access_token) {
      return reply({
        error: true,
        errorMessage: 'Invalid access token'
      });
    }
    const userObj = {
      'messenger_platform_id': request.params.messenger_platform_id,
      'external_user_id': request.params.external_user_id
    };
    return new User(userObj).fetch({withRelated: ['platforms']})
      .then((user) => user.save({ has_plus: request.payload.has_plus }))
      .then((user) => {
        return reply({
          data: user.toJSON()
        });
      });
  },
  config: {
    validate: {
      params: Joi.object({
        messenger_platform_id: Joi.number().required(),
        external_user_id: Joi.number().required()
      }),
      query: Joi.object({
        access_token: Joi.string()
      }),
      payload: Joi.object({
        has_plus: Joi.boolean()
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
