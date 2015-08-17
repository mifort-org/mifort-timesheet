'use strict';

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetManagementService', 'preferences', function ($scope, $filter, timelogService, timesheetManagementService, preferences) {
        var projectId = 21, //hardcoded
            timesheetStructure = timesheetManagementService.getTimesheet(projectId).calendar,
            userTimelog = timelogService.getTimelog().timelog;

        $scope.timelog = angular.extend(angular.copy(timesheetStructure), angular.copy(userTimelog));
        $scope.timelogKeys = timelogService.getTimelogKeys();
        $scope.timelogAssigments = preferences.get('user').assignments;

        $scope.addRow = function (dateId, rowIndex) {
            var newRow = $filter('getByProperty')(timesheetStructure, dateId, 'dateId');
            $scope.timelog.splice(rowIndex, 0, newRow);
        };

        $scope.isWeekend = function (date) {
            return $filter('isWeekendDay')(date);
        };

        $scope.$watch('timelog', function () {
            var userId,
                periodId;

            console.log('changed');
            timelogService.updateTimelog(userId, periodId);
        }, true);
    }]);