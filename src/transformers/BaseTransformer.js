'use strict';

const _ = require('lodash');
const Game = require('../models/Game');

class BaseTransformer {
  constructor(json) {
    this.json = json;
  }

  normalizeString(str) {
    return str.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase();
  }

  fetchOrCreateGame(gameInfo) {
    // TODO: Memoize this method for better performance
    // if(this.gamesCache[game.normalized_name]) {
    //   return this.gamesCache.id;
    // }
    return new Game({'normalized_name': gameInfo.normalized_name})
      .fetch()
      .then(function(game) {
        if(!game) {
          return new Game(gameInfo).save().catch(function(err) {
            console.log(err);
          });
        }

        return this;
      });
  }

  processGamesMap(map) {
    let promises = [];
    for(var key in map) {
      let promise = this.fetchOrCreateGame(map[key]).then((game) => {
        let deals = _.filter(this.deals, {
          'tmp_game_normalized_name': game.get('normalized_name')
        });

        deals.forEach((deal) => {
          deal.game_id = game.get('id');
          delete deal.tmp_game_normalized_name;
        });
      });

      promises.push(promise);
    }
    return promises;
  }

  normalizeDeals() {
    this.deals.forEach((deal) => {
      delete deal.tmp_game_normalized_name;
    })
  }
}

BaseTransformer.prototype.deals = [];
BaseTransformer.prototype.gamesMap = {};
BaseTransformer.prototype.gamesCache = {};

module.exports = BaseTransformer;
