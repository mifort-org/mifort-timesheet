'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'ui.bootstrap',
    'myApp.timesheet',
    'myApp.timesheetManagement',
    'myApp.projectReport',
    'myApp.projectManagement',
    'myApp.peopleReport'
]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/timesheet'});
    }]);