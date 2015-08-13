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
        userTimelog = timelogService.getTimelog();

        $scope.timelogKeys = timelogService.getTimelogKeys();
        $scope.timelog = angular.extend(timesheetStructure.calendar, userTimelog.timelog);

        $scope.addRow = function (rowIndex) {
            $scope.timelog.splice(rowIndex, 0, timesheetStructure[rowIndex]);
        }
    }]);