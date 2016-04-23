'use strict';

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
