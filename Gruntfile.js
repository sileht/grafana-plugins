module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-tslint');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({

    clean: ["dist/*"],

    ts: {
      dist: {
          src: ['src/**/*.ts'],
          dest: 'dist/',
          options: {
              target: 'es5',
              module: 'commonjs',
              sourceMap: true,
              emitDecoratorMetadata: true,
              experimentalDecorators: true,
              removeComments: false,
              noImplicitAny: false,
          }
      },
    },

    tslint: {
      source: { files: { src: ['src/**/*.ts'] }},
      options: { configuration: 'tslint.json' }
    },

    copy: {
      sources: {
        cwd: 'src',
        expand: true,
        src: ['**/*.html'],
        dest: 'dist/'
      },
      staticContent: {
        expand: true,
        src: ['LICENSE', 'README.md', 'img/*', 'docs/*'],
        dest: 'dist/'
      },
      plugin: {
        src: [ 'plugin.json', 'README.md' ],
        dest: 'dist/'
      }
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'plugin.json'],
        tasks: ['default'],
        options: {spawn: false}
      }
    },

    karma: {
      test: {
        configFile: 'karma.conf.js'
      }
    },
  });

  grunt.registerTask('default', [
      'clean',
      'tslint',
      'copy:sources',
      'copy:plugin',
      'copy:staticContent',
      'ts:dist',
      'karma:test']);
};
