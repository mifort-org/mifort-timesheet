'use strict';

angular.module('myApp.timesheetManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timesheetManagement', {
            templateUrl: 'timesheetManagement/timesheetManagementView.html',
            controller: 'timesheetManagementController'
        });
    }])

    .controller('timesheetManagementController', ['$scope', 'timesheetManagementService', 'moment', function ($scope, timesheetManagementService, moment) {
        var daysInRow = 7;

        $scope.daySettingsPopover = {
            templateUrl: 'daySettimgs.html',
            title: 'Day Settings'
        };
        $scope.periodSettings = timesheetManagementService.getPeriodSettings();
        $scope.dayTypes = timesheetManagementService.getDayTypes();
        $scope.weekDays = timesheetManagementService.getWeekDays();
        //TODO: get projectId from user
        timesheetManagementService.getProject('55ee8bb048b0829c0e213b1d').success(function (data) {
            $scope.project = data;
        }).then(function () {
            $scope.init();
        });

        $scope.selectedPeriod = $scope.periodSettings[0]; //default period is week
        $scope.splittedTimesheet = [];
        $scope.calendarIsOpened = false;

        $scope.range = function (n) {
            return new Array(n);
        };

        $scope.init = function () {
            generateTimesheet();
            initWatchers();
        };

        function generateTimesheet() {
            $scope.startDate = new Date($scope.project.periods[0].start); //default for perios split date
            $scope.timesheet = [];
            var startDate = moment(new Date($scope.project.periods[0].start)),
                endDate = moment(new Date($scope.project.periods[$scope.project.periods.length - 1].end)),
                daysBeforeTimesheetStart = new Date(startDate.calendar()).getDay(),
                daysToGenerate = endDate.diff(startDate, 'days');

            //empty cells adding
            for (var k = 0; k < daysBeforeTimesheetStart; k++) {
                $scope.timesheet.push($scope.project.template);
            }

            //TODO: remove +1 when timezone conflict will be resolved
            for (var i = 0; i < daysToGenerate + 1; i++) {
                var dayToPush = _.clone($scope.project.template);
                dayToPush.date = moment(new Date(startDate)).add(i, 'days').calendar();
                $scope.timesheet.push(dayToPush);
            }

            $scope.project.periods.forEach(function (period) {
                if (period.start) {
                    _.findWhere($scope.timesheet, {date: moment(new Date(period.start)).calendar()}).isPeriodStartDate = true;
                }
                if (period.end) {
                    _.findWhere($scope.timesheet, {date: moment(new Date(period.end)).calendar()}).isPeriodEndDate = true;
                }
            });

            //use on success promise when REST will start working
            for (var j = 0; j < $scope.timesheet.length / daysInRow; j++) {
                $scope.splittedTimesheet.push($scope.timesheet.slice(j * daysInRow, j * daysInRow + daysInRow));
            }

            if ($scope.project.defaultValues) {
                $scope.project.defaultValues.forEach(function (day) {
                    angular.extend(_.findWhere($scope.timesheet, {date: day.date}), day);
                });
            }


        }

        function initWatchers() {
            $scope.$watch('timesheet', function (newValue, oldValue) {
                if (oldValue && oldValue != newValue) {
                    var existedDayIndex,
                        changedDay = _.filter(oldValue, function (obj) {
                            return !_.findWhere(newValue, obj);
                        });

                    $scope.project.defaultValues = $scope.project.defaultValues || [];

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

                timesheetManagementService.saveProject($scope.project._id, $scope.project);
            }, true);
        }

        $scope.splitTimesheet = function (period, splitStartDate) {
            if (period.periodName == 'month' && splitStartDate.getDate() > 28) {
                alert('Please choose the correct date for split');
                return;
            }

            switch (period.periodName) {
                case 'Week':
                    var startWeekDay = splitStartDate.getDay(),
                        endWeekDay = startWeekDay == 0 ? 6 : startWeekDay - 1;

                    $scope.timesheet.forEach(function (day) {
                        if (day.date) {
                            var currentDateWeekDay = new Date(day.date).getDay();

                            if (day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))) {
                                if (currentDateWeekDay == startWeekDay) {
                                    day.isPeriodStartDate = true;
                                }
                                else if (currentDateWeekDay == endWeekDay) {
                                    day.isPeriodEndDate = true;
                                }
                            }
                        }
                    });
                    break;

                case 'Month':
                    var startDateDay = splitStartDate.getDate();

                    $scope.timesheet.forEach(function (day) {
                        var currentDateDay,
                            endDateDay;

                        if (day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))) {
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
            //$scope.timesheet[0].isPeriodStartDate = true;
            $scope.aggregatePeriods($scope.timesheet);
        };

        //used by tableCell directive
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
    }]);