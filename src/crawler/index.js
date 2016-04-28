'use strict';

const clc = require('cli-color');
const knex = require('../config/bookshelf').knex;
const moment = require('moment');

class Crawler {
  constructor(options) {
    this.storeId = options.storeId;
    this.requestMethod = options.requestMethod;
    this.start = options.start || 0;
  }

  crawl() {
    process.stdout.write(clc.blue(`STARTING CRAWLER FOR STORE_ID ${this.storeId}\n\n`));
    this.crawlStart = Date.now();
    return this._cleanTempTable()
      .then(this._requestDataAndSaveInTempTable.bind(this))
      .then(this._moveNewDataToLiveDatabase.bind(this))
      .then(this._moveOldDataToHistoryDatabase.bind(this))
      .then(this._exitProcess.bind(this));
  }

  _cleanTempTable() {
    process.stdout.write(clc.blue(`CLEANING TEMP DATABASE...\n`));
    return knex.raw('truncate table deals_temp');
  }

  _requestDataAndSaveInTempTable() {
    process.stdout.write(clc.blue(`BEGIN CRAWLING AND SAVING INTO TEMP DATABASE...\n`));
    return this.requestMethod(this.start);
  }

  _moveNewDataToLiveDatabase() {
    process.stdout.write(clc.blue(`MOVING NEW DATA TO LIVE DATABASE...\n`));
    return knex.raw(`update deals set active = 0 where store_id = '${this.storeId}'`)
      .then(() => {
        return knex.raw(`insert into deals select * from deals_temp where store_id = '${this.storeId}'`)
      });
  }

  _moveOldDataToHistoryDatabase() {
    process.stdout.write(clc.blue(`MOVING OLD DATA TO HISTORY DATABASE...\n`));
    return knex.raw(`insert into deals_history select * from deals where store_id = '${this.storeId}' and active = 0`)
      .then(() => {
        return knex.raw(`delete from deals where store_id = '${this.storeId}' and active = 0`)
      });
  }

  _exitProcess() {
    const timeElapsed = moment(this.crawlStart).fromNow(true);
    process.stdout.write(clc.green(`DONE! IF YOU DON'T SEE A SEA OF RED, IT ALL WENT WELL. AND IT WAS ALL DONE IN: ${timeElapsed.toUpperCase()}`));
    process.exit();
  }
}

module.exports = Crawler;
