/* eslint-env serviceworker */
const DBController=require('./js/indexed.js');
//
const cacheName = 'restaurant-rev-cache-v3';
const imgsCache = 'restaurant-rev-imgs-v3';

const currentChaches = [cacheName, imgsCache];

const db=new DBController();
const port=1337;
const dbAPIURL=new URL(`http://localhost:${port}/restaurants`);
//
const defaultRestaurantImg='img/restaurant.svg';
const defaultRestaurantImgName=defaultRestaurantImg.match(/^.*\/([^/]+)\.svg$/i)[1];

self.addEventListener('install', function (event) {
  const jsfiles=['js/dbhelper.js', 'js/main.js', 'js/restaurant_info.js', 'js/sw_controller.js', 'js/router.js'];
  const cssfiles=['css/normalize.css', 'css/styles.css'];

  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll([
        ...cssfiles,
        ...jsfiles,
        'index.html',
        'restaurant.html',
        defaultRestaurantImg
      ]);
    }).catch(err => { console.error(`from sw: ${err}`); return Promise.reject(err); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([db.createDatabase(),
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.filter(function (cName) {
            return cName.startsWith('restaurant-rev-') && !currentChaches.includes(cName);
          }).map(function (cName) {
            return caches.delete(cName);
          })
        );
      })])
  );
});

self.addEventListener('fetch', function (event) {
  const requestURL = new URL(event.request.url);

  if (requestURL.origin === location.origin) {
    if (requestURL.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }

    if (requestURL.pathname.startsWith('/img/')) {
      event.respondWith(serveImg(event.request).catch(unavailable));
      return;
    }

    event.respondWith(caches.match(requestURL.pathname).then(function (response) {
      return response || fetch(event.request).catch(function () {
        return new Response('Unavailable', {
          'status': 503,
          'statusText': 'Service Unavailable'
        });
      });
    })
    );
    return;
  } else if (requestURL.origin === dbAPIURL.origin) {
    const pathParts=requestURL.pathname.match(/^\/(restaurants)(?:\/([^/]+))?$/i);
    const restId=+pathParts[2];

    if (pathParts) {
      if (restId) {
        // request for restaurant info
        event.respondWith(
          db.getRestaurantInfo(restId).then(info => {
            // console.log(info);
            if (!info) {
              return fetch(event.request).then(resp => {
                db.addRestaurantInfoFromResponse(resp.clone(), restId);
                return resp;
              });
            } else { // return existing in db restaurant info and update db
              fetch(event.request).then(resp => { db.addRestaurantInfoFromResponse(resp, restId); });
              return new Response(JSON.stringify(info), {'status': 200});
            }
          }).catch(unavailable));
      } else {
        // request for all restaurants
        event.respondWith(
          db.getAllRestaurants().then(allRest => {
            // console.log(allRest);
            if (!allRest || allRest.length===0) {
              return fetch(event.request).then(resp => {
                db.addRestaurantsFromResponse(resp.clone());
                return resp;
              });
            } else { // return existing in db restaurants and update db
              fetch(event.request).then(resp => { db.addRestaurantsFromResponse(resp); });
              return new Response(JSON.stringify(allRest), {'status': 200});
            }
          }).catch(unavailable));
      }
    } else {
      // request that not in indexedDB
      event.respondWith(fetch(event.request).catch(unavailable));
    }
    return;
  }

  event.respondWith(caches.match(event.request).then(function (response) {
    return response || fetch(event.request).catch(function () {
      return new Response('Unavailable', {
        'status': 503,
        'statusText': 'Service Unavailable'
      });
    });
  })
  );

  function serveImg(request) {
    const matchPath = requestURL.pathname.match(/^(.+)(?:-(\d+)_(?:small|medium|large)\.jpg|\.svg)$/);
    const storageURL = matchPath[1];
    const imgSize = +matchPath[2];

    return caches.open(imgsCache).then(function (cache) {
      return cache.match(storageURL).then(function (response) {
        return response && (isNaN(imgSize) || greaterEq(response.url, imgSize)) && response || fetch(request).then(function (nwResponse) {
          if (nwResponse.ok) {
            cache.put(storageURL, nwResponse.clone());
            return nwResponse;
          }

          if (response) return response;
          throw new Error(nwResponse);
        }).catch(function (err) {
          /* If we have smaller image in cache - serve it, otherwise serve restaurant.svg */
          return response || (storageURL === defaultRestaurantImgName? new Response('Unavailable', {
            'status': 503,
            'statusText': 'Service Unavailable'
          }) : serveImg(defaultRestaurantImg));
        });
      });
    });
  }

  function greaterEq(responseUrl, imgSize) {
    return Number(responseUrl.match(/-(\d+)_(?:small|medium|large)\.jpg$/)[1]) >= imgSize;
  }

  function unavailable(err) {
    console.log(err);
    return new Response('Unavailable', {'status': 503});
  }
});
