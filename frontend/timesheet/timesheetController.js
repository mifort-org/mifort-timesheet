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

angular.module('mifortTimelog.timesheet', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/timesheet', {
            templateUrl: 'timesheet/timesheetView.html',
            controller: 'timesheetController'
        });
    }])

    .controller('timesheetController', ['$scope', '$filter', 'timesheetService', 'moment', 'preferences', 'Notification', 'notifyingService',
        function($scope, $filter, timesheetService, moment, preferences, Notification, notifyingService) {
            $scope.daySettingsPopover = {
                templateUrl: 'daySettimgs.html'
            };
            $scope.periodSettings = timesheetService.getPeriodSettings();
            $scope.weekDays = timesheetService.getWeekDays();

            timesheetService.getCompany(preferences.get('user').companyId).success(function(data) {
                $scope.company = data;
            }).then(function() {
                $scope.init();
            });

            $scope.selectedPeriod = $scope.periodSettings[0]; //default period is week
            $scope.splittedTimesheet = [];
            $scope.calendarIsOpened = false;

            //check and remove
            $scope.range = function(n) {
                return new Array(n);
            };

            $scope.init = function() {
                generateTimesheet();
                initWatchers();
            };

            function generateTimesheet() {
                $scope.startDate = new Date($scope.company.periods[0].start); //default for peridos split date
                $scope.timesheet = [];
                $scope.splittedTimesheet = [];

                var startDate = moment(new Date($scope.company.periods[0].start)),
                    endDate = moment(new Date($scope.company.periods[$scope.company.periods.length - 1].end)),
                    daysToGenerate = endDate.diff(startDate, 'days') + 1;

                for(var i = 0; i < daysToGenerate; i++){
                    var dayToPush = _.clone($scope.company.template);
                    dayToPush.date = moment(new Date(startDate)).add(i, 'days').format("MM/DD/YYYY");
                    $scope.timesheet.push(dayToPush);
                }

                $scope.company.periods.forEach(function(period) {
                    if(period.start){
                        _.findWhere($scope.timesheet, {date: moment(new Date(period.start)).format('MM/DD/YYYY')}).isPeriodStartDate = true;
                    }

                    if(period.end){
                        _.findWhere($scope.timesheet, {date: moment(new Date(period.end)).format('MM/DD/YYYY')}).isPeriodEndDate = true;
                    }
                });

                //Splitting the timesheet
                $scope.timesheet.forEach(function(day, index) {
                    generateTimesheetTables(day, index);
                });

                applyDefaultValues();
            }

            function applyDefaultValues() {
                if($scope.company.defaultValues){
                    $scope.company.defaultValues.forEach(function(day) {
                        if(day && day.date){
                            var dayExisted = _.findWhere($scope.timesheet, {date: moment(new Date(day.date)).format('MM/DD/YYYY')});
                        }

                        if(dayExisted){
                            angular.extend(dayExisted, day);
                        }
                    });
                }
            }

            function generateTimesheetTables(day, index) {
                var currentDate = new Date(day.date),
                    currentDayWeek = moment(currentDate).get('week'),
                    currentDayMonth = moment(currentDate).get('month'),
                    currentDayYear = moment(currentDate).get('year') - moment(new Date()).get('year'),
                    daysBeforeTimesheetStart = moment(currentDate).weekday(),
                    daysAfterTimesheetEnd = $scope.timesheet[index - 1] && 6 - moment(new Date($scope.timesheet[index - 1].date)).weekday(),
                    generatedDay;

                //last week reset
                if(currentDayWeek == 53 && $scope.splittedTimesheet[currentDayYear - 1]){
                    currentDayWeek = 0;
                }

                function generateCurrentMonth() {
                    $scope.splittedTimesheet[currentDayYear][currentDayMonth] = [];
                }

                function generateCurrentWeek() {
                    $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek] = [];
                }

                function generatePreviousMonthDays() {
                    for(var k = 0; k < daysBeforeTimesheetStart; k++){
                        generatedDay = _.clone($scope.company.template);
                        generatedDay.date = moment(currentDate).subtract(k + 1, 'day').format('MM/DD/YYYY');
                        generatedDay.disabled = true;
                        $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].unshift(generatedDay);
                    }

                    $scope.splittedTimesheet[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                }

                function generateNextMonthDays() {
                    var previousMonth;

                    if($scope.splittedTimesheet[currentDayYear].length && $scope.splittedTimesheet[currentDayYear][currentDayMonth - 1]){
                        //get current year month
                        previousMonth = $scope.splittedTimesheet[currentDayYear][currentDayMonth - 1];
                    }
                    else{
                        //get previous year month
                        previousMonth = $scope.splittedTimesheet[currentDayYear - 1][$scope.splittedTimesheet[currentDayYear - 1].length - 1];
                    }

                    for(var i = 0; i < daysAfterTimesheetEnd; i++){
                        generatedDay = _.clone($scope.company.template);
                        generatedDay.date = moment(currentDate).subtract(i, 'day').format('MM/DD/YYYY');
                        generatedDay.disabled = true;
                        previousMonth[previousMonth.length - 1].push(generatedDay);
                    }
                }


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
                        generateCurrentMonth();
                        generateCurrentWeek();

                        //generate days after previous month end
                        if($scope.splittedTimesheet[currentDayYear][currentDayMonth - 1]){
                            generateNextMonthDays();
                        }

                        generatePreviousMonthDays();
                    }
                }
                else{
                    $scope.splittedTimesheet[currentDayYear] = [];

                    generateCurrentMonth();
                    generateCurrentWeek();

                    //generate days after previous year end
                    if($scope.splittedTimesheet[currentDayYear - 1]){
                        generateNextMonthDays();
                    }

                    generatePreviousMonthDays();
                }
            }

            function initWatchers() {
                $scope.$watch('timesheet', function(newValue, oldValue) {
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
                        else{
                            $scope.company.defaultValues.push({date: changedDay.date, dayId: changedDay.dayId});
                        }
                    }

                    timesheetService.saveCompany($scope.company).success(function() {
                        Notification.success('Changes saved');
                    });
                }, true);
            }

            $scope.IntroSteps = [
                {
                    element: '#step1',
                    intro: "<p>Here you could see the list of months with tables containing all month\'s days splitted by rows by month weeks. " +
                    "Each day contain the date and the default workload of this day.</p>" +
                    "<p>By default all weekend days are colored with light blue color.</p>" +
                    "<p>You can change the workload and color of each day by clicking on this day and choosing from the collection of Day Types.</p>" +
                    "<p>User have ability to create and edit the periods of Company. All periods splitters are marked on Calendar with blue vertical lines. " +
                    "Clicking on period splitter will remove it and merge two periods between it. Click on border of any two days will create the period " +
                    "splitter and split the current period in two.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>The control panel at the right has the autosplitting engine that allows the user to split all months automatically. " +
                    "Choosing the report period (Month, Week) and the Start date of splitting and pressing the blue \"Split\" button will generate periods for all year.</p>",
                    position: 'left'
                },
                {
                    element: '#step3',
                    intro: "<p>To add new Day Types user could use the right part of page controls. </p>" +
                    "Pressing the Plus hexagon will add new Day Type. </p>" +
                    "Clicking the existed Day Type Name will allow user to change it\'s name. </p>" +
                    "Click on the workload will allow user to change the workload of the current Day Type. </p>" +
                    "Clicking inside of exists Day Type Hexagon will allow user to select the color for edited day type. </p>" +
                    "Changing the Color of Day Type will change all days of this type in Calendar and all Timelogs days for chosen Day Type in calendar. </p>" +
                    "Clicking on red cross next to each Day Type in controls panel will remove this Day Type from list, remove all days of this type from Calendar and Timelogs.</p>",
                    position: 'left'
                }
            ];

            $scope.splitTimesheet = function(period, splitStartDate) {
                if(period.periodName == 'month' && splitStartDate.getDate() > 28){
                    alert('Please choose the correct date for split');
                    return;
                }

                switch(period.periodName){
                    case 'Week':
                        var startWeekDay = splitStartDate.getDay(),
                            endWeekDay = startWeekDay == 0 ? 6 : startWeekDay - 1;

                        $scope.timesheet.forEach(function(day) {
                            if(day.date){
                                var currentDateWeekDay = new Date(day.date).getDay();

                                if(day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))){
                                    if(currentDateWeekDay == startWeekDay){
                                        day.isPeriodStartDate = true;
                                    }
                                    else if(currentDateWeekDay == endWeekDay){
                                        day.isPeriodEndDate = true;
                                    }
                                }
                            }
                        });
                        break;

                    case 'Month':
                        var startDateDay = splitStartDate.getDate();

                        $scope.timesheet.forEach(function(day) {
                            var currentDateDay,
                                endDateDay;

                            if(day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))){
                                currentDateDay = new Date(day.date).getDate();
                                endDateDay = startDateDay - 1 || new Date(moment(new Date(day.date)).endOf('month').format('MMMM YYYY')).getDate();

                                if(currentDateDay == startDateDay){
                                    day.isPeriodStartDate = true;
                                }
                                else if(currentDateDay == endDateDay){
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
            $scope.aggregatePeriods = function(timesheet) {
                var periodSplitters = [],
                    periods = [];

                timesheet.forEach(function(day) {
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
                    delete day.comment;
                    day.time = 8;
                }
            };

            $scope.saveDayType = function(changedDayType, changedDayTypeOldValue) {
                $scope.company.defaultValues.forEach(function(defaultValue) {
                    if(changedDayTypeOldValue && defaultValue.comment == changedDayTypeOldValue.name){
                        angular.extend(defaultValue, changedDayType);
                    }
                });

                applyDefaultValues();

                timesheetService.saveCompany($scope.company);
            };

            $scope.GenerateMoreDays = function() {
                var lastPeriodEnd = $scope.company.periods[$scope.company.periods.length - 1].end,
                    newPeriodStart = moment(new Date(lastPeriodEnd)).add(i + 1, 'days'),
                    nextPeriodStart,
                    weeksToGenerate = 52, //weeks in year
                    i;

                for(i = 0; i < weeksToGenerate; i++){
                    nextPeriodStart = moment(new Date(newPeriodStart)).add(i * 7, 'days');

                    $scope.company.periods.push({
                        end: nextPeriodStart.add(7, 'days').format('MM/DD/YYYY'),
                        start: nextPeriodStart.format('MM/DD/YYYY')
                    });
                }

                generateTimesheet();
            };

            $scope.getDayColor = function(dayId) {
                if(dayId){
                    var dayType = _.findWhere($scope.company.dayTypes, {id: dayId});

                    return dayType.color;
                }
            };

            $scope.changePeriodSplit = function(period) {
                $scope.selectedPeriod = period;
            };

            $scope.removeCustomDayTemplate = function(customDay) {
                var customDayIndex = _.findIndex($scope.company.dayTypes, customDay);

                $scope.company.dayTypes.splice(customDayIndex, 1);

                timesheetService.saveCompany($scope.company);
            };
        }]);