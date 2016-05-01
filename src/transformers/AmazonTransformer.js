'use strict';

const Promise = require('bluebird');
const BaseTransformer = require('./BaseTransformer');
const moment = require('moment');

class AmazonTransformer extends BaseTransformer {
  transform(json) {
    if(json) {
      this.json = json;
    }

    if(!this.json) {
      throw 'There\'s no JSON to transform!';
    }

    let items = this.json.ItemSearchResponse;
    items = items && items.Items && items.Items.Item;

    if(items && items.length) {
      this.deals = [];
      this.gamesMap = {};

      items.forEach((item) => {
        const attributes = item.ItemAttributes;
        // GAME INFO
        let name = attributes.Title;
        // Amazon adds the name of the platform to the end of the name, I remove
        // it before normalizing so it matches existing game IDs
        let cleanName = name.replace(/ - (xbox 360|xbox one|playstation 3|playstation 4|xbox one digital code)/i, '');
        let normalizedName = this.normalizeString(cleanName);
        let imageUrl = (item.LargeImage && item.LargeImage.URL) ? item.LargeImage.URL : '';
        let gameScore = null;

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
        if (!attributes.OperatingSystem) {
          console.log('No platform for game', name);
          return;
        }
        let platformId = this.platforms[this.normalizeString(attributes.OperatingSystem)];
        if (!platformId) {
          console.log('Unknown Platform', attributes.OperatingSystem);
          return;
        }

        const listing = item.Offers && item.Offers.Offer && item.Offers.Offer.OfferListing;
        if (!listing) {
          // No offer listings probably means a game that's not out yet (for a pre-order for example)
          console.log('No Offer Listings for game', name);
          return;
        }
        const price = (attributes.ListPrice) ? attributes.ListPrice.Amount : listing.Price.Amount;

        let deal = {
          'title': name,
          'game_id': '', // Will be filled afterwards
          'tmp_game_normalized_name': normalizedName, // Tmp variable
          'store_id': this.storeId,
          'platform_id': platformId,
          'external_store_id': item.ASIN,
          'image_url': imageUrl,
          'featured': false,
          'normal_price': parseInt(price, 10) / 100,
          'url': item.DetailPageURL,
          'active': true
        };

        const isDiscounted = (listing.AmountSaved && listing.PercentageSaved);

        if (isDiscounted) {
          deal['deal_price'] = parseInt(listing.Price.Amount, 10) / 100;
          deal['discount_percent'] = listing.PercentageSaved;
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

AmazonTransformer.prototype.storeId = 3;
AmazonTransformer.prototype.platforms = {
  'PLAYSTATION4': 1,
  'PLAYSTATION3': 2,
  'XBOX': 5,
  'XBOXONE': 5,
  'XBOX360': 6,
  'MICROSOFTXBOX360': 6
};

module.exports = AmazonTransformer;
