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
            {periodName: 'month'}
        ];
        $scope.weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $scope.splittedTimesheet = [];
        $scope.selectedPeriod = $scope.periodSettings[0]; //default value is week
        $scope.project = timesheetManagementService.getProjet(projectId);
        $scope.calendarIsOpened = false;

        $scope.range = function (n) {
            return new Array(n);
        };

        $scope.generateTimesheet = function () {
            $scope.startDate = new Date($scope.project.createdOn);
            $scope.timesheet = [];
            var startDate = moment($scope.project.createdOn),
                daysBeforeTimesheetStart = new Date(startDate.calendar()).getDay();

            for (var j = 0; j < daysBeforeTimesheetStart; j++) {
                $scope.timesheet.push($scope.project.template);
            }

            for (var i = 0; i < 100; i++) {
                var dayToPush = _.clone($scope.project.template);
                dayToPush.date = moment(startDate).add(i, 'days').calendar();
                $scope.timesheet.push(dayToPush);
            }

            $scope.project.periods.forEach(function (period) {
                if(period.start){
                    _.findWhere($scope.timesheet, {date: period.start}).isPeriodStartDate = true;
                }
                if(period.end){
                    _.findWhere($scope.timesheet, {date: period.end}).isPeriodEndDate = true;
                }
            });
        };
        $scope.generateTimesheet($scope.project);

        //use on success promise when REST will start working
        for (var j = 0; j < $scope.timesheet.length / daysInRow; j++) {
            $scope.splittedTimesheet.push($scope.timesheet.slice(j * daysInRow, j * daysInRow + daysInRow));
        }

        $scope.splitTimesheet = function (period, startDate) {
            if(period.periodName == 'month' && startDate.getDate() > 28){
                alert('Please choose the correct date for split');
                return;
            }

            switch (period.periodName) {
                case 'week':
                    var startWeekDay = startDate.getDay(),
                        endWeekDay = startWeekDay == 0 ? 6 : startWeekDay - 1;

                    $scope.timesheet.forEach(function (day) {
                        var currentDateWeekDay = new Date(moment(day.date)).getDay();

                        if (day.date && moment(day.date) >= moment(startDate)) {
                            if (currentDateWeekDay == startWeekDay) {
                                day.isPeriodStartDate = true;
                            }
                            else if (currentDateWeekDay == endWeekDay) {
                                day.isPeriodEndDate = true;
                            }
                        }
                    });
                    break;

                case 'month':
                    var startDateDay = startDate.getDate();

                    $scope.timesheet.forEach(function (day) {
                        var currentDateDay,
                            endDateDay;

                        if (day.date && moment(day.date) >= moment(startDate)) {
                            currentDateDay = new Date(moment(day.date)).getDate();
                            endDateDay = startDateDay - 1 || new Date(moment(day.date).endOf('month').calendar()).getDate();

                            if (currentDateDay == startDateDay) {
                                day.isPeriodStartDate = true;
                            }
                            else if (currentDateDay == endDateDay) {
                                day.isPeriodEndDate = true;
                            }
                        }
                    });
                    break;
            }

            $scope.timesheet[$scope.timesheet.length - 1].isPeriodEndDate = true;
        };

        $scope.openCalendar = function ($event) {
            $scope.calendarIsOpened = true;
        };
    }]);