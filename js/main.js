/* global DBHelper, google */

/* var restaurants;
var neighborhoods;
var  cuisines;
var map;
 */

self.markers = [];
self.Router.add('index', function() {
  /**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

/*
self.Router.addOnLoad('index', event => {
  DBHelper.createMap(self.restaurants, {zoom: 12, center: {lat: 40.722216, lng: -73.987501}});
   const script=document.createElement('script');
  script.src='https://maps.googleapis.com/maps/api/js?libraries=places&callback=initMap';
  document.body.appendChild(script);
});
*/

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = (restaurants=self.restaurants) => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  try {
    self.googleMap = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });

    addMarkersToMap(restaurants);
  } catch(err) {
    console.error('Map init error: ' + err);
    DBHelper.createMap(restaurants, {zoom: 12, center: {lat: 40.722216, lng: -73.987501}, initJSMapCallback: 'initMap'});
  }
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      if (self.googleMap)
        addMarkersToMap(restaurants);
      else
        DBHelper.createMap(restaurants, {zoom: 12, center: {lat: 40.722216, lng: -73.987501}, initJSMapCallback: 'initMap'});
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];

  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length=labels.length;
  restaurants.forEach((restaurant, ind) => { restaurant.label=labels[ind % length]; });

  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  const fragment=document.createDocumentFragment();
  restaurants.forEach(restaurant => {
    fragment.append(createRestaurantHTML(restaurant));
  });
  ul.appendChild(fragment);
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageUrls(restaurant);
  image.sizes = '(min-width: 1242px) 400px, (min-width: 800px) 33vw, (min-width: 540px) 49vw,  100vw';
  image.alt = `Restaurant ${restaurant.name}`;
  image.onload=() => { li.prepend(image); };

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  if (restaurant.label) {
    neighborhood.innerHTML= `${restaurant.neighborhood} <span>${restaurant.label}</span>`;
  } else
    neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants) => {
  if (!self.googleMap || !restaurants) return;

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.googleMap);
    if (marker) {
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url;
      });

      self.markers.push(marker);
    }
  });
};
