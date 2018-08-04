/* globals  google, DBHelper */
(function() {
  let restaurantId;

  /* Fetch restaurant info when page loaded */
  self.Router.add('restaurant', event => {
    fetchRestaurantFromURL().then(rest => {
      if (!rest) return;
      restaurantId=rest.id;
      fillBreadcrumb(rest);
      fillRestaurantHTML(rest);

    /* if (self.googleMap) {
      self.marker = DBHelper.mapMarkerForRestaurant(rest, self.googleMap);
    } */
    }).catch(err => console.error(err));
  });

  /*
self.Router.addOnLoad('restaurant', event => {
  const script=document.createElement('script');
  script.src='https://maps.googleapis.com/maps/api/js?libraries=places&callback=initMapForRestaurant';
  document.body.appendChild(script);
}); */

  /**
 * Initialize Google map
 */
  window.initMapForRestaurant = (restaurants=self.restaurants) => {
    const restaurant = restaurants[0];
    try {
      self.googleMap = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      self.marker = DBHelper.mapMarkerForRestaurant(restaurant, self.googleMap);
    } catch(err) {
      console.error('Map init error: ' + err);
      DBHelper.createMap(restaurant, {zoom: 16, center: {lat: restaurant.latlng.lat, lng: restaurant.latlng.lng}, initJSMapCallback: 'initMapForRestaurant'});
    }
  };

  /**
 * Get current restaurant from page URL.
 */
  const fetchRestaurantFromURL = function() {
    const id = Number(getParameterByName('id'));
    if (isNaN(id)) { // no id found in URL
      throw new Error('No restaurant id in URL');
    }
    return DBHelper.fetchRestaurantById(id).then(restaurant =>
      DBHelper.fetchRestaurantReviews(id).then(reviews => {
        restaurant.reviews=reviews;
        return restaurant;
      }));
  };

  /**
 * Create restaurant HTML and add it to the webpage
 */
  const fillRestaurantHTML = (restaurant) => {
    const fragment = document.createDocumentFragment();

    /*   <main id="maincontent" class="restaurant-info">
    <!-- Beginning restaurant -->
    <section id="restaurant-container">
      <h2 id="restaurant-name"></h2>
      <img id="restaurant-img">
      <p id="restaurant-cuisine"></p>
      <p id="restaurant-address"></p>
      <table id="restaurant-hours"></table>
    </section>
    <!-- end restaurant -->
    <!-- Beginning reviews -->
    <section id="reviews-container">
      <ul id="reviews-list"></ul>
    </section>
    <!-- End reviews --> */

    let section=document.createElement('section');
    section.id='restaurant-container';

    let el=document.createElement('h2');
    el.innerHTML = restaurant.name;
    el.id='restaurant-name';
    section.appendChild(el);

    el=document.createElement('img');
    el.id='restaurant-img';
    el.className = 'restaurant-img';
    el.src = DBHelper.imageUrlForRestaurant(restaurant);
    el.srcset= DBHelper.imageUrls(restaurant);
    el.sizes='(min-width: 1400px) 800px, (min-width: 1000px) 60vw,  (min-width: 820px) 55vw, (min-width: 590px) 80vw,  100vw';
    el.alt=`Restaurant ${restaurant.name}`;
    // const image=el;
    section.appendChild(el);

    el=document.createElement('p');
    el.innerHTML = restaurant.cuisine_type;
    el.id='restaurant-cuisine';
    section.appendChild(el);

    el=document.createElement('p');
    el.innerHTML = restaurant.address;
    el.id='restaurant-address';
    section.appendChild(el);

    el=document.createElement('table');
    el.id='restaurant-hours';
    if (restaurant.operating_hours) {
      fillRestaurantHoursHTML(el, restaurant.operating_hours);
    }
    section.appendChild(el);

    fragment.appendChild(section);

    section=document.createElement('section');
    section.id='reviews-container';

    fillReviewsHTML(section, restaurant.reviews);

    fragment.appendChild(section);

    document.getElementById('maincontent').prepend(fragment);

    // add event listeners for reviews form
    // handle Enter on Name field
    document.getElementById('user-name').addEventListener('keydown', handleKeydown);

    // handle rating changing using keyboard
    document.getElementById('rating-radiogroup').addEventListener('keydown', handleRatingKeydown);

    // handle form submit
    document.getElementById('review-form').addEventListener('submit', submitReview);

    DBHelper.createMap(restaurant, {zoom: 16, center: {lat: restaurant.latlng.lat, lng: restaurant.latlng.lng}, initJSMapCallback: 'initMapForRestaurant'});
  };

  const keyCode = Object.freeze({
    'RETURN': 13,
    'SPACE': 32,
    'END': 35,
    'HOME': 36,
    'LEFT': 37,
    'UP': 38,
    'RIGHT': 39,
    'DOWN': 40
  });

  const handleKeydown=function(event) {
    if (event.keyCode!== keyCode.RETURN)
      return;
    if (event.target.id==='user-name') {
      document.querySelector('#rating5 + label').focus();
      event.preventDefault();
    }
  };

  const handleRatingKeydown=function(event) {
    if (event.target.tagName==='LABEL') {
      switch (event.keyCode) {
        case keyCode.SPACE:
        case keyCode.RETURN:
          document.getElementById(event.target.htmlFor).checked='checked';
          event.preventDefault();
          document.getElementById('comments').focus();
          break;
      }
    }
  };

  /** Add restaurant review to IndexedDB database and send review to server
 * add review id to not-send ObjectStore until it was successfully send to server
*/
  const submitReview=function(event) {
    console.log('form submision');
    let review={};
    const form=document.forms['user-review'];
    review.name=form.elements['user-name'].value;
    review.rating=+form.querySelector('input[name="rating"]:checked').value;
    review.comments=form.elements['comments'].value;
    review.restaurant_id=restaurantId;

    DBHelper.addhRestaurantReview(review);
  };

  /**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
  const fillRestaurantHoursHTML = (hours, operatingHours) => {
    let row;
    for (let key in operatingHours) {
      row = document.createElement('tr');
      row.innerHTML=`<td>${key}</td><td>${operatingHours[key]}</td>`;

      hours.appendChild(row);
    }
  };

  /**
 * Create all reviews HTML and add them to the webpage.
 */
  const fillReviewsHTML = (container, reviews) => {
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }

    const ul = document.createElement('ul');
    ul.id='reviews-list';
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  };

  /**
 * Create review HTML and add it to the webpage.
 */
  const createReviewHTML = (review) => {
    const li = document.createElement('li');
    const header = document.createElement('header');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    name.className='name';
    header.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    date.className='date';
    header.appendChild(date);

    li.appendChild(header);

    const content = document.createElement('div');
    content.className='content';

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    rating.className='rating';
    content.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    comments.className='comments';
    content.appendChild(comments);

    li.appendChild(content);

    return li;
  };

  /**
 * Add restaurant name to the breadcrumb navigation menu
 */
  const fillBreadcrumb = (restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
  };

  /**
 * Get a parameter by name from page URL.
 */
  const getParameterByName = (name, url) => {
    if (!url)
      url = window.location.href;
    name = name.replace(/[[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results)
      return null;
    if (!results[2])
      return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };
})();
