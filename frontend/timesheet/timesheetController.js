/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

angular.module('myApp.timesheet', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/Timesheet', {
            templateUrl: 'timesheet/timesheetView.html',
            controller: 'timesheetController'
        });
    }])

    .controller('timesheetController', ['$scope', '$filter', 'timesheetService', 'moment', 'preferences', function ($scope, $filter, timesheetService, moment, preferences) {
        $scope.daySettingsPopover = {
            templateUrl: 'daySettimgs.html'
        };
        $scope.periodSettings = timesheetService.getPeriodSettings();
        $scope.dayTypes = timesheetService.getDayTypes();
        $scope.weekDays = timesheetService.getWeekDays();

        timesheetService.getCompany(preferences.get('user').companyId).success(function (data) {
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
            $scope.startDate = new Date($scope.project.periods[0].start); //default for peridos split date
            $scope.timesheet = [];

            var startDate = moment(new Date($scope.project.periods[0].start)),
                endDate = moment(new Date($scope.project.periods[$scope.project.periods.length - 1].end)),
                daysToGenerate = endDate.diff(startDate, 'days') + 1;
                //daysToGenerate = 30;

            for (var i = 0; i < daysToGenerate; i++) {
                var dayToPush = _.clone($scope.project.template);
                dayToPush.date = moment(new Date(startDate)).add(i, 'days').format("MM/DD/YYYY");
                $scope.timesheet.push(dayToPush);
            }

            $scope.project.periods.forEach(function (period) {
                if (period.start) {
                    _.findWhere($scope.timesheet, {date: moment(new Date(period.start)).format('MM/DD/YYYY')}).isPeriodStartDate = true;
                }

                if (period.end) {
                    _.findWhere($scope.timesheet, {date: moment(new Date(period.end)).format('MM/DD/YYYY')}).isPeriodEndDate = true;
                }
            });

            //Splitting the timesheet
            $scope.timesheet.forEach(function(day, index) {
                var currentDate = new Date(day.date),
                    currentDayYear = moment(currentDate).get('year') - moment(new Date()).get('year'),
                    currentDayMonth = moment(currentDate).get('month'),
                    currentDayWeek = moment(currentDate).get('isoWeek'),
                    daysBeforeTimesheetStart,
                    daysAfterTimesheetEnd,
                    generatedDay;

                //last week reset
                if(currentDayWeek == 53 && $scope.splittedTimesheet[currentDayYear-1]){
                    currentDayWeek = 0;
                }

                if(currentDate.getDay() == 0 || currentDate.getDay() == 1){
                    day.weekend = true;
                }
//in progress
                if($scope.splittedTimesheet[currentDayYear]){
                    if($scope.splittedTimesheet[currentDayYear][currentDayMonth]){
                        if($scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek]){
                            $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                        }
                        else{
                            $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek] = [];
                            $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                        }
                    }
                    else{
                        daysBeforeTimesheetStart = moment(currentDate).isoWeekday();
                        $scope.splittedTimesheet[currentDayYear][currentDayMonth] = [];
                        $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek] = [];

                        //generate days after previous month end
                        if($scope.splittedTimesheet[currentDayYear][currentDayMonth - 1]){
                            daysAfterTimesheetEnd = $scope.timesheet[index-1] && 7 - moment(new Date($scope.timesheet[index-1].date)).isoWeekday();

                            for (var i = 0; i < daysAfterTimesheetEnd; i++) {
                                generatedDay =  _.clone($scope.project.template);
                                generatedDay.date = moment(currentDate).subtract(i, 'day').calendar();
                                generatedDay.disabled = true;
                                $scope.splittedTimesheet[currentDayYear][currentDayMonth - 1][$scope.splittedTimesheet[currentDayYear][currentDayMonth - 1].length-1].push(generatedDay);
                            }
                        }

                        //generate days before month start
                        for (var k = 0; k < daysBeforeTimesheetStart-1; k++) {
                            generatedDay =  _.clone($scope.project.template);
                            generatedDay.date = moment(currentDate).subtract(k+1, 'day').format('MM/DD/YYYY');
                            generatedDay.disabled = true;
                            $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].unshift(generatedDay);
                        }

                        $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                    }
                }
                else{
                    $scope.splittedTimesheet[currentDayYear] = [];

                        daysBeforeTimesheetStart = moment(currentDate).isoWeekday();
                        $scope.splittedTimesheet[currentDayYear][currentDayMonth] = [];
                        $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek] = [];

                        //generate days after previous year end
                        if($scope.splittedTimesheet[currentDayYear - 1]){
                            daysAfterTimesheetEnd = $scope.timesheet[index - 1] && 7 - moment(new Date($scope.timesheet[index-1].date)).isoWeekday();

                            for (var i = 0; i < daysAfterTimesheetEnd; i++) {
                                generatedDay =  _.clone($scope.project.template);
                                generatedDay.date = moment(currentDate).subtract(i, 'day').calendar();
                                generatedDay.disabled = true;
                                var previousMonth = $scope.splittedTimesheet[currentDayYear-1][$scope.splittedTimesheet[currentDayYear-1].length-1];
                                previousMonth[previousMonth.length - 1].push(generatedDay);
                            }
                        }

                        //generate days before month start
                        for (var k = 0; k < daysBeforeTimesheetStart-1; k++) {
                            generatedDay =  _.clone($scope.project.template);
                            generatedDay.date = moment(currentDate).subtract(k+1, 'day').format('MM/DD/YYYY');
                            generatedDay.disabled = true;
                            $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].unshift(generatedDay);
                        }

                        $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                }
            });
//end in progress

            if ($scope.project.defaultValues) {
                $scope.project.defaultValues.forEach(function (day) {
                    var dayExisted = _.findWhere($scope.timesheet, {date: moment(new Date(day.date)).format('MM/DD/YYYY')});
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

                timesheetService.saveProject($scope.project);

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

        $scope.getMonthName = function(month) {
            //get last day of first week
            for(var i in month){
                return moment(new Date(month[i][month[i].length-1].date)).format('MMMM YYYY');
            }
        };

        $scope.chooseCustomDayType = function(customDay) {
            if(customDay){
                customDay
            }
            else{
                //reset customDay
                customDay
            }
        }
    }]);