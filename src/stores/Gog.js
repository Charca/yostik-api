'use strict';

const clc = require('cli-color');
const request = require('request-promise');
const Promise = require('bluebird');
const Crawler = require('../crawler');
const GogTransformer = require('../transformers/GogTransformer');
const Deal = require('../models/Deal');
const DealTemp = Deal.extend({
  tableName: 'deals_temp'
});

const PAGE_SIZE = 200;
const STORE_ID = 4;
const STORE_API_URL = page => `https://www.gog.com/games/ajax/filtered?sort=rank&mediaType=game&limit=${PAGE_SIZE}&page=${page}`;
let totalPages = 50; // Aribitrary limit, actual number gets set on first request

const requestMethod = (page) => {
  process.stdout.write(clc.green(`Requesting ${PAGE_SIZE} records on page ${page}\n`));
  return request({ uri: STORE_API_URL(page), json: true })
    .then(function(json) {
      totalPages = json.totalPages || totalPages;
      let transformer = new GogTransformer(json);
      return transformer.transform()
        .then(() => {
          let deals = transformer.getDeals();
          return Promise.all(deals.map((deal) => new DealTemp(deal).save()));
        })
        .then(() => {
          const nextPage = page + 1;
          if (nextPage <= totalPages) {
            return requestMethod(nextPage);
          } else {
            return Promise.resolve();
          }
        });
    });
}

const crawler = new Crawler({
  storeId: STORE_ID,
  requestMethod: requestMethod,
  start: 1
});

crawler.crawl();
