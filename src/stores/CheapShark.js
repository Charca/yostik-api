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

const PAGE_SIZE = 60; // CheapShark limit

// TODO: Put in variables
const STORE_ID = 2;
const CS_STORE_ID = 1;
const TOTAL_PAGES = 128; // As of 2016-04-28, that's the last page
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
