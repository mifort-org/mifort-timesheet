'use strict';

angular.module('myApp.timesheetManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timesheetManagement', {
            templateUrl: 'timesheetManagement/timesheetManagementView.html',
            controller: 'timesheetManagementController'
        });
    }])

    .controller('timesheetManagementController', ['$scope', 'timesheetManagementService', 'moment', function ($scope, timesheetManagementService, moment) {
        var projectId,
            daysInRow = 7;

        $scope.daySettingsPopover = {
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

        $scope.range = function (n) {
            return new Array(n);
        };

        $scope.project = timesheetManagementService.getProjet(projectId);

        $scope.generateTimesheet = function (project) {
            $scope.project = $scope.project || project;
            $scope.timesheet = [];
            var startDate = moment($scope.project.createdOn),
                daysBeforeTimesheetStart = new Date(startDate.calendar()).getDay();

            for(var j = 0; j < daysBeforeTimesheetStart; j++){
                $scope.timesheet.push($scope.project.template);
            }

            for(var i = 0; i < 100; i++){
                var dayToPush = _.clone($scope.project.template);
                dayToPush.date = moment(startDate).add(i, 'days').calendar();
                $scope.timesheet.push(dayToPush);
            }

            $scope.project.periods.forEach(function (period) {
                _.findWhere($scope.timesheet, {date: period.start}).isPeriodStartDate = true;
                _.findWhere($scope.timesheet, {date: period.end}).isPeriodEndDate = true;
            })
        };
        $scope.generateTimesheet($scope.project);

        //use on success promise when REST will start working
        for (var j = 0; j < $scope.timesheet.length / daysInRow; j++) {
            $scope.splittedTimesheet.push($scope.timesheet.slice(j * daysInRow, j * daysInRow + daysInRow));
        }

        $scope.splitTimesheet = function (period) {

            switch(period.periodName) {
                case 'week':
                    //$scope.project.periods = [];
                    //$scope.generateTimesheet();
                    $scope.timesheet.forEach(function (day) {
                        if(day.date && moment(day.date).calendar() == moment(day.date).startOf('week').calendar()){
                            day.isPeriodStartDate = true;
                        }
                        else if(day.date && moment(day.date).calendar() == moment(day.date).endOf('week').calendar()){
                            day.isPeriodEndDate = true
                        }
                    });
                    break;
                case 'month':
                    //$scope.project.periods = [];
                    //$scope.generateTimesheet();
                    $scope.timesheet.forEach(function (day) {
                        if(day.date && moment(day.date).calendar() == moment(day.date).startOf('month').calendar()){
                            day.isPeriodStartDate = true;
                        }
                        else if(day.date && moment(day.date).calendar() == moment(day.date).endOf('month').calendar()){
                            day.isPeriodEndDate = true
                        }
                    });
                    break;
                case 'decade':
                    //code block
                    break;
                case 'year':
                    //code block
                    break;
            }
        };

        $scope.openCalendar = function ($event) {
            $scope.calendarIsOpened = true;
        };


    }]);