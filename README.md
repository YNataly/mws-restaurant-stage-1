# Restaurant Reviews
Progressive mobile-ready web application with offline experience for restaurant reviews.
- - -

## Project dependency

Project gets restaurants data from [__Local Development API Server__](https://github.com/udacity/mws-restaurant-stage-2) running at [localhost:1337](http://localhost:1337)

Follow instructions in [__Local Development API Server__](https://github.com/udacity/mws-restaurant-stage-2) github repository, to install and run this server locally.

- - -

##  Install project

   ### 1. Clone or download project
   ```git clone https://github.com/YNataly/mws-restaurant-stage-1.git```

   - - -

   ### 2. Install dependencies

   1. Project requires:
        - [node Version v6.11.1](https://nodejs.org/en/) and [npm]        (https://www.npmjs.com/get-npm) installed
        - [gulp-cli](https://gulpjs.org/getting-started) installed globally

          >  If you have previously installed a version of gulp globally, please         run npm rm --global gulp to make sure your old version doesn't collide         with gulp-cli.

          ```npm install --global gulp-cli```

   2. Navigate to project root directory and run

        ```npm install```
   - - -
   ### 3. Build project assets and run local server

   - To create a development version (without minification) run:

       ```gulp```

       It will create a __build__ directory.

   - To create a production version (with minified js and css) run:

       ```gulp prod```

       It will create a __dist__ directory.

Both commands run local Browsersync server at [localhost:3000](http://localhost:3000)
   - - -
## Run project from local machine

   - If you have assets in __build__ directory, you can run local server at [localhost:3000](http://localhost:3000) to serve them with command:

       ```npm run serve-dev```

    - If you have assets in __prod__ directory, you can run local server at [localhost:3000](http://localhost:3000) to serve them with command:

       ```npm run serve```
- - -
## Troubleshooting
- All commands should be run from project root directory.
- When development version is created (using `gulp` command), script uses cache file cache.images.json . If image(s) doesn't copied to target __build__ directory, remove cache by run:

    `gulp clean-cache`

    (Then run `gulp` command again.)
- When development version is created (using `gulp` command), existing __./build/img__ directory is preserved. If you want clean it during project build (e.g. if you removed some images from __./img-src__ directory), run:

   `gulp clean-dev`

   ( instead of `gulp` )






