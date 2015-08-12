'use strict';

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', 'timelogService', 'timesheetManagementService', function ($scope, timelogService, timesheetManagementService) {
        var timesheetStructure = timesheetManagementService.get(),
        userTimelog = timelogService.get();

        $scope.timelog = angular.extend(timesheetStructure.calendar, userTimelog.timelog);
    }]);