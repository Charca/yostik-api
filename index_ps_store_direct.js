'use strict';

const Hapi = require('hapi');
const r = require('request');

const STORES = ['US/en', 'AR/en', 'AU/en', 'BR/en', 'ES/es', 'GB/en'];
const DEFAULT_STORE = 0; // US/en
const API_VERSION = '19';

const API_URL = 'https://store.playstation.com/store/api/chihiro/00_09_000';
const DEALS_URL = 'https://store.playstation.com/chihiro-api/viewfinder/US/en/999/STORE-MSF77008-ALLDEALS';
const SEARCH_URL = API_URL + '/search/' + STORES[DEFAULT_STORE] + '/' + API_VERSION + '/';

// TODO: Handle paging :)
const DEALS_RESULT_SIZE = 20;
const SEARCH_RESULT_SIZE = 30;

// Create a server with a host and port
const server = new Hapi.Server();

server.connection({
    host: '0.0.0.0',
    port: 8000
});

function getResultsFromLinks(links) {
  return links.filter(function(link) {
    // If it doesn't have a default_sku, it's a Disc Only game.
    // Doesn't make sense to have it on the list.
    return (link.default_sku);
  }).map(function(link, index) {
    var sku = link.default_sku;

    return {
      id: link.id,
      name: link.name,
      images: link.images,
      price: sku.price,
      displayPrice: sku.display_price,
      discounts: sku.rewards,
      platforms: link.playable_platform,
      rating: link.star_rating // This is not available in search results
    }
  });
}

server.route({
  method: 'GET',
  path: '/api/v1/deals',
  handler: function(request, reply) {
    r(DEALS_URL + '?size=' + DEALS_RESULT_SIZE, function(err, response, body) {
      var results = JSON.parse(body);

      if(results.links === undefined) {
        return reply({
          error: true,
          errorMessage: 'Oops. Looks like that URL is no longer available. Please contact the admin.',
          serviceResponse: results
        }).code(404);
      }

      var data = {
        results: getResultsFromLinks(results.links),
        totalResults: results.total_results
      };

      reply(data);
    });
  }
});

server.route({
    method: 'GET',
    path: '/api/v1/search/{q}',
    handler: function (request, reply) {
      var query = request.params.q;

      r(SEARCH_URL + query + '?bucket=games&game_content_type=games,bundles&size=' + SEARCH_RESULT_SIZE, function(err, response, body) {
        var results = JSON.parse(body);

        if(results.links === undefined) {
          return reply({
            error: true,
            errorMessage: 'Oops. Looks like that URL is no longer available. Please contact the admin.',
            serviceResponse: results
          }).code(404);
        }

        var data = {
          results: getResultsFromLinks(results.links),
          totalResults: results.total_results // TODO: Fix this value with the actual total results
        };

        reply(data);
      })
    }
});

server.route({
  method: 'GET',
  path: '/api/v1/compare/{q}/{cid}',
  handler: function(request, reply) {
    var query = request.params.q;
    var cid = request.params.cid;
    var id = cid.split('-').pop();
    var counter = 0;
    var data = {
      results: [],
      totalResults: 0
    };

    for(var i = 0; i < STORES.length; i += 1) {
      var store = STORES[i];
      var url = SEARCH_URL.replace('US/en', store);

      r(url + query + '?bucket=games&game_content_type=games,bundles&size=' + SEARCH_RESULT_SIZE, function(store) {
        var store = store;
        return function(err, response, body) {
          var results = JSON.parse(body);

          // if(results.links === undefined) {
          //   return reply({
          //     error: true,
          //     errorMessage: 'Oops. Looks like that URL is no longer available. Please contact the admin.',
          //     serviceResponse: results
          //   }).code(404);
          // }

          if(results.links && results.links.length) {
            // Find the link with ID
            results.links.forEach(function(link) {
              if(link.id.indexOf('-' + id) > -1) {
                var game = getResultsFromLinks([link])[0];
                game.store = store;
                game.country = store.split('/')[0];

                data.totalResults += 1;
                data.results.push(game);
              }
            });
          }

          if(++counter === STORES.length) {
            reply(data);
          }
        };
      }(store));
    }
  }
});

// Start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
