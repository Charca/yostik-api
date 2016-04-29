'use strict';

const Promise = require('bluebird');
const BaseTransformer = require('./BaseTransformer');
const moment = require('moment');

class CheapSharkTransformer extends BaseTransformer {
  constructor(json, storeId) {
    super(json);
    if(storeId) {
      this.storeId = storeId;
    }
  }

  transform(json) {
    if(json) {
      this.json = json;
    }

    if(!this.json) {
      throw 'There\'s no JSON to transform!';
    }

    let products = this.json;

    if(products && products.length) {
      this.deals = [];
      this.gamesMap = {};

      products.forEach((product) => {
        // GAME INFO
        let name = product.title;
        let normalizedName = this.normalizeString(name);
        let imageUrl = (product.thumb.indexOf('_sm_120.jpg') !== -1) ? product.thumb.replace('_sm_120.jpg', '_616x353.jpg') : product.thumb;
        let gameScore = (product.steamRatingPercent) ? parseInt(product.steamRatingPercent, 10) / 20 : null;

        if(!this.gamesMap[normalizedName]) {
          this.gamesMap[normalizedName] = {
            'name': name,
            'normalized_name': normalizedName,
            'image_url': imageUrl,
            'score': gameScore
          };
        }

        // DEAL INFO
        // TODO: Support multiple platforms (not possible with CheapShark, assume PC always)
        const platformId = 7;

        let deal = {
          'title': name,
          'game_id': '', // Will be filled afterwards
          'tmp_game_normalized_name': normalizedName, // Tmp variable
          'store_id': this.storeId,
          'platform_id': platformId,
          'external_store_id': product.gameID,
          'image_url': imageUrl,
          'featured': false,
          'normal_price': product.normalPrice,
          'url': 'https://www.cheapshark.com/redirect.php?dealID=' + product.dealID,
          'active': true
        };

        if (product.isOnSale === '1') {
          deal['deal_price'] = product.salePrice;
          deal['discount_percent'] = parseInt(product.savings, 10);
        }

        this.deals.push(deal);
      }); // End forEach
    }

    const promises = this.processGamesMap(this.gamesMap);
    return Promise.all(promises).then(() => this.normalizeDeals());
  }

  getDeals() {
    return this.deals;
  }
}

CheapSharkTransformer.prototype.storeId = 0;
CheapSharkTransformer.prototype.platforms = {
  'PC': 7
};

module.exports = CheapSharkTransformer;
