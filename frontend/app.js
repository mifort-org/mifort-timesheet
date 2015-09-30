'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'myApp.login',
    'myApp.company',
    'myApp.projects',
    'myApp.timelog',
    'myApp.timesheetManagement',
    'myApp.projectReport',
    'myApp.peopleReport',
    'preferences',
    'angularMoment'
])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/login'});
    }])

    .controller('myAppController', ['$scope', '$location', '$cookies', '$http', 'preferences', function ($scope, $location, $cookies, $http, preferences) {
        if($cookies.get('user')){
            $scope.isLoggedIn = true;
        }
        else{
            $location.path('/login');
        }

        $scope.logout = function () {
            $cookies.remove('user');
            preferences.remove('user');

            $http.get('logout').then(function () {
                $location.path('login');
            });
        }
    }]);