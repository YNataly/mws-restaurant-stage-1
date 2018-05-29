/* globals idb */
/* exported DBController */

class DBController { // eslint-disable-line no-unused-vars
  constructor() {
    this.db_name='restaurants';
    this.restaurantsStore='restaurants';
    this.restaurantInfo='restaurant-info';
  }

  createDatabase() {
    if (!('indexedDB' in self)) {
      console.log('This browser doesn\'t support IndexedDB');
      return Promise.resolve();
    }

    const dbController=this;

    dbController.dbPromise = idb.open(dbController.db_name, 1, function(upgradeDB) {
      try {
        switch (upgradeDB.oldVersion) {
          case 0: if (!upgradeDB.objectStoreNames.contains(dbController.restaurantsStore))
            upgradeDB.createObjectStore(dbController.restaurantsStore, {keyPath: 'id'});

            if (!upgradeDB.objectStoreNames.contains(dbController.restaurantInfo))
              upgradeDB.createObjectStore(dbController.restaurantInfo, {keyPath: 'id'});
        }
      } catch(err) {
        console.log(`Error in Update db: ${err}`);
      }
    })
      .then(db => {
        db._db.onclose=() => { console.log('db closed'); dbController.dbPromise=undefined; };
        return db;
      });

    return dbController.dbPromise;
  }

  openDB() {
    if (!this.dbPromise) {
      return this.createDatabase();
    }

    return this.dbPromise;
  }

  addRestaurants(jsonArr) {
    const dbController=this;

    return dbController.openDB().then(db => {
      const tx=db.transaction(dbController.restaurantsStore, 'readwrite');
      const store=tx.objectStore(dbController.restaurantsStore);
      return Promise.all(jsonArr.map(item => store.put(item)))
        // .then(() => console.log(`Restaurants (${jsonArr.length}) added/updated to db`))
        .catch(err => {
          tx.abort();
          throw new Error(`Error during adding restautrants to db. ${err}`);
        });
    }).catch(err => console.log(err));
  }

  /* addRestaurantsFromResponse(response) {
    if (response.status!== 200) {
      console.log(`Can't add restaurants to db. Response status:  ${response.status}`);
      return;
    }

    const dbController=this;
    return response.json().then(restaurants => dbController.addRestaurants(restaurants))
      .catch(err => console.log(err));
  } */

  addRestaurantInfo(data) {
    const dbController=this;

    return dbController.openDB().then(db => {
      const tx=db.transaction(dbController.restaurantInfo, 'readwrite');
      const store=tx.objectStore(dbController.restaurantInfo);
      store.put(data);
      return tx.complete;
    })
      // .then(() => console.log(`restaurant ${data.id} info added/updated`))
      .catch(err => console.error(`Error during adding restautrant ${data.id} info to db. ${err}`));
  }

  /* addRestaurantInfoFromResponse(response, restId) {
    if (response.status!== 200) {
      console.log(`Can't add restaurant ${restId} info to db. Response status:  ${response.status}`);
      return;
    }

    const dbController=this;
    return response.json().then(restaurant => dbController.addRestaurantInfo(restaurant))
      .catch(err => console.log(err));
  } */

  getAllRestaurants() {
    const dbController=this;

    return dbController.openDB().then(db => {
      const tx=db.transaction(dbController.restaurantsStore, 'readonly');
      return tx.objectStore(dbController.restaurantsStore).getAll();
    })
      .catch(err => console.error(`Error during get restautrants from db. ${err}`));
  }

  getRestaurantInfo(id) {
    const dbController=this;

    return dbController.openDB().then(db => {
      const tx=db.transaction(dbController.restaurantInfo, 'readonly');
      return tx.objectStore(dbController.restaurantInfo).get(id);
    })
      .catch(err => console.error(`Error during get restautrant ${id} info from db. ${err}`));
  }
}
