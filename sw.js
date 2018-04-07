const cacheName = "restaurant-rev-cache-v1";
const imgsCache = "restaurant-rev-imgs-v2";

const currentChaches = [cacheName, imgsCache];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll([
        'css/styles.css',
        'data/restaurants.json',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'js/sw_controller.js',
        'index.html',
        'restaurant.html'
      ]).then(function(){
          let req='https://normalize-css.googlecode.com/svn/trunk/normalize.css';
          return fetch(req, {"mode": "no-cors"}).then(function(response){
            cache.put(req, response);
          });
        });
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cName) {
          return cName.startsWith("restaurant-rev-") && !currentChaches.includes(cName);
        }).map(function (cName) {
          return caches.delete(cName);
        })
      );
    })
  );
});

self.addEventListener("fetch", function (event) {
  const requestURL = new URL(event.request.url);

  if(requestURL.origin===location.origin){

    if(requestURL.pathname==='/'){
      event.respondWith(caches.match('/index.html'));
      return;
    }

    if (requestURL.pathname.startsWith('/img/')) {
      event.respondWith(serveImg(event.request).catch(unavailable));
      return;
    }

    event.respondWith(caches.match(requestURL.pathname).then(function (response) {
      return response || fetch(event.request).catch(function(err){
        return new Response("Unavailable", {
          "status": 503,
          "statusText": "Service Unavailable"
        });
      });
    })
    );
    return;

  }

  event.respondWith(caches.match(event.request).then(function (response) {
    return response || fetch(event.request).catch(function(err){
      return new Response("Unavailable", {
        "status": 503,
        "statusText": "Service Unavailable"
      });
    });
  })
  );

  function serveImg(request) {
    const matchPath = requestURL.pathname.match(/^(.+)-(\d+)_(?:small|medium|large)\.jpg$/);
    const storageURL = matchPath[1];
    const imgSize = +matchPath[2];

    return caches.open(imgsCache).then(function (cache) {
      return cache.match(storageURL).then(function (response) {
        return response && greaterEq(response.url, imgSize) && response || fetch(request).then(function (nwResponse) {
          if(nwResponse.ok){
            cache.put(storageURL, nwResponse.clone());
            return nwResponse;
          }

          return response || nwResponse;

        }).catch(function(err){
          /* If we have smaller image in cache - serve it */
            return response || new Response("Unavailable", {
              "status": 503,
              "statusText": "Service Unavailable"
            });
        });

      });
    });
  }

  function greaterEq(responseUrl, imgSize) {
    return  Number(responseUrl.match(/-(\d+)_(?:small|medium|large)\.jpg$/)[1]) >= imgSize;
  }

  function unavailable(err){
    console.log(err);
      return new Response('Unavailable');
  }

});