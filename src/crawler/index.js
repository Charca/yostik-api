'use strict';

const request = require('request-promise');
const PlayStationStoreTransformer = require('../transformers/PlayStationStoreTransformer');
const Deal = require('../models/Deal');
const Game = require('../models/Game');
const Platform = require('../models/Platform');

// TODO: GET THIS FROM A DB
const STORE_ID = 1;
const STORE_API_URL = 'https://store.playstation.com/chihiro-api/viewfinder/US/en/999/STORE-MSF77008-ALLGAMES?size=500&start=0';

// Process:
// 1) FETCH
// 2) TRANSFORM
// 3) SAVE IN DB

// 1) FETCH

request({ uri: STORE_API_URL, json: true })
  .then(function(json) {
    let transformer = new PlayStationStoreTransformer(json);
    transformer.transform().then(() => {
      let deals = transformer.getDeals();
      deals.forEach((deal) => {
        new Deal(deal).save().then((d) => {
          console.log('New Deal!', d.get('title'));
        })
      });
      console.log('Done');
    });
  });

// var fallout4 = new Game({
//   name: 'Fallout 4'
// });
//
// fallout4.save()
//   .then(function(model) {
//     return model.platforms().attach(1);
//   }).then(function(model) {
//     console.log(JSON.stringify(model));
//   });
