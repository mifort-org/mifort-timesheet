'use strict';

angular.module('myApp.timesheetManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timesheetManagement', {
            templateUrl: 'timesheetManagement/timesheetManagementView.html',
            controller: 'timesheetManagementController'
        });
    }])

    .controller('timesheetManagementController', ['$scope', 'timesheetManagementService', function ($scope, timesheetManagementService) {
        var projectId,
            periodId;

        $scope.periodSettings = [
            {
                periodName: 'week',
                days: 7
            },
            {
                periodName: 'month',
                days: 30
            },
            {
                periodName: 'decade',
                days: 90
            },
            {
                periodName: 'year',
                days: 365
            }
        ];

        $scope.selectedPeriod = $scope.periodSettings[0]; //default value is week
        $scope.calendarIsOpened = false;
        $scope.weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $scope.timesheet = timesheetManagementService.getTimesheet(projectId, periodId).calendar;
        $scope.splittedTimesheet = [];

        $scope.openCalendar = function ($event) {
            $scope.calendarIsOpened = true;
        };

        $scope.range = function (n) {
            return new Array(n);
        };

        $scope.split = function () {
            var periodDuration = $scope.selectedPeriod.days;

            for (var i = 0; i < $scope.timesheet.length / $scope.selectedPeriod.days; i++) {
                $scope.splittedTimesheet.push($scope.timesheet.slice(i * periodDuration, i * periodDuration + periodDuration));
                $scope.splittedTimesheet[i][0].isPeriodStartDate = true;

                //temp
                if ($scope.splittedTimesheet[i][periodDuration - 1]) {
                    $scope.splittedTimesheet[i][periodDuration - 1].isPeriodEndDate = true;
                }
            }
        };
        $scope.split();

        $scope.periodTimeChanged = function (day, weekIndex, dayIndex) {
            console.log(true);

            if(day.isPeriodStartDate){
                //$scope.splittedTimesheet[weekIndex][dayIndex]
            }
            else{

            }
        };
    }]);