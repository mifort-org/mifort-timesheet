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

angular.module('mifortTimesheet.timesheet', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/timesheet', {
            templateUrl: 'timesheet/timesheetView.html',
            controller: 'timesheetController'
        });
    }])

    .controller('timesheetController', ['$scope', 'timesheetService', 'calendarService', 'preferences', 'loginService', '$timeout', 'Notification',
        function($scope, timesheetService, calendarService, preferences, loginService, $timeout, Notification) {
            var user;

            $scope.projects = [];
            $scope.isCollapsed = false;
            $scope.timesheetKeys = timesheetService.getTimesheetKeys();

            loginService.getUser().success(function(loggedUser) {
                if(loggedUser){
                    var uniqueProjectAssignments = [],
                        loadedProjects = 0;

                    user = loggedUser;

                    user.assignments.forEach(function(assignment) {
                        uniqueProjectAssignments.push(assignment.projectId);
                    });
                    uniqueProjectAssignments = _.uniq(uniqueProjectAssignments);

                    //get timesheets
                    if(!uniqueProjectAssignments.length){
                        $scope.noAssignments = true;
                    }

                    uniqueProjectAssignments.forEach(function(assignment, index) {
                        timesheetService.getProject(assignment).success(function(project) {
                            if(project && project.active){
                                project.assignments = _.where(user.assignments, {projectId: project._id});
                                //$scope.projects.push(project);
                                $scope.projects.splice(index, 0, project);
                            }

                            loadedProjects++;
                        }).then(function() {
                            //when all projects are loaded
                            if(loadedProjects == uniqueProjectAssignments.length){
                                $scope.init();
                            }
                        });
                    });
                }
            });

            $scope.init = function() {
                $scope.projects.forEach(function(project) {
                    var today = moment();

                    project.currentPeriodIndex = 0;

                    //scroll into cuttent week
                    project.periods.forEach(function(period, periodIndex) {
                        var momentStart = moment(new Date(period.start)),
                            momentEnd = moment(new Date(period.end));

                        if(today.isBetween(momentStart, momentEnd) || today.isSame(momentStart, 'day') || today.isSame(momentEnd, 'day')){
                            project.currentPeriodIndex = periodIndex;
                        }
                    });

                    initPeriod(project, project.currentPeriodIndex);
                });
            };

            $scope.IntroSteps = [
                {
                    element: '#step1',
                    intro: "<p>Click on arrow will minimize/maximize the section</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Use periods switch arrows (next and previous) to switch the period</p>",
                    position: 'left'
                },
                {
                    element: '#step3',
                    intro: "<p>Table of logs has four columns:" +
                    "<ul class=\"dotted" +
                    "gn\"><li>Date - is not editable but you can add several logs to the current date by pressing the blue plus icon next to Date field." +
                    "New row for log created for current date will have the red minus icon that will delete the log on click</li>" +
                    "<li>Role - dropdown with your roles of this project. If it is only one role it is selected by default." +
                    "There is no possibility to log time with empty role.</li>" +
                    "<li>Time - numeric input where you log." +
                    "Empty input shows placeholder with minimum of your workload (personal workload how much time this person works per day) and project assignment workload.</li>" +
                    "<li>Comment - input where you write detailed description of tasks which you done at logged time.</li></ul>" +
                    "<p>Each day will may have a background color and workload according to Timesheet Calendar option created by Owner/HR/Manager. </p>",
                    position: 'bottom'
                }
            ];

            function initPeriod(project, periodIndex) {
                var startDate = project.periods[periodIndex].start,
                    endDate = project.periods[periodIndex].end;

                project.periods[periodIndex].timesheet = [];
                project.periods[periodIndex].userTimesheets = [];

                timesheetService.getTimesheet(user._id, project._id, startDate, endDate).success(function(dataTimesheet) {
                    project.periods[periodIndex].userTimesheets.push.apply(project.periods[periodIndex].userTimesheets, dataTimesheet.timelog);
                }).then(function() {
                    var projectIndex = _.findIndex($scope.projects, {_id: project._id});

                    generateDaysTemplates(project, periodIndex);
                    applyUserTimesheets(project, periodIndex);
                    applyProjectDefaultValues(project, periodIndex);
                    initWatchers(projectIndex, periodIndex);
                });
            }

            function applyUserTimesheets(project, periodIndex) {
                var period = project.periods[periodIndex];

                project.periods[periodIndex].userTimesheets.forEach(function(day, index) {
                    var timesheetDayIndex = _.findIndex(period.timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")}),
                        sameDateDays,
                        lastDayWithSameDate;

                    if(timesheetDayIndex != -1){
                        sameDateDays = _.where(period.timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});
                        lastDayWithSameDate = _.findIndex(period.timesheet, {_id: sameDateDays[sameDateDays.length - 1]._id});

                        delete day.color;

                        //if current iterated log is not the first for this date to push
                        if(project.periods[periodIndex].timesheet[index - 1] && project.periods[periodIndex].timesheet[index - 1].date == day.date){
                            if(!period.timesheet[timesheetDayIndex]._id){
                                day.isFirstDayRecord = true;
                                period.timesheet[timesheetDayIndex] = day;
                            }
                            else{
                                day.isFirstDayRecord = false;
                                day.position = day.position ? day.position : period.timesheet[timesheetDayIndex].position + 1;
                                period.timesheet.splice(lastDayWithSameDate + 1, 0, day);
                            }
                        }
                        else{
                            day.isFirstDayRecord = true;
                            if(!_.findWhere(period.timesheet, {date: day.date}).comment){
                                _.findWhere(period.timesheet, {date: day.date}).comment = day.comment;
                            }
                            angular.extend(period.timesheet[timesheetDayIndex], day);
                        }
                    }

                });
            }

            function applyProjectDefaultValues(project, periodIndex) {
                if(project.defaultValues){
                    project.defaultValues.forEach(function(day) {
                        var existedDays = _.where(project.periods[periodIndex].timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});

                        if(existedDays.length && day.dayId){
                            existedDays.forEach(function(existedDay) {
                                existedDay.color = _.findWhere(project.dayTypes, {id: day.dayId}).color;

                                if(!existedDay.comment){
                                    existedDay.comment = day.comment;
                                }
                            });
                        }
                    });
                }
            }

            function generateDaysTemplates(project, periodIndex) {
                var startDate = moment(new Date(project.periods[periodIndex].start)),
                    endDate = moment(new Date(project.periods[periodIndex].end)),
                    daysToGenerate = endDate.diff(startDate, 'days');

                for(var i = 0; i < daysToGenerate + 1; i++){
                    var dayToPush;

                    //TODO: to template
                    project.template.userId = user._id;
                    project.template.projectId = project._id;
                    project.template.projectName = project.name;
                    delete project.template.time;

                    dayToPush = _.clone(project.template);
                    dayToPush.date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");
                    dayToPush.role = project.assignments[0].role;
                    dayToPush.isFirstDayRecord = true;
                    dayToPush.userName = user.displayName;

                    project.periods[periodIndex].timesheet.push(dayToPush);
                }
            }

            function initWatchers(projectIndex, periodIndex) {
                var timer = null;

                $scope.$watch('projects[' + projectIndex + '].periods[' + periodIndex + '].timesheet', function(newValue, oldValue) {
                    if(newValue != oldValue && newValue.length >= oldValue.length){
                        var timesheetToSave = _.map(newValue, _.clone);

                        if(timer){
                            $timeout.cancel(timer);
                        }

                        timer = $timeout(function() {
                            timesheetService.updateTimesheet(user._id, timesheetToSave).success(function(data) {
                                var periodTimesheet = $scope.projects[projectIndex].periods[periodIndex].timesheet,
                                    noIdLog = _.find(periodTimesheet, function(log) {
                                        return !log._id;
                                    });

                                if(noIdLog){
                                    angular.extend(periodTimesheet, data.timesheet);
                                }

                                Notification.success('Changes saved');
                            });
                        }, 500);
                    }
                }, true);
            }

            $scope.addLog = function(log, project, periodIndex) {
                var newRow = angular.copy(project.template),
                    currentPeriod = project.periods[periodIndex].timesheet,
                    dayPeriodIndex = _.findIndex(currentPeriod, {date: log.date}),
                    sameDateDays = _.filter(currentPeriod, function(existedLog) {
                        return existedLog.date == log.date;
                    }),
                    maxPosition = 0;

                sameDateDays.forEach(function(sameDateDay) {
                    if(sameDateDay.position > maxPosition){
                        maxPosition = sameDateDay.position;
                    }
                });

                newRow.date = log.date;
                newRow.userName = log.userName;
                newRow.color = log.color;
                newRow.role = log.role;
                newRow.isFirstDayRecord = false;
                newRow.position = maxPosition + 1;

                //angular.extend(newRow, {
                //    date: log.date,
                //    userName: log.userName,
                //    color: log.color,
                //    role: log.role,
                //    isFirstDayRecord: false,
                //    position: maxPosition + 1
                //});

                currentPeriod.splice(dayPeriodIndex + sameDateDays.length, 0, newRow);
            };

            $scope.removeRow = function(log, project, periodIndex) {
                if(log._id){
                    var dayPeriodIndex = _.findIndex(project.periods[periodIndex].timesheet, {_id: log._id});
                    timesheetService.removeTimesheet(log).success(function() {
                        Notification.success('Changes saved');
                    });

                    project.periods[periodIndex].timesheet.splice(dayPeriodIndex, 1);
                }
            };

            $scope.showPreviousPeriod = function(project) {
                if(project.currentPeriodIndex){
                    project.currentPeriodIndex--;

                    if(!project.periods[project.currentPeriodIndex].timesheet){
                        initPeriod(project, project.currentPeriodIndex);
                    }
                }
            };

            $scope.showNextPeriod = function(project) {
                if(project.currentPeriodIndex < project.periods.length - 1){
                    project.currentPeriodIndex++;

                    if(!project.periods[project.currentPeriodIndex].timesheet){
                        initPeriod(project, project.currentPeriodIndex);
                    }
                }
            };

            $scope.getTimePlaceholder = function(log, project) {
                var timePlaceholder = 8,
                    assignment = _.findWhere(project.assignments, {role: log.role, projectId: log.projectId});

                if(assignment){
                    timePlaceholder = assignment.workload;
                }

                return timePlaceholder;
            };

            $scope.status = {
                isOpen: false
            };

            $scope.toggleDropdown = function($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.status.isOpen = !$scope.status.isOpen;
            };

            $scope.assignRole = function(role, log) {
                log.role = role;
            };

            $scope.getWeekDay = function(date) {
                return moment(new Date(date)).format("dddd");
            };

            $scope.isToday = function(date) {
                return moment(new Date(date)).isSame(new Date(), 'day');
            };

            $scope.isLastTodaysRecord = function(timesheet, index) {
                if(timesheet[index + 1]){
                    return timesheet[index].date != timesheet[index + 1].date;
                }
            };
        }]);