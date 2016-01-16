
//  This controller applies to the createTrip.html
angular.module('app.create', ['app.services'])

//  Factory functions are loaded in in 'ActivitiesData' from 'app.services'
.controller('CreateTripController', function ($scope, $http, ActivitiesData, Map) {

  // $scope.formCompleted is a variable to determine if the form is completed
  // if it's false, the form with show
  // if true, the form will hide and the right side of page will populate
  $scope.formCompleted = false;

  $scope.activity = '';
  // <h3>startItinerary is a function to: </h3>
    // 1. hide the form
    // 2. trigger the search
  $scope.startItinerary = function () {
    console.log('start itinerary');
    // this if block ensures that the Itinerary Name City and State are present
    // before submitting the form
    // if (!$scope.city || !$scope.state) {
      // return;
    // } else {
      // $scope.formCompleted set to true removes the form and begins populating
      // the rest of the page.
      $scope.formCompleted = true;
      // $http.get('/activities/' + $scope.city + ',' + $scope.state + ',' + $scope.activity)
      console.log($scope.activity, "SCOPE ACTIVITY");
      if ($scope.city) {
        $http.get('/activities/cs,' + $scope.city + ',' + $scope.state + ',' + $scope.activity)
          .success(function (data) {
            // $scope.activities is an array of all the activities found by the api
            // at the given destination
            $scope.activities = data;
          });
      } else {
        $http.get('/activities/ll,' + $scope.geoObj.lat + ',' + $scope.geoObj.lng + ',' + $scope.activity)
          .success(function (data) {
            // $scope.activities is an array of all the activities found by the api
            // at the given destination
            $scope.activities = data;
          });
        }
      
  };

  $scope.getPhotos = function(){
    var cityState = $scope.city + ", " + $scope.state
    ActivitiesData.getPhotos(cityState, function(photos){
      $scope.photos = photos
      console.log("photos", $scope.photos)
      var smallPhotos =  ActivitiesData.makePhotos(photos, "small")
      var medPhotos =  ActivitiesData.makePhotos(photos, 320)
      $scope.photos.forEach(function(photoObj, index){
        photoObj.smallPhoto = smallPhotos[index]
        photoObj.medPhoto = medPhotos[index]
      })
    })
  };

  $scope.getWeather = function (activity,dt) {
    var lat = activity.location.coordinate.latitude;
    var lon = activity.location.coordinate.longitude;
    var date = dt;
    $http.get('/api/weather/'+lat+'/'+lon+'/'+date)
      .success(function (data) {
        activity.weather = {};
        activity.weather.max = data.daily.data[0].temperatureMax;
        activity.weather.min = data.daily.data[0].temperatureMin;
        activity.weather.summary = data.daily.data[0].summary;
        console.log(activity.weather)
      })
  }

  $scope.keyPress = function(keyCode) {
    console.log(keyCode)
    if (keyCode === 13) {
      $scope.startItinerary();
      $scope.getPhotos();
    }
  }


  // $scope.itinerary is an emtpy array that will contain all the activities the user will add
  // to their trip
  $scope.itinerary = [];

  // <h4>$scope.addToTrip</h4>
  // Is a function that that adds an activity from the api to the users itinerary
  $scope.addToTrip = function(){
    // The first item added to the itinerary will be the item whose photo is stored with the trip
    if ($scope.itinerary.length === 0) {
      $scope.itineraryImage = this.activity.image_url;
    }
    $scope.itinerary.push(this.activity);
  };

  // <h4>$scope.removeFromTrip</h4>
  // Is a function that removes an item from the users itinerary
  $scope.removeFromTrip = function () {
    var index = $scope.itinerary.indexOf(this.activity);
    $scope.itinerary.splice(index, 1);
  };

  // <h4>$scope.saveItinerary</h4>
  // Is a function that creates an object containing all the relevant information to a users itinerary
  // the object is sent to the server and DB through the factory function ActivitiesData.createTrip
  // see the documentation on services.js for more information.
  $scope.saveItinerary = function () {
    // POST request to /trips with $scope.itinerary
    // var activityIds = $scope.itinerary.map(function (activity) {
    //   return activity._id;
    // });
    //angular hashes the objects in the array, this removes that for mongo
    var activities = angular.toJson($scope.itinerary)
    //console.log("ACTIVITY:", $scope.itinerary);
    var tripObj = {
      name: $scope.itineraryName,
      city: $scope.city,
      state: $scope.state,
      activities: activities,
      image: $scope.itineraryImage
    };
    var trip = JSON.stringify(tripObj);
    //console.log("Trip Obj", trip);
    ActivitiesData.createTrip(trip);
  };

  $scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();

  $scope.clear = function() {
    $scope.dt = null;
  };

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  };

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };

  $scope.toggleMin();
  $scope.maxDate = new Date(2020, 5, 22);

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.setDate = function(year, month, day) {
    $scope.dt = new Date(year, month, day);
    console.log($scope.dt);
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
  $scope.altInputFormats = ['M!/d!/yyyy'];

  $scope.popup1 = {
    opened: false
  };

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 1);
  $scope.events =
    [
      {
        date: tomorrow,
        status: 'full'
      },
      {
        date: afterTomorrow,
        status: 'partially'
      }
    ];

  $scope.categories = ["Arts & Entertainment",
                      "Landmarks",
                      "Nightlife",
                      "Restaurants",
                      "Bars",
                      "Coffee & Tea",
                      "Delivery",
                      "Tourist",
                      "Shopping",
                      "Beauty & Spas"];

  $scope.getActivity = function(search) {
       var newCats = $scope.categories.slice();
        if (search && newCats.indexOf(search) === -1) {
          newCats.unshift(search);
        }
        return newCats;
      }

  $scope.getDayClass = function(date, mode) {
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  };

  Map.createMap({
    center: {
      latitude: 40,
      longitude: -99
    },
    zoom: 4,
    events: {
      click: function(maps, event, args) {
        var e = args[0];
        var lat = e.latLng.lat();
        var lon = e.latLng.lng();
        //console.log('clicked!', args[0], lat, lon);
        var geoObj = {
          lat: lat,
          lng: lon
        };
        Map.getCityfromGeo(geoObj).then(function(obj) {
          $scope.city = obj.city;
          $scope.state = obj.state;
          // if ($scope.itineraryName.length === 0) {
          // }
          $scope.geoObj = obj;
          $scope.startItinerary();
          $scope.getPhotos();
        });

      }
    },
    options: {
      scrollwheel: false,
      styles: Map.stylesArr
    }
  }).then(function(map) {
    $scope.map = map;
    //console.log('create Trip map', $scope.map);
  });

});