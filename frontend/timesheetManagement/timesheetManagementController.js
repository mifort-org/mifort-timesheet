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
            {periodName: 'Week'},
            {periodName: 'Month'}
        ];
        $scope.dayTypes = [
            {typeName: 'Weekend'},
            {typeName: 'Holiday'}
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
            var startDate = moment(new Date($scope.project.createdOn)),
                daysBeforeTimesheetStart = new Date(startDate.calendar()).getDay();

            for (var k = 0; k < daysBeforeTimesheetStart; k++) {
                $scope.timesheet.push($scope.project.template);
            }

            for (var i = 0; i < 50; i++) {
                var dayToPush = _.clone($scope.project.template);
                dayToPush.date = moment(new Date(startDate)).add(i, 'days').calendar();
                $scope.timesheet.push(dayToPush);
            }

            $scope.project.periods.forEach(function (period) {
                if (period.start) {
                    _.findWhere($scope.timesheet, {date: period.start}).isPeriodStartDate = true;
                }
                if (period.end) {
                    _.findWhere($scope.timesheet, {date: period.end}).isPeriodEndDate = true;
                }
            });

            //use on success promise when REST will start working
            for (var j = 0; j < $scope.timesheet.length / daysInRow; j++) {
                $scope.splittedTimesheet.push($scope.timesheet.slice(j * daysInRow, j * daysInRow + daysInRow));
            }

            $scope.project.defaultValues.forEach(function (day) {
                angular.extend(_.findWhere($scope.timesheet, {date: day.date}), day);
            });
        };
        $scope.generateTimesheet($scope.project);



        $scope.splitTimesheet = function (period, startDate) {
            if (period.periodName == 'month' && startDate.getDate() > 28) {
                alert('Please choose the correct date for split');
                return;
            }

            switch (period.periodName) {
                case 'week':
                    var startWeekDay = startDate.getDay(),
                        endWeekDay = startWeekDay == 0 ? 6 : startWeekDay - 1;

                    $scope.timesheet.forEach(function (day) {
                        var currentDateWeekDay = new Date(day.date).getDay();

                        if (day.date && moment(new Date(day.date)) >= moment(new Date(startDate))) {
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

                        if (day.date && moment(new Date(day.date)) >= moment(new Date(startDate))) {
                            currentDateDay = new Date(day.date).getDate();
                            endDateDay = startDateDay - 1 || new Date(moment(new Date(day.date)).endOf('month').calendar()).getDate();

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
            $scope.aggregatePeriods($scope.timesheet);
        };

        $scope.aggregatePeriods = function (timesheet) {
            var periodSplitters = [],
                periods = [];
            timesheet.forEach(function (day) {
                if (day.isPeriodStartDate) {
                    periodSplitters.push({'start': day.date});
                }
                if (day.isPeriodEndDate) {
                    periodSplitters.push({'end': day.date});
                }
            });

            periods = _.groupBy(periodSplitters, function (element, index) {
                return Math.floor(index / 2);
            });
            periods = _.toArray(periods);
            _.map(periods, function (period, index) {
                periods[index] = angular.extend(period[0], period[1])
            });

            $scope.project.periods = periods;
        };

        $scope.openCalendar = function ($event) {
            $scope.calendarIsOpened = true;
        };

        $scope.$watch('timesheet', function (newValue, oldValue) {
            if (oldValue && oldValue != newValue) {
                var existedDayIndex,
                    changedDay = _.filter(oldValue, function (obj) {
                        return !_.findWhere(newValue, obj);
                    });

                $scope.project.defaultValues.forEach(function (defaultDay, index) {
                    if (changedDay[0] && defaultDay.date == changedDay.date) {
                        existedDayIndex = index;
                    }
                });

                if (existedDayIndex >= 0) {
                    angular.extend($scope.project.defaultValues[existedDayIndex], changedDay);
                }
                else {
                    $scope.project.defaultValues.push(changedDay);
                }
            }
        }, true);
    }]);