/* eslint-env serviceworker */

(function() {
  const cacheName = 'restaurant-rev-cache-v4';
  const imgsCache = 'restaurant-rev-imgs-v4';

  const currentCaches = [cacheName, imgsCache];
  //
  const defaultRestaurantImg='img/restaurant.svg';
  const icons=['img/restaurants-icon-48.png', 'img/restaurants-icon-192.png', 'img/restaurants-icon-512.png'];

  self.addEventListener('install', function (event) {
    const jsfiles=['js/idb.js', 'js/indexed.js', 'js/dbhelper.js', 'js/main.js', 'js/restaurant_info.js', 'js/sw_controller.js', 'js/router.js'];
    const cssfiles=['css/normalize.css', 'css/styles.css'];

    event.waitUntil(
      Promise.all([caches.open(cacheName).then(function (cache) {
        return cache.addAll([
          ...cssfiles,
          ...jsfiles,
          'index.html',
          'restaurant.html',
          'mws-manifest.json'
        ]);
      }),
      caches.open(imgsCache).then(function (cache) {
        return cache.addAll([
          defaultRestaurantImg,
          ...icons
        ]);
      })])
        .catch(err => { console.error(`from sw: ${err}`); return Promise.reject(err); })
    );
  });

  self.addEventListener('activate', function (event) {
    event.waitUntil(
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.filter(function (cName) {
            return cName.startsWith('restaurant-rev-') && !currentCaches.includes(cName);
          }).map(function (cName) {
            return caches.delete(cName);
          })
        );
      })
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
        event.respondWith(serveImg(event.request, requestURL).catch(unavailable));
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
    }
    event.respondWith(fetch(event.request).catch(unavailable));
  });

  function serveImg(request, requestURL) {
    const path= requestURL.pathname || requestURL;
    const matchPath = path.match(/^(?:(.+)-(\d+)_(?:small|medium|large)\.jpg)|(?:.+\.svg)|(?:.+\.png)$/);
    const storageURL = matchPath[1] || matchPath[0];
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
          return response || (storageURL === defaultRestaurantImg? new Response('Unavailable', {
            'status': 503,
            'statusText': 'Service Unavailable'
          }) : serveImg(defaultRestaurantImg, defaultRestaurantImg));
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
})();
