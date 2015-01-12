'use strict';

angular.module('meta', [])
  .provider('Meta', function() {

    var routes = {};
    var otherwise = {
      title: '',
      description: ''
    };

    /**
     * Get meta info for a given route.
     * @param  {string} location the url to get meta info for.
     * @return {object} object w/ meta info.
     * @todo add some abstraction to make more readable.
     */
    var getInfo = function(location) {
      var info = {}, placeholder = [];
      // Set info eq to the the default value, and override it
      // if we have a route match. Use a loop to kill the reference
      // to the otherwise object.
      for (var otherwiseKey in otherwise) {
        info[otherwiseKey] = otherwise[otherwiseKey];
      }

      // Split the location path into an array of args.
      location = location.split('/').filter(Boolean);

      // Itterate through each route added via the public when() method.
      var routeKeys = Object.keys(routes);
      for (var i = 0, len = routeKeys.length; i < len; i+=1) {
        // Split the route into an array of args.
        var route = routeKeys[i].split('/').filter(Boolean);

        // Matching routes need to have the same number of
        // arguments as the location url.
        if ( route.length !== location.length ) {
          continue;
        }

        // Itterate through each route arg to check for a match.
        var match = true;
        for (var ii = 0, length = route.length; ii < length; ii+=1) {
          // If the route arg is a placeholder.
          if ( route[ii].indexOf(':')  === 0 ) {
            placeholder[ii] = route[ii];
            continue;
          }
          // If the route does not match the location and
          // there is not a wildcard in the route.
          if ( route[ii] !== location[ii] && route[ii].indexOf('*') === -1 ) {
            match = false;
            placeholder = [];
            break;
          }
        }

        if (match) {
          // We could simply set info = routes[ routeKeys[i] ]
          // but this would cause reference problems that occur when
          // replacing the placeholder values for the title and description.
          // This is a safer, and native, alternative to cloning the object.
          for ( var key in routes[ routeKeys[i] ] ) {
            info[key] = routes[ routeKeys[i] ][key];
          }
          break;
        }
      }

      // Replace placeholders in meta info and meta description strings.
      if ( placeholder.length > 0 ) {
        for (var placeholderKey in placeholder) {
          for (var infoKey in info) {
            info[infoKey] = info[infoKey].split(placeholder[placeholderKey]).join(location[placeholderKey]);
          }
        }
      }

      return info;
    };

    // Configurable options. More can be added in the future.
    this.options = {};

    /**
     * Strings to prepend and / or append to the title tag.
     * @type {Object}
     */
    this.options.title = {
      prefix: '',
      suffix: ''
    };

    /**
     * Register meta info for a specific route.
     * @param  {string} path the path to match routes against.
     * Placeholders beginning with ':' are accepted.
     * @param  {object} info meta title and description.
     * @return {object} this
     */
    this.when = function(path, info) {
      routes[path] = info;
      return this;
    };

    /**
     * Register default values for title and description if
     * no routes are matched.
     * @param  {object} info the default meta title and description.
     * @return {object} this
     */
    this.otherwise = function(info) {
      otherwise = info;
      return this;
    };

    this.$get = ['$rootScope', '$location',
    function($rootScope, $location) {
      var self = this;

      var update = function() {
        var info = getInfo( $location.path() );
        $rootScope.meta.title = self.options.title.prefix + info.title + self.options.title.suffix;
        $rootScope.meta.description = info.description;
      };

      return {
        init: function() {
          $rootScope.meta = {};
          $rootScope.$on('$routeChangeSuccess', update);
        },
        // Return current meta title and description.
        get: function() {
          return $rootScope.meta;
        },
        // Add additional meta info items, e.g. via controllers,
        // later in execution.
        add: function(path, info) {
          self.when(path, info);
          update();
          return self;
        }
      };

    }];

  });