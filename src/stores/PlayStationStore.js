'use strict';

const clc = require('cli-color');
const request = require('request-promise');
const Promise = require('bluebird');
const Crawler = require('../crawler');
const PlayStationStoreTransformer = require('../transformers/PlayStationStoreTransformer');
const Deal = require('../models/Deal');
const DealTemp = Deal.extend({
  tableName: 'deals_temp'
});

const PAGE_SIZE = 200;
const STORE_ID = 1;
const STORE_API_URL = start => `https://store.playstation.com/chihiro-api/viewfinder/US/en/999/STORE-MSF77008-ALLGAMES?size=${PAGE_SIZE}&start=${start}`;
let totalResults = 500; // Aribitrary limit, actual number gets set on first request

const requestMethod = (start) => {
  process.stdout.write(clc.green(`Requesting ${PAGE_SIZE} records starting at ${start}\n`));
  return request({ uri: STORE_API_URL(start), json: true })
    .then(function(json) {
      totalResults = json.total_results || totalResults;
      let transformer = new PlayStationStoreTransformer(json);
      return transformer.transform()
        .then(() => {
          let deals = transformer.getDeals();
          return Promise.all(deals.map((deal) => new DealTemp(deal).save()));
        })
        .then(() => {
          const nextStart = start + PAGE_SIZE;
          if (nextStart < totalResults) {
            return requestMethod(nextStart);
          } else {
            return Promise.resolve();
          }
        });
    });
}

const crawler = new Crawler({
  storeId: STORE_ID,
  requestMethod: requestMethod
});

crawler.crawl();
