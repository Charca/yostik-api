'use strict';

const Promise = require('bluebird');
const BaseTransformer = require('./BaseTransformer');
const moment = require('moment');

class GogTransformer extends BaseTransformer {
  transform(json) {
    if(json) {
      this.json = json;
    }

    if(!this.json) {
      throw 'There\'s no JSON to transform!';
    }

    let products = this.json.products;

    if(products && products.length) {
      this.deals = [];
      this.gamesMap = {};

      products.forEach((product) => {
        // GAME INFO
        let name = product.title;
        let normalizedName = this.normalizeString(name);
        // TODO: Images can be resized by appending a "size" to the end of the name,
        // before the extension. Ex: _200.jpg
        let imageUrl = (product.image) ? `https:${product.image}.jpg` : '';
        let gameScore = (product.rating) ? product.rating / 10 : null;

        if(!this.gamesMap[normalizedName]) {
          this.gamesMap[normalizedName] = {
            'name': name,
            'normalized_name': normalizedName,
            'image_url': imageUrl,
            'score': gameScore
          };
        }

        // DEAL INFO
        // TODO: Support multiple platforms
        if(!product.worksOn) {
          console.log('No Playable Platform', name, product.id);
          return;
        }

        let platformId = 7;
        if(product.worksOn.Windows) {
          platformId = 7;
        } else if(product.worksOn.Mac) {
          platformId = 8;
        } else if(product.worksOn.Linux) {
          platformId = 9;
        }

        if(!product.buyable) {
          console.log('Not Buyable', name, product.id);
          return;
        }

        let deal = {
          'title': name,
          'game_id': '', // Will be filled afterwards
          'tmp_game_normalized_name': normalizedName, // Tmp variable
          'store_id': this.storeId,
          'platform_id': platformId,
          'external_store_id': product.id,
          'image_url': imageUrl,
          'featured': false,
          'normal_price': product.price.baseAmount,
          'url': 'https://gog.com' + product.url,
          'active': true
        };

        if (product.price.isDiscounted) {
          deal['deal_price'] = product.price.finalAmount;
          deal['discount_percent'] = product.price.discountPercentage;
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

GogTransformer.prototype.storeId = 4;
GogTransformer.prototype.platforms = {
  'PC': 7,
  'Mac': 8,
  'Linux': 9
};

module.exports = GogTransformer;
