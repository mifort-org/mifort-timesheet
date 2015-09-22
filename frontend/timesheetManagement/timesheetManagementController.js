'use strict';

angular.module('myApp.timesheetManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timesheetManagement', {
            templateUrl: 'timesheetManagement/timesheetManagementView.html',
            controller: 'timesheetManagementController'
        });
    }])

    .controller('timesheetManagementController', ['$scope', '$filter', 'timesheetManagementService', 'moment', 'preferences', function ($scope, $filter, timesheetManagementService, moment, preferences) {
        var daysInRow = 7;

        $scope.daySettingsPopover = {
            templateUrl: 'daySettimgs.html',
            title: 'Day Settings'
        };
        $scope.periodSettings = timesheetManagementService.getPeriodSettings();
        $scope.dayTypes = timesheetManagementService.getDayTypes();
        $scope.weekDays = timesheetManagementService.getWeekDays();

        timesheetManagementService.getProject(preferences.get('user').assignments[0].projectId).success(function (data) {
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
                daysToGenerate = endDate.diff(startDate, 'days');
                daysToGenerate = 365;

            for (var i = 0; i < daysToGenerate; i++) {
                var dayToPush = _.clone($scope.project.template);
                dayToPush.date = moment(new Date(startDate)).add(i, 'days').format("MM/DD/YYYY");
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

            //Splitting the timesheet
            $scope.timesheet.forEach(function(day, index) {
                var currentDayMonth = moment(new Date(day.date)).get('month'),
                    currentDayWeek = moment(new Date(day.date)).get('isoWeek'),
                    daysBeforeTimesheetStart,
                    daysAfterTimesheetEnd,
                    generatedDay;

                if($scope.splittedTimesheet[currentDayMonth]){
                    if($scope.splittedTimesheet[currentDayMonth][currentDayWeek-1]){
                        $scope.splittedTimesheet[currentDayMonth][currentDayWeek-1].push(day);
                    }
                    else{
                        $scope.splittedTimesheet[currentDayMonth][currentDayWeek-1] = [];
                        $scope.splittedTimesheet[currentDayMonth][currentDayWeek-1].push(day);
                    }
                }
                else{
                    daysBeforeTimesheetStart = moment(new Date(day.date)).isoWeekday();
                    $scope.splittedTimesheet[currentDayMonth] = [];
                    $scope.splittedTimesheet[currentDayMonth][currentDayWeek-1] = [];

                    //generate days after previous month end
                     if($scope.splittedTimesheet[currentDayMonth - 1]){
                         daysAfterTimesheetEnd = $scope.timesheet[index-1] && 7 - moment(new Date($scope.timesheet[index-1].date)).isoWeekday();

                         for (var i = 0; i < daysAfterTimesheetEnd; i++) {
                             generatedDay =  _.clone($scope.project.template);
                             generatedDay.date = moment(new Date(day.date)).subtract(i, 'day').calendar();
                             generatedDay.disabled = true;
                             $scope.splittedTimesheet[currentDayMonth - 1][$scope.splittedTimesheet[currentDayMonth - 1].length-1].push(generatedDay);
                         }
                     }

                     //generate days before month start
                     for (var k = 0; k < daysBeforeTimesheetStart-1; k++) {
                         generatedDay =  _.clone($scope.project.template);
                         generatedDay.date = moment(new Date(day.date)).subtract(k+1, 'day').calendar();
                         generatedDay.disabled = true;
                         $scope.splittedTimesheet[currentDayMonth][currentDayWeek-1].unshift(generatedDay);
                     }

                    $scope.splittedTimesheet[currentDayMonth][currentDayWeek-1].push(day);
                }
            });

            if ($scope.project.defaultValues) {
                $scope.project.defaultValues.forEach(function (day) {
                    var dayExisted = _.findWhere($scope.timesheet, {date: moment(new Date(day.date)).calendar()});
                    if(dayExisted){
                        angular.extend(dayExisted, day);
                    }
                });
            }
        }

        function initWatchers() {
            $scope.$watch('timesheet', function (newValue, oldValue) {
                if (oldValue && oldValue != newValue) {
                    var existedDayIndex,
                        changedDay = _.filter(newValue, function (obj) {
                            return !_.findWhere(oldValue, obj);
                        })[0];

                    $scope.project.defaultValues = $scope.project.defaultValues || [];

                    $scope.project.defaultValues.forEach(function (defaultDay, index) {
                        if (changedDay && defaultDay.date == changedDay.date) {
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

                timesheetManagementService.saveProject($scope.project);

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

        $scope.isWeekend = function (date) {
            return $filter('isWeekendDay')(date);
        };

        $scope.getMonthName = function(splittedTimesheet) {
            return  moment(splittedTimesheet.slice(-1)[0][0].date).format('MMMM YYYY');
        }
    }]);