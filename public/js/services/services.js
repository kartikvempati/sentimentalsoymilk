// these services can be loaded into any controller by including 'app.services' in the
// angular dependencies
angular.module('app.services',[])

// Include ActivitiesData in controller paramters to access these factory
// functions
.factory('ActivitiesData', function($http, $location){
  // data stores all of the service functions
  var data = {};
  data.searchedCity = {};
  data.cityCache = {};

  // <h4>data.getActivities</h4>
  // Function that sends a get request to /activities/`cityname`
  // and retrieves 30 foursquare top rated activities for the city
  // returns a promise
  data.getActivities = function(city){
    //checks if the city has been searched before
    if(data.searchedCity[city]){
      //sends a callback with the cache data
      return data.cityCache[city]
    }
    //call get request to our server, with the city
    return $http.get('/activities/' + city)
    .then(function(results){
      //our server calls a get request to the foursquare api
      //posts it to our database
      //gets data back out of our database and returns it
      console.log('getActivities success data: ', results)
      data.searchedCity[city] = true;
      data.cityCache[city] = results;
      return results;
    })
    .catch(function(err){
      console.log("Error Getting Activity Data: ", err)
    })
  };

  data.photoSizes = {
    //s small 75 x 75
    "small" : "_s.jpg",
    //q large 150 x 150
    "large" : "_q.jpg",
    //t thumbnail 100 on longest side
    "thumbnail" : "_t.jpg",
    // m  medium, 240 on longest side
    "medium" : "_m.jpg",
    // n  small, 320 on longest side
    320 : "_n.jpg",
    // -  medium, 500 on longest side
    500 : "_-.jpg",
    // z  medium 640, 640 on longest side
    640 : "_z.jpg",
    // c  medium 800, 800 on longest side†
    800 : "_c.jpg",
    // b  large, 1024 on longest side*
    "large" : "_b.jpg",
    // h  large 1600, 1600 on longest side†
    1600 : "_h.jpg",
    // k  large 2048, 2048 on longest side†
    2048 : "_k.jpg",

  }

  data.getPhotos = function(city, callback){
    return $http.get('/photos/' + city)
    .then(function(results){
      console.log("get photos for " + city)
      callback(results.data)
    })
    .catch(function(err){
      console.log("error finding photos", err)
    })
  }

  data.makePhotos = function(photos, size){
    return _.map(photos, function(photoObj){
      return photoObj.photoUrl + data.photoSizes[size]
    })
  }

  // <h4>data.getTrips</h4>
  // Function that sends a get request to /trips and retrieves
  // all trips from the db

  //since the data is stringified before it is sent to the server
  //we need to parse it when it comes back
  var parseTrips = function(trips){
    for(var i = 0; i < trips.data.length; i++){
      var parsedActivities = []
      var trip = trips.data[i]
      trip.activities = JSON.parse(trip.activities)
    }
    return trips
  }

  data.getTrips = function(){
    return $http.get('/trips')
    .then(function(results){
      return parseTrips(results);
    })
    .catch(function(err){
      console.log("Error Getting User Trip Data: ", err)
    })
  };

  data.getMyTrips = function() {
    return $http.get('/api/user/trips/')
    .then(function(results) {
      return parseTrips(results);
    })
    .catch(function(err) {
      console.log('Error Getting my Trips Data: ', err);
    });
  };

  // <h4>data.getUsersTrips</h4>
  // Function that retrieves all of one users stored trips
  // sends get request to /trips/`userId`
  data.getUsersTrips = function(userId, callback){
    $http.get('/trips/' + userId)
    .then(function(results){
      //our server calls a get request to the foursquare api
      //posts it to our database
      //gets data back out of our database and returns it
      console.log('Trip Results for ' +userId +': ' + results)
      return results;
    })
    .catch(function(err){
      console.log("Error Getting User Trip Data: ", err)
    })
  };

  // <h4>data.getIndividualTrip</h4>
  // pulls an trip from the db with the tripId
  // sends get request to /trips/`tripId`
  data.getIndividualTrip = function(tripId){
    $http.get('/trips/' + tripId)
    .then(function(results){
      // server calls a get request to the foursquare api
      // posts it to our database
      // gets data back out of our database and returns it
      console.log('Trip Result for ' + tripId +': ' + results)
      callback(results);
    })
    .catch(function(err){
      console.log("Error Getting Individual Trip Data: ", err)
    })
  };

  // <h4>data.createTrip</h4>
  // creates a trip and stores it to the db
  data.createTrip = function(tripData){
    //tripData is a JSON object
    $http.post('/trips', tripData)
    .then(function(){
      console.log("Trip Created");
      $location.path('/myTrips');
    })
    .catch(function(err){
      console.log("Error Creating Trip: ", err);
    })
  };

  // <h4>data.getTripActivities</h4>
  // retrieves an object containing all activities and data related
  // to the trip id
  data.getTripActivities = function(id, cb){
    return $http.get('/trips/' + id)
    .then(function(results){
      console.log('trip data: ', results.data)
      var trip = results.data
      trip.activities = JSON.parse(trip.activities)
      //our server calls a get request to the foursquare api
      //posts it to our database
      //gets data back out of our database and returns it
      cb(trip);
    })
    .catch(function(err){
      console.log("Error Getting User Trip Data: ", err)
    })
  };

  return data;
})



// this factory is for authentication which is not impemented in the app yet.
.factory('Auth', function($http, $location, $rootScope){
  var auth = {};
  auth.user = { password : '' };
  auth.pass = '';

  auth.clearPassword = function() {
    auth.user.password = '';
    auth.pass = '';
  };

  auth.login = function(user) {
    return $http.post('/api/login', user)
      .then(function(result){
        console.log("Auth Login Hit")
        if(result.data){
          console.log("login results", result)
          console.log("Username", user.username)
          auth.getUser(user.username)
          .then(function() {
            auth.clearPassword();
            $location.path("/myTrips");
          });
        } else {
          //stay on login
          var loginError = "Please Try Again"
          return loginError;
        }
      })
  };

  auth.signup = function(userData) {
    auth.pass = userData.password;
    return $http.post('/api/signup', userData)
    .then(function(result){
      if(Array.isArray(result.data)){
        var signUpError = "Username Taken";
        return signUpError;
      } else {
        auth.user = result.data;
        auth.user.password = auth.pass;
        auth.login(auth.user);
      }
      //redirect
    })
  };

  auth.getUser = function(username) {
    return $http.get('/api/user/'+ username)
    .then(function(result){
      console.log("Result of getUser", result.data)
      auth.user = result.data;
    })
  };

  auth.checkLoggedin = function() {
    return $http.get('/api/loggedin').then(function(user) {
      if (user) {
        $rootScope.user = user;
      }
    }, function(err) {
      console.log('error authentcating user', err);
      $location.url('/login');
    });
  };


  return auth;
})

.factory('Map', function($http, uiGmapGoogleMapApi) {
  var map = {};

  map.createMap = function(options) {
    var createdMap;
    return uiGmapGoogleMapApi.then(function(maps) {
      //console.log('maps!', maps);
      createdMap = options;
      return createdMap;
    });
  };

  //takes a geoObj with lat/lng props and returns city info back
  map.getCityfromGeo = function(geoObj) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + geoObj.lat + ',' + geoObj.lng + '&key=' + 'AIzaSyARvAlQKAAFI-gVlcKeSFhWNrhcpVLllWc';
    return $http.get(url)
    .then(function(results) {
      //console.log('geo get',results.data.results.reverse()[0]);
      var returnGeoObj = {};

      returnGeoObj.lat = geoObj.lat;
      returnGeoObj.lng=geoObj.lng;

      if (results.data.results[0].address_components[2] !== undefined) {
        returnGeoObj.city = results.data.results[0].address_components[2].long_name;
      }
      if (results.data.results[0].address_components[4] !== undefined) {
        returnGeoObj.state = results.data.results[0].address_components[4].long_name;
      }
      if (results.data.results[0].address_components[5] !== undefined) {
        returnGeoObj.country = results.data.results[0].address_components[5].long_name;
      }
      if (results.data.results[0].address_components[6] !== undefined) {
        returnGeoObj.zip = results.data.results[0].address_components[6].long_name;
      }
      if (results.data.results[0].formatted_address !== undefined) {
        returnGeoObj.address = results.data.results[0].formatted_address;
      }
      return returnGeoObj;
    });
  };

  map.buildMarkers = function(tripsArr) {
    //create markers
    var markers = [];
    tripsArr.forEach(function(currTrip, index) {
      var markerObj = {};
      markerObj.idKey = currTrip._id;
      markerObj.index = index;
      markerObj.click = 'click';
      markerObj.coords = currTrip.activities[0].location.coordinate;
      markerObj.events = {
        // click: function(markers, eventName, model, args) {
        //   $scope.viewTrip(markerObj.index);
        // }
      };
      markerObj.options = {
        title: currTrip.name,
        icon: {
          url: 'http://www.googlemapsmarkers.com/v1/0077ed'
          // size: new google.maps.Size(30, 30),
          // scaledSize: new google.maps.Size(30, 30)
        }
      };
      markers.push(markerObj);
    });
    return markers;
  };
  map.buildActivityMarkers = function(activitiesArr) {
    //create markers
    var markers = [];
    activitiesArr.forEach(function(currActivity, index) {
      var markerObj = {};
      // markerObj.idKey = currActivity._id;
      markerObj.idKey = index;
      markerObj.index = index;
      markerObj.click = 'click';
      markerObj.coords = currActivity.location.coordinate;
      markerObj.events = {
        // click: function(markers, eventName, model, args) {
        //   $scope.viewTrip(markerObj.index);
        // }
      };
      markerObj.options = {
        title: currActivity.name,
        icon: {
          url: 'http://www.googlemapsmarkers.com/v1/0077ed'
          // size: new google.maps.Size(30, 30),
          // scaledSize: new google.maps.Size(30, 30)
        },

          labelContent: currActivity.name,
          labelAnchor: '22 0',
          labelClass: 'marker-labels',
          labelVisible: true

      };
      markers.push(markerObj);
    });
    return markers;
  };

  map.stylesArr = [
    {
      'featureType': 'landscape',
      'elementType': 'all',
      'stylers': [
        {
          'hue': '#FFBB00'
        },
        {
          'saturation': 43.400000000000006
        },
        {
          'lightness': 37.599999999999994
        },
        {
          'gamma': 1
        }
      ]
    },
    {
      'featureType': 'poi',
      'elementType': 'all',
      'stylers': [
        {
          'hue': '#00FF6A'
        },
        {
          'saturation': -1.0989010989011234
        },
        {
          'lightness': 11.200000000000017
        },
        {
          'gamma': 1
        }
      ]
    },
    {
      'featureType': 'road.highway',
      'elementType': 'all',
      'stylers': [
        {
          'hue': '#FFC200'
        },
        {
          'saturation': -61.8
        },
        {
          'lightness': 45.599999999999994
        },
        {
          'gamma': 1
        }
      ]
    },
    {
      'featureType': 'road.arterial',
      'elementType': 'all',
      'stylers': [
        {
          'hue': '#FF0300'
        },
        {
          'saturation': -100
        },
        {
          'lightness': 51.19999999999999
        },
        {
          'gamma': 1
        }
      ]
    },
    {
      'featureType': 'road.local',
      'elementType': 'all',
      'stylers': [
        {
          'hue': '#FF0300'
        },
        {
          'saturation': -100
        },
        {
          'lightness': 52
        },
        {
          'gamma': 1
        }
      ]
    },
    {
      'featureType': 'water',
      'elementType': 'all',
      'stylers': [
        {
          'hue': '#0078FF'
        },
        {
          'saturation': -13.200000000000003
        },
        {
          'lightness': 2.4000000000000057
        },
        {
          'gamma': 1
        }
      ]
    },
    {
      'featureType': 'water',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'visibility': 'on'
        },
        {
          'weight': '0.01'
        },
        {
          'color': '#6cb9ff'
        }
      ]
    }
  ];

  return map;
});
