/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          //  engine: 'gm',
          sizes: [{
            width: 800,
            suffix: '_large',
            quality: 80

          }, {
            width: 600,
            suffix: '_medium',
            quality: 80

          }, {
            width: 500,
            suffix: '_medium',
            quality: 80

          },  {
            width: 400,
            suffix: '_small',
            quality: 80

          },  {
            width: 320,
            suffix: '_small',
            quality: 80

          }  ]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img-src/',
          dest: 'img/'
        }]
      }
    },


    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img']
        },
      },
    }

  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'responsive_images']);

};
