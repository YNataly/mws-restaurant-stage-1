/* exported DBHelper */
/* global google, DBController */
/**
 * Common database helper functions.
 */
(function() {
  const db=new DBController();
  db.createDatabase();

  class DBHelper { // eslint-disable-line no-unused-vars
  /**
   * Database restaurants URL.
   * Change this to restaurants URL on your server.
   */
    static get DATABASE_URL_Restaurants() {
      const port = 1337; // Change this to your server port
      return `http://localhost:${port}/restaurants`;
    }

    /**
   * Database URL.
   * Change this to restaurants URL on your server.
   */
    static get DATABASE_URL() {
      const port = 1337; // Change this to your server port
      return `http://localhost:${port}`;
    }

    /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
    static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
        // Filter restaurants to have only given cuisine type
          const results = restaurants.filter(r => r.cuisine_type == cuisine);
          callback(null, results);
        }
      });
    }

    /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
        // Filter restaurants to have only given neighborhood
          const results = restaurants.filter(r => r.neighborhood == neighborhood);
          callback(null, results);
        }
      });
    }

    /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          let results = restaurants;
          if (cuisine !== 'all') { // filter by cuisine
            results = results.filter(r => r.cuisine_type == cuisine);
          }
          if (neighborhood !== 'all') { // filter by neighborhood
            results = results.filter(r => r.neighborhood == neighborhood);
          }
          callback(null, results);
        }
      });
    }

    /**
   * Fetch all neighborhoods with proper error handling.
   */
    static fetchNeighborhoods(callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
        // Get all neighborhoods from all restaurants
          const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
          // Remove duplicates from neighborhoods
          const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
   * Fetch all cuisines with proper error handling.
   */
    static fetchCuisines(callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
        // Get all cuisines from all restaurants
          const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
          // Remove duplicates from cuisines
          const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
   * Restaurant page URL.
   */
    static urlForRestaurant(restaurant) {
      return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
   * Restaurant image URL.
   */
    static imageUrlForRestaurant(restaurant) {
      try {
        const nameArr = restaurant.photograph.match(/([\w\d]*)(\.jpg)?/);
        let name = nameArr[1];
        return (`/img/${name}-500_medium.jpg`);
      } catch(err) {
        return '/img/restaurant.svg';
      }
    }

    /**
   * Restaurant image URL.
   */
    static imageUrls(restaurant) {
      try {
        const nameArr = restaurant.photograph.match(/([\w\d]*)(\.jpg)?/);
        let name = nameArr[1];
        return (`/img/${name}-320_small.jpg 320w, /img/${name}-400_small.jpg 400w, /img/${name}-500_medium.jpg 500w, /img/${name}-600_medium.jpg 600w, /img/${name}-800_large.jpg 800w`);
      } catch(err) {
        return '/img/restaurant.svg';
      }
    }

    /**
     * Create static map for restaurant(s)
     *  @callback initJSMapCallback - global function name that will be called to initialize google map
     */
    static createMap(restaurants, {zoom=12, center: {lat, lng}={lat: 40.722216, lng: -73.987501}, initJSMapCallback='initMap', addClickHandlerTo=[]}) {
      DBHelper.initJSMapCallback=initJSMapCallback;

      let setCenter=true;
      if (restaurants===undefined)
        restaurants=[];
      else if (!Array.isArray(restaurants))
        restaurants=[restaurants];

      self.restaurants=restaurants;

      if (restaurants.length>0) setCenter=false;

      const map=document.getElementById('map');

      const img=document.createElement('img');
      img.className='static-map-image';
      img.alt='Map with restaurants';
      img.title='Click/tap to get interactive map';

      let staticMapURLparts=[`https://maps.googleapis.com/maps/api/staticmap?size=${map.clientWidth}x${map.clientHeight}&format=png8&key=AIzaSyCDUCmKmlF1HiWbi2wL30F7tu8MfBfRsD4`];

      if (setCenter)
        staticMapURLparts.push(`center=${lat},${lng}&zoom=${zoom}`);

      restaurants.forEach((restaurant, ind) => {
        const label=restaurant.label===undefined? '' : `label:${restaurant.label}|`;
        staticMapURLparts.push(`markers=${label}${restaurant.latlng.lat},${restaurant.latlng.lng}`);
      });

      const imgURL=staticMapURLparts.join('&');
      const encodedURL=encodeURI(imgURL);
      const encodedURL2x=encodeURI(`${imgURL}&scale=2`);
      img.srcset=(`${encodedURL2x} 2x, ${encodedURL}`);
      img.src=encodedURL;

      img.onerror=(err) => {
        console.log(err);
        map.innerHTML='Map unavailable';
      };

      img.addEventListener('click', DBHelper.loadJSMaps);

      map.replaceChild(img, map.firstChild);

      const filterOptions=document.querySelector('#maincontent .filter-options');
      if (filterOptions)
        filterOptions.addEventListener('click', DBHelper.loadJSMaps);
    }

    static loadJSMaps(event) {
      if (!self.googleMap) {
        const script=document.createElement('script');
        script.src=`https://maps.googleapis.com/maps/api/js?libraries=places&callback=${DBHelper.initJSMapCallback}&key=AIzaSyCDUCmKmlF1HiWbi2wL30F7tu8MfBfRsD4`;
        document.head.appendChild(script);
      }
      let el=document.querySelector('#maincontent .filter-options');
      if (el)
        el.removeEventListener('click', DBHelper.loadJSMaps);

      el=document.querySelector('#map > .static-map-image');
      if (el)
        el.removeEventListener('click', DBHelper.loadJSMaps);
    }

    /**
   * Map marker for a restaurant.
   */
    static mapMarkerForRestaurant(restaurant, map) {
      const marker = new google.maps.Marker({
        position: restaurant.latlng,
        label: restaurant.label,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP}
      );
      return marker;
    }
  }

  DBHelper.dbURL=new URL(DBHelper.DATABASE_URL_Restaurants);

  /**
   * Fetch all restaurants.
   */
  DBHelper.fetchRestaurants = (function() {
    let result;
    let isRejected=true;

    return function(callback) {
      if (isRejected) {
        isRejected=false;
        result=db.getAllRestaurants().then(restaurants => {
          if (restaurants && restaurants.length>0) {
            return restaurants;
          } else return fetch(DBHelper.DATABASE_URL_Restaurants).then(resp => {
            if (resp.status === 200) { // Got a success response from server!
              return resp.json().then(restaurants => {
                db.addRestaurants(restaurants);
                return restaurants;
              });
            } else { // Got an error from server!
              const error = `Request failed. Returned status of ${resp.status}`;
              throw new Error(error);
            }
          });
        }).catch(err => {
          isRejected=true;
          console.log(err);
          throw err;
        });
      }
      return result.then(restaurants => callback(null, restaurants)).catch(error => callback(error, null));
    };
  })();

  /**
   * Fetch a restaurant info by its ID.
   */
  DBHelper.fetchRestaurantById = (function() {
    let result;
    let isRejected=true;

    return function(id) {
      if (isRejected) {
        isRejected=false;
        result=db.getRestaurantInfo(id).then(restaurant => {
          return restaurant || fetch(DBHelper.DATABASE_URL_Restaurants+`/${id}`).then(resp => {
            if (resp.status === 200) { // Got a success response from server!
              return resp.json().then(restaurant => {
                db.addRestaurantInfo(restaurant);
                return restaurant;
              });
            } else { // Got an error from server!
              const error = `Request failed. Returned status of ${resp.status}`;
              throw new Error(error);
            }
          });
        }).catch(err => {
          isRejected=true;
          console.log(err);
          throw err;
        });
      }
      return result;
    };
  })();

  /**
   * Fetch a restaurant reviews by restaurant ID.
   */
  DBHelper.fetchRestaurantReviews = (function() {
    let result;
    let isRejected=true;

    return function(id) {
      if (isRejected) {
        isRejected=false;
        result=db.getRestaurantReviews(id).then(reviews => {
          return reviews || fetch(DBHelper.DATABASE_URL+`/reviews/?restaurant_id=${id}`).then(resp => {
            if (resp.status === 200) { // Got a success response from server!
              return resp.json().then(reviews => {
                db.addRestaurantReviews(reviews);
                return reviews;
              });
            } else { // Got an error from server!
              const error = `Request failed. Returned status of ${resp.status}`;
              throw new Error(error);
            }
          });
        }).catch(err => {
          isRejected=true;
          console.log(err);
          throw err;
        });
      }
      return result;
    };
  })();

  /**
   * Add restaurant review
   */
  DBHelper.addhRestaurantReview = (function() {
    // let result;

    return function(review) {
      db.addRestaurantReview(review).then(() => {
        return fetch(DBHelper.DATABASE_URL+`/reviews/`,
          { method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(review)});
      }).then(resp => {
        if (resp.status === 200) {
          return resp.json().then(rev => { console.log(rev); });
        } else { // Got an error from server!
          const error = `Request failed. Returned status of ${resp.status}`;
          throw new Error(error);
        }
      }).catch(err => {
        console.log(err);
        throw err;
      });
    };
  })();

  self.DBHelper=DBHelper;
})();
