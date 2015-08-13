'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'ui.bootstrap',
    'myApp.login',
    'myApp.timelog',
    'myApp.timesheetManagement',
    'myApp.projectReport',
    'myApp.projectManagement',
    'myApp.peopleReport',
    'preferences'
])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/login'});
    }])

    .controller('myAppController', ['$scope', '$location', 'loginService', 'preferences', function ($scope, $location, loginService, preferences) {
        if(preferences.get('user')){
            $scope.isLoggedIn = true;
        }
        else{
            $location.path('/login');
        }
    }]);