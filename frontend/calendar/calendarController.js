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

angular.module('mifortTimesheet.calendar', ['ngRoute', 'constants'])

    .config(['$routeProvider', 'appVersion', function($routeProvider, appVersion) {
        $routeProvider.when('/calendar', {
            templateUrl: 'calendar/calendarView.html?rel=' + appVersion,
            controller: 'calendarController'
        });
    }])

    .controller('calendarController', ['$scope', '$filter', 'calendarService', 'moment', 'preferences', 'Notification', '$anchorScroll', '$location',
        function($scope, $filter, calendarService, moment, preferences, Notification, $anchorScroll, $location) {
            $scope.daySettingsPopover = {
                templateUrl: 'daySettings'
            };
            $scope.customDayPopover = {
                templateUrl: 'customDay'
            };
            $scope.periodSettings = calendarService.getPeriodSettings();
            $scope.countPeriodSettings = calendarService.getCountPeriodSettings();
            $scope.weekDays = calendarService.getWeekDays();
            calendarService.getCompany(preferences.get('user').companyId).success(function (data) {
                $scope.company = data;
                $scope.company.emails = [];
                if (data.period) {
                    $scope.countPeriodSetting = 1;
                    $scope.periodSetting = data.period.unit;
                } else {
                    $scope.countPeriodSetting = 1;
                    $scope.periodSetting = "Weekly";
                }
            }).then(function () {
                $scope.init();
            });

            $scope.selectedPeriod = $scope.periodSettings[1]; //default period is week
            $scope.splittedCalendar = [];
            $scope.calendarIsOpened = false;
            //check and remove
            $scope.range = function(n) {
                return new Array(n);
            };

            $scope.init = function() {
                var currentMonth = moment(new Date()).get('month');

                generateCalendar();
                initWatchers();

                $location.hash('month-' + currentMonth);
                $anchorScroll();
            };

            function generateCalendar() {
                $scope.startDate = new Date($scope.company.periods[0].start); //default for peridos split date
                $scope.calendar = [];
                $scope.splittedCalendar = [];

                var startDate = moment(new Date($scope.company.periods[0].start)).startOf('month'),
                    endDate = moment(new Date($scope.company.periods[$scope.company.periods.length - 1].end)).endOf('month'),
                    daysToGenerate = endDate.diff(startDate, 'days') + 1;

                for(var i = 0; i < daysToGenerate; i++){
                    var dayToPush = _.clone($scope.company.template);
                    dayToPush.date = moment(new Date(startDate)).add(i, 'days').format("MM/DD/YYYY");
                    var weekday = moment(new Date(startDate)).add(i, 'days').weekday();
                    var daysInMonth = moment(new Date(startDate)).add(i, 'days').daysInMonth();
                    var dateOfMonth = moment(new Date(startDate)).add(i, 'days').date();
                    if ($scope.periodSetting == 'Dayly') {
                        dayToPush.dayId = 1;
                    }else if($scope.periodSetting == 'Weekly' && (weekday === 0 || weekday === 6)){
                        dayToPush.dayId = 1;
                    }else if($scope.periodSetting == 'Monthly' && (dateOfMonth === 1 || dateOfMonth === daysInMonth)){
                        dayToPush.dayId = 1;
                    }
                    $scope.calendar.push(dayToPush);
                }

                updateCalendarDaysWithPeriods();

                //Splitting the calendar days into tables
                $scope.calendar.forEach(function(day, index) {
                    generateCalendarTables(day, index);
                });

                //applyDefaultValues();
            }

            function updateCalendarDaysWithPeriods(){
                $scope.company.periods.forEach(function(period) {
                    if(period.start){
                        var periodStartDay = _.findWhere($scope.calendar, {date: moment(new Date(period.start)).format('MM/DD/YYYY')});

                        if(periodStartDay){
                            periodStartDay.isPeriodStartDate = true;
                        }
                    }

                    if(period.end){
                        var periodEndDay = _.findWhere($scope.calendar, {date: moment(new Date(period.end)).format('MM/DD/YYYY')});

                        if(periodEndDay){
                            periodEndDay.isPeriodEndDate = true;
                        }
                    }
                });
            }

            /*function applyDefaultValues() {
                if($scope.company.defaultValues){
                    $scope.company.defaultValues.forEach(function(day) {
                        if(day && day.date){
                            var dayExisted = _.findWhere($scope.calendar, {date: moment(new Date(day.date)).format('MM/DD/YYYY')});
                        }

                        if(dayExisted){
                            angular.extend(dayExisted, day);
                        }
                    });
                }
            }*/

            function generateCalendarTables(day, index) {
                var currentDate = new Date(day.date),
                    currentDayWeek = moment(currentDate).get('week'),
                    currentDayMonth = moment(currentDate).get('month'),
                    currentDayYear = moment(currentDate).get('year') - moment(new Date()).get('year'),
                    daysBeforeCalendarStart = moment(currentDate).weekday(),
                    daysAfterCalendarEnd = $scope.calendar[index - 1] && 6 - moment(new Date($scope.calendar[index - 1].date)).weekday(),
                    generatedDay;

                if(currentDayWeek == 1 && moment(currentDate).get('date') > 7){
                    currentDayWeek = 53;
                }

                function generateCurrentMonth() {
                    $scope.splittedCalendar[currentDayYear][currentDayMonth] = [];
                }

                function generateCurrentWeek() {
                    $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek] = [];
                }

                function generatePreviousMonthDays() {
                    for(var k = 0; k < daysBeforeCalendarStart; k++){
                        generatedDay = _.clone($scope.company.template);
                        generatedDay.date = moment(currentDate).subtract(k + 1, 'day').format('MM/DD/YYYY');
                        generatedDay.disabled = true;
                        $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].unshift(generatedDay);
                    }

                    $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                }

                function generateNextMonthDays() {
                    var previousMonth;

                    if($scope.splittedCalendar[currentDayYear].length && $scope.splittedCalendar[currentDayYear][currentDayMonth - 1]){
                        //get current year month
                        previousMonth = $scope.splittedCalendar[currentDayYear][currentDayMonth - 1];
                    }
                    else{
                        //get previous year month
                        previousMonth = $scope.splittedCalendar[currentDayYear - 1][$scope.splittedCalendar[currentDayYear - 1].length - 1];
                    }

                    for(var i = 0; i < daysAfterCalendarEnd; i++){
                        generatedDay = _.clone($scope.company.template);
                        generatedDay.date = moment(currentDate).add(i, 'day').format('MM/DD/YYYY');
                        generatedDay.disabled = true;
                        previousMonth[previousMonth.length - 1].push(generatedDay);
                    }
                }


                if($scope.splittedCalendar[currentDayYear]){
                    if($scope.splittedCalendar[currentDayYear][currentDayMonth]){
                        if($scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek]){
                            $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                        }
                        else{
                            $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek] = [];
                            $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                        }
                    }
                    else{
                        generateCurrentMonth();
                        generateCurrentWeek();

                        //generate days after previous month end
                        if($scope.splittedCalendar[currentDayYear][currentDayMonth - 1]){
                            generateNextMonthDays();
                        }

                        generatePreviousMonthDays();
                    }
                }
                else{
                    $scope.splittedCalendar[currentDayYear] = [];

                    generateCurrentMonth();
                    generateCurrentWeek();

                    //generate days after previous year end
                    if($scope.splittedCalendar[currentDayYear - 1]){
                        generateNextMonthDays();
                    }

                    generatePreviousMonthDays();
                }
            }

            function initWatchers() {
                $scope.$watch('calendar', function(newValue, oldValue) {
                    if(oldValue && oldValue != newValue){
                        var existedDayIndex,
                            changedDay = _.filter(newValue, function(newValueDate) {
                                return _.filter(oldValue, function(oldValueDate) {
                                        return oldValueDate.date == newValueDate.date && JSON.stringify(oldValueDate) != JSON.stringify(newValueDate)
                                    }
                                )[0];
                            })[0];

                        $scope.company.defaultValues = $scope.company.defaultValues || [];

                        $scope.company.defaultValues.forEach(function(defaultDay, index) {
                            if(changedDay && defaultDay.date == changedDay.date){
                                existedDayIndex = index;
                            }
                        });

                        if(existedDayIndex >= 0 && changedDay.dayId){
                            $scope.company.defaultValues[existedDayIndex].dayId = changedDay.dayId;
                        }
                        else if(existedDayIndex >= 0 && !changedDay.dayId){
                            $scope.company.defaultValues.splice(existedDayIndex, 1);
                        }
                        else if(changedDay){
                            $scope.company.defaultValues.push({date: changedDay.date, dayId: changedDay.dayId});
                        }

                        calendarService.saveCompany($scope.company).success(function() {
                            Notification.success('Changes saved');
                        });
                    }
                }, true);
            }

            //var daysYear = $scope.calendar;

            function resetPeriodsSplitters(){
                $scope.calendar.forEach(function (day) {
                    if (day.date) {
                        day.isPeriodStartDate = false;
                        day.isPeriodEndDate = false;
                    }
                });
            }

            $scope.introSteps = [
                {
                    element: '.calendar-wrapper',
                    intro: "<p>In this section you could see the list of months." +
                    "Each day contain the date and the default workload of this day.</p>" +
                    "<p>By default all weekend days are colored with light blue color.</p>" +
                    "<p>You can change the workload and color of each day by clicking on this day and choosing from the collection of Day Types.</p>" +
                    "<p>You can create and edit the periods of Company. All periods splitters are marked on Calendar with blue vertical lines. " +
                    "Clicking on period splitter will remove it and merge two periods between it. Click on border of any two days will create the period " +
                    "splitter and split the current period in two.</p>",
                    position: 'right'
                },
                {
                    element: '#step3',
                    intro: "<p>Use Day Types controls to manage new Day Types. </p>" +
                    "<p>Press the Plus hexagon to add a new Day Type. </p>" +
                    "<p>Click on existed Day Type Name will change it\'s name. </p>" +
                    "<p>Click on workload will change the workload of current Day Type. </p>" +
                    "<p>Click inside existed Day Type Hexagon will allow you to select the color for edited Day Type." +
                    "Changing the Color of Day Type will change all days of this type in Calendar and all Timesheet days for chosen Day Type in calendar. </p>",
                    position: 'left'
                }
            ];
            //Unused function
            /*$scope.splitCalendar = function(shouldBeSplitted, period, splitStartDate) {
                if(period == 'month' && splitStartDate.getDate() > 28){
                    alert('Please choose the correct date for split');
                    return;
                }

                switch(period){
                    case 'Week':
                        var startWeekDay = splitStartDate.getDay(),
                            endWeekDay = startWeekDay == 0 ? 6 : startWeekDay - 1;

                        $scope.calendar.forEach(function(day) {
                            if(day.date){
                                var currentDateWeekDay = new Date(day.date).getDay();

                                if(day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))){
                                    if(currentDateWeekDay == startWeekDay){
                                        day.isPeriodStartDate = shouldBeSplitted;
                                    }
                                    else if(currentDateWeekDay == endWeekDay){
                                        day.isPeriodEndDate = shouldBeSplitted;
                                    }
                                }
                            }
                        });
                        break;

                    case 'Month':
                        var startDateDay = splitStartDate.getDate();

                        $scope.calendar.forEach(function(day) {
                            var currentDateDay,
                                endDateDay;

                            if(day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))){
                                currentDateDay = new Date(day.date).getDate();
                                endDateDay = startDateDay - 1 || new Date(moment(new Date(day.date)).endOf('month').format('MMMM YYYY')).getDate();

                                if(currentDateDay == startDateDay){
                                    day.isPeriodStartDate = shouldBeSplitted;
                                }
                                else if(currentDateDay == endDateDay){
                                    day.isPeriodEndDate = shouldBeSplitted;
                                }
                            }
                        });
                        break;
                }

                $scope.calendar[$scope.calendar.length - 1].isPeriodEndDate = true;
                $scope.aggregatePeriods($scope.calendar);
            };*/

            //used by tableCell directive
            $scope.aggregatePeriods = function(calendar) {
                var periodSplitters = [],
                    periods = [];

                calendar.forEach(function(day) {
                    if(day.isPeriodStartDate){
                        periodSplitters.push({'start': day.date});
                    }

                    if(day.isPeriodEndDate){
                        periodSplitters.push({'end': day.date});
                    }
                });

                periods = _.groupBy(periodSplitters, function(element, index) {
                    return Math.floor(index / 2);
                });

                periods = _.toArray(periods);
                _.map(periods, function(period, index) {
                    periods[index] = angular.extend(period[0], period[1])
                });

                $scope.company.periods = periods;
            };

            $scope.openCalendar = function() {
                $scope.calendarIsOpened = true;
            };

            $scope.getMonthName = function(month) {
                //get last day of first week
                for(var i in month){
                    return moment(new Date(month[i][month[i].length - 1].date)).format('MMMM YYYY');
                }
            };

            $scope.chooseDayType = function(day, dayType) {
                if(dayType){
                    var customDay = _.find($scope.company.dayTypes, {id: dayType.id});

                    day.dayId = customDay.id;
                    day.color = customDay.color;
                    day.time = customDay.time;
                    day.comment = customDay.name;
                }
                else{
                    delete day.dayId;
                    delete day.color;
                    day.comment = '';
                    day.time = 8;
                }
            };

            $scope.saveDayType = _.debounce(function(changedDayType, changedDayTypeOldValue) {
                //applyDefaultValues();

                calendarService.saveCompany($scope.company).success(function(data) {
                    $scope.company.dayTypes = data.dayTypes;
                });
            }, 500);

            $scope.calculatePeriods = function() {
                var firstPeriod = moment();

                generateCalendar();
                $scope.company.periods = [];
                $scope.company.period = {
                    amount: $scope.countPeriodSetting,
                    unit: $scope.periodSetting
                };
                resetPeriodsSplitters();
                generatePeriods(firstPeriod);
                updateCalendarDaysWithPeriods();

                preferences.set('currentPeriodIndex', 0);
            };

            $scope.GenerateMoreDays = function() {

                var lastPeriodEnd = $scope.company.periods[$scope.company.periods.length - 1].end,
                    newPeriodStartDays = moment(new Date(lastPeriodEnd)).add(1, 'days');

                generatePeriods(newPeriodStartDays);
                generateCalendar();
            };

            function generatePeriods(newPeriodStartDays) {
                var startDate = moment(new Date(newPeriodStartDays)),
                    endDate = moment(new Date(newPeriodStartDays)).add(365, 'days');

                if($scope.periodSetting == "Weekly") {
                    enumerateDaysBetweenDates(startDate, endDate, 'week');
                }
                else if($scope.periodSetting == "Monthly"){
                    enumerateDaysBetweenDates(startDate, endDate, 'month');
                }
                else{
                    enumerateDaysBetweenDates(startDate, endDate, 'days');
                }
                $scope.company.countPeriodSetting = $scope.countPeriodSetting;
                $scope.company.periodSetting = $scope.periodSetting;
            }

            function enumerateDaysBetweenDates(startDate, endDate, step) {
                var now = startDate.clone().startOf('week');

                while (now.isBefore(endDate) || now.isSame(endDate)) {
                    $scope.company.periods.push({
                        start: now.format('MM/DD/YYYY'),
                        end: now.add(step, 1).format('MM/DD/YYYY')
                    });
                }
            };

            $scope.getDayColor = function(dayId) {
                if(dayId){
                    var dayType = _.findWhere($scope.company.dayTypes, {id: dayId});

                    if(dayType){
                        return dayType.color;
                    }
                }
            };

            $scope.changePeriodSplit = function(period) {
                $scope.selectedPeriod = period;
            };

            $scope.removeCustomDayTemplate = function(customDay) {
                var customDayIndex = _.findIndex($scope.company.dayTypes, customDay);

                $scope.company.dayTypes.splice(customDayIndex, 1);

                //remove assigned dayTypes
                $scope.company.defaultValues.forEach(function(defaultValue, index) {
                    if(defaultValue.dayId == customDay.id){
                        $scope.company.defaultValues.splice(index, 1)
                    }
                });

                //revert to default values
                $scope.calendar.map(function(day) {
                    if(day.dayId == customDay.id){
                        day.time = 8;
                        delete day.dayId;
                    }
                    return day
                });

                calendarService.saveCompany($scope.company);
            };
        }]);
