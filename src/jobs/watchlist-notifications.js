'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const clc = require('cli-color');
const knex = require('../config/bookshelf').knex;
const moment = require('moment');
const request = require('request-promise');
const WatchlistItem = require('../models/WatchlistItem');

let notifyStart;

function notify() {
  process.stdout.write(clc.blue(`STARTING WATCHLIST NOTIFICATIONS\n\n`));
  notifyStart = Date.now();
  return checkWatchlist()
    .then(notifyUsers)
    .then(exitProcess);
}

function checkWatchlist() {
  process.stdout.write(clc.blue(`CHECKING IF THERE'S SOMETHING TO NOTIFY\n`));
  const query = `d.*, w.id as watchlist_id, w.external_user_id, w.low_price,
  	case when d.deal_price is not null then round(d.deal_price, 2) else round(d.normal_price, 2) end as lowest_price
  from deals d, watchlist w
  where 1 = 1
  and d.game_id = w.game_id
  and d.platform_id = w.platform_id
  and w.active = 1
  and w.messenger_platform_id = 1
  having lowest_price + .10 < w.low_price
  order by external_user_id`;

  return knex.select(knex.raw(query));
}

function notifyUsers(response) {
  if (response && response.length) {
    process.stdout.write(clc.blue(`NOTIFYING USERS\n`));
    const notificationsMap = _.groupBy(response, 'external_user_id');
    return Promise.all(Object.keys(notificationsMap).map((userId) => {
      process.stdout.write(clc.blue(`NOTIFYING USER ID ${userId}\n`));
      return request({
        method: 'POST',
        uri: `http://localhost:8123/bot/messenger/v1/notify/${userId}`,
        body: notificationsMap[userId],
        json: true
      }).then(updateWatchlist);
    }));
  } else {
    process.stdout.write(clc.blue(`NOTHING TO NOTIFY\n`));
  }
}

function updateWatchlist(result) {
  const updates = _.values(_.groupBy(result.watchlist_items, 'id'));
  return Promise.all(updates.map((update) => {
    const item = _.minBy(update, 'low_price');
    process.stdout.write(clc.blue(`UPDATING WATCHLIST ITEM ID ${item.id}\n`));
    return new WatchlistItem({ id: item.id }).save({ low_price: item.low_price, notified_at: new Date() });
  }));
}

function exitProcess() {
  const timeElapsed = moment(notifyStart).fromNow(true);
  process.stdout.write(clc.green(`DONE! IF YOU DON'T SEE A SEA OF RED, IT ALL WENT WELL. AND IT WAS ALL DONE IN: ${timeElapsed.toUpperCase()}\n\n`));
  process.exit();
}

notify();
