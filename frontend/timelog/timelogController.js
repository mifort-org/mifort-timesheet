'use strict';

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetManagementService', 'preferences', function ($scope, $filter, timelogService, timesheetManagementService, preferences) {
        $scope.project = timesheetManagementService.getProject();
        $scope.timelog = [];
        $scope.currentTimelogIndex = 0;

        var timesheetTemplate = $scope.project.template,
            userTimelog = timelogService.getTimelog().timelog,
            startDate = moment(new Date($scope.project.createdOn));

        for (var i = 0; i < 50; i++) {
            var dayToPush = _.clone(timesheetTemplate);
            dayToPush.date = moment(new Date(startDate)).add(i, 'days').calendar();
            $scope.timelog.push(dayToPush);
        }
        $scope.timelog = angular.extend($scope.timelog, userTimelog);
        $scope.timelogKeys = timelogService.getTimelogKeys();
        $scope.timelogAssigments = preferences.get('user').assignments.map(function (assignment) {
            return assignment.role
        });

        $scope.project.defaultValues.forEach(function (day) {
            angular.extend(_.findWhere($scope.timelog, {date: day.date}), day);
        });

        $scope.splittedTimelog = [];
        $scope.project.periods.forEach(function (period) {
            var timelogPeriod = [],
                startIndex = _.findIndex($scope.timelog, {date: period.start}),
                endIndex = _.findIndex($scope.timelog, {date: period.end});

            timelogPeriod.push($scope.timelog.slice(startIndex, endIndex + 1));
            $scope.splittedTimelog.push(timelogPeriod);
        });

        $scope.addRow = function (dateId, rowIndex) {
            var newRow = $filter('getByProperty')(timesheetTemplate, dateId, 'dateId');
            $scope.timelog.splice(rowIndex, 0, newRow);
        };

        $scope.isWeekend = function (date) {
            return $filter('isWeekendDay')(date);
        };

        $scope.previousPeriod = function () {
            $scope.currentTimelogIndex -= 7
        };

        $scope.nextPeriod = function () {
            $scope.currentTimelogIndex += 7
        };

        $scope.$watch('timelog', function () {
            console.log('Tmelog saved');
            timelogService.updateTimelog();
        }, true);
    }]);