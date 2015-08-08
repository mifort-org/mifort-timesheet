'use strict';

angular.module('myApp.timesheet', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timesheet', {
            templateUrl: 'frontend/timesheet/timesheetView.html',
            controller: 'timesheetController'
        });
    }])

    .controller('timesheetController', ['$scope', function ($scope) {
        $scope.page = 'timesheet';
    }]);