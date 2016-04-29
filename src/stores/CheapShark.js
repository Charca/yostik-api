'use strict';

const clc = require('cli-color');
const request = require('request-promise');
const Promise = require('bluebird');
const Crawler = require('../crawler');
const CheapSharkTransformer = require('../transformers/CheapSharkTransformer');
const Deal = require('../models/Deal');
const DealTemp = Deal.extend({
  tableName: 'deals_temp'
});

const storeMap = {
  'steam': {
    STORE_ID: 2,
    CS_STORE_ID: 1,
    TOTAL_PAGES: 128 // As of 2016-04-28, that's the last page
  },
  'wingamestore': {
    STORE_ID: 6,
    CS_STORE_ID: 20,
    TOTAL_PAGES: 28
  }
};

const store = process.argv[2];
if (!store || !storeMap.hasOwnProperty(store)) {
  process.stdout.write(clc.red(`Wrong or missing store name: ${store}\n`));
  process.stdout.write(clc.white(`Valid store names are: ${Object.keys(storeMap).join(' ')}\n`));
  process.exit(1);
}

const PAGE_SIZE = 60; // CheapShark limit
const STORE_ID = storeMap[store].STORE_ID;
const CS_STORE_ID = storeMap[store].CS_STORE_ID;
const TOTAL_PAGES = storeMap[store].TOTAL_PAGES;
const STORE_API_URL = page => `http://www.cheapshark.com/api/1.0/deals?storeID=${CS_STORE_ID}&pageSize=${PAGE_SIZE}&pageNumber=${page}`;


const requestMethod = (page) => {
  process.stdout.write(clc.green(`Requesting ${PAGE_SIZE} records on page ${page}\n`));
  return request({ uri: STORE_API_URL(page), json: true })
    .then(function(json) {
      let transformer = new CheapSharkTransformer(json, STORE_ID);
      return transformer.transform()
        .then(() => {
          let deals = transformer.getDeals();
          return Promise.all(deals.map((deal) => new DealTemp(deal).save()));
        })
        .then(() => {
          const nextPage = page + 1;
          if (nextPage <= TOTAL_PAGES) {
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
  start: 0
});

crawler.crawl();
