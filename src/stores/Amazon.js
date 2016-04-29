'use strict';

const clc = require('cli-color');
const request = require('request-promise');
const Promise = require('bluebird');
const Crawler = require('../crawler');
const AmazonTransformer = require('../transformers/AmazonTransformer');
const Deal = require('../models/Deal');
const DealTemp = Deal.extend({
  tableName: 'deals_temp'
});

const PAGE_SIZE = 10; // Amazon Limit
const TOTAL_PAGES = 10; // Amazon Limit
const STORE_ID = 3;
const BROWSE_NODES = [
  // '6469269011', // Xbox One Games
  // '409566', // Video Game Deals
  '6469296011', // Xbox One Best Sellers
  '10111200011', // Xbox One Digital Games
  '4924903011', // Xbox 360 Best Sellers
  '6427831011' // PS4 Best Sellers
];

const OperationHelper = require('apac').OperationHelper;
const amazonConfig = require('../config/amazon.config');
const opHelper = new OperationHelper(amazonConfig);

let node = 0;

const requestMethod = (page) => {
  process.stdout.write(clc.green(`Requesting ${PAGE_SIZE} records on page ${page} for node ${node}\n`));
  return opHelper.execute('ItemSearch', {
    'SearchIndex': 'VideoGames',
    'BrowseNode': BROWSE_NODES[node],
    'ItemPage': page,
    'ResponseGroup': 'ItemAttributes,Offers,Images'
  }).then(function(response) {
    const json = response.result;
    let transformer = new AmazonTransformer(json);
    return transformer.transform()
      .then(() => {
        let deals = transformer.getDeals();
        return Promise.all(deals.map((deal) => new DealTemp(deal).save()));
      })
      .then(() => {
        const nextPage = page + 1;
        if (nextPage <= TOTAL_PAGES) {
          return requestMethod(nextPage);
        } else if (node < BROWSE_NODES.length - 1) {
          node += 1;
          return requestMethod(1);
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
