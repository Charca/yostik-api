'use strict';

const Promise = require('bluebird');
const BaseTransformer = require('./BaseTransformer');
const moment = require('moment');

class PlayStationStoreTransformer extends BaseTransformer {
  transform(json) {
    if(json) {
      this.json = json;
    }

    if(!this.json) {
      throw 'There\'s no JSON to transform!';
    }

    let links = this.json.links;

    if(links && links.length) {
      this.deals = [];
      this.gamesMap = {};

      links.forEach((link) => {
        // GAME INFO
        // TODO: Find the difference between link.name and link.title_name
        let name = link.title_name;
        let normalizedName = this.normalizeString(name);
        // TODO: Figure out the strategy for images. In this case I'm saving the url
        // of the biggest image in the array (type = 10 whatever that means).
        let imageUrl = (link.images && link.images[3]) ? link.images[3].url : '';
        let gameScore = (link.star_rating) ? link.star_rating.score : null;

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
        if(!link.playable_platform) {
          console.log('No Playable Platform', name, link.id);
          return;
        }
        let platformId = this.platforms[this.normalizeString(link.playable_platform[0])];
        let sku = link.default_sku;
        if(!sku) {
          console.log('No Default SKU', name, link.id);
          return;
        }
        let deal = {
          'title': name,
          'game_id': '', // Will be filled afterwards
          'tmp_game_normalized_name': normalizedName, // Tmp variable
          'store_id': this.storeId,
          'platform_id': platformId,
          'external_store_id': link.id,
          'image_url': imageUrl,
          'featured': false,
          'normal_price': sku.price / 100,
          'url': 'https://store.playstation.com/#!/en-us/games/cid=' + link.id,
          'active': true
        };

        let discounts = sku.rewards;
        let discount;

        if(discounts && discounts.length) {
          // It looks like multiple objects in the rewards array are for
          // promos with different days, but all the info for the current deal
          // is in the 0 index object.
          discount = discounts[0];

          if (discount.isPlus) {
            // Plus Only Discount
            deal['plus_price'] = discount.price / 100;
            deal['plus_discount_percent'] = discount.discount;
          } else {
            // Normal Discount
            deal['deal_price'] = discount.price / 100;
            deal['discount_percent'] = discount.discount;
            if(discount.bonus_discount && discount.bonus_price) {
              // Plus Discount in addition to Normal Discount
              deal['plus_price'] = discount.bonus_price / 100;
              deal['plus_discount_percent'] = discount.bonus_discount;
            }
          }

          deal['deal_start_date'] = moment(discount.start_date).format('YYYY-MM-DD hh:mm:ss') || null;
          deal['deal_end_date'] = moment(discount.end_date).format('YYYY-MM-DD hh:mm:ss') || null;
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

PlayStationStoreTransformer.prototype.storeId = 1;
PlayStationStoreTransformer.prototype.platforms = {
  'PS4': 1,
  'PS3': 2,
  'PSVITA': 3,
  'PSP': 4
};

module.exports = PlayStationStoreTransformer;
