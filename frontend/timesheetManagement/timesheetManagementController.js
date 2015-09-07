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
            periodId,
            daysInRow = 7;

        $scope.daySettingsPopover = {
            content: 'Hello, World!',
            templateUrl: 'daySettimgs.html',
            title: 'Day Settings'
        };
        $scope.periodSettings = [
            {periodName: 'week'},
            {periodName: 'month'},
            {periodName: 'decade'},
            {periodName: 'year'}
        ];
        $scope.selectedPeriod = $scope.periodSettings[0]; //default value is week
        $scope.calendarIsOpened = false;
        $scope.weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $scope.splittedTimesheet = [];

        $scope.timesheet = timesheetManagementService.getProjet(projectId).calendar;
        //use on success promise when REST will start working
        for (var i = 0; i < $scope.timesheet.length / daysInRow; i++) {
            $scope.splittedTimesheet.push($scope.timesheet.slice(i * daysInRow, i * daysInRow + daysInRow));
        }

        $scope.openCalendar = function ($event) {
            $scope.calendarIsOpened = true;
        };

        $scope.range = function (n) {
            return new Array(n);
        };
    }]);