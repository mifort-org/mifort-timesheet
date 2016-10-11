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

        $routeProvider.when('/timesheet/:userId', {
            templateUrl: 'timesheet/timesheetView.html',
            controller: 'timesheetController'
        });
    }])

    .controller('timesheetController', ['$scope', 'timesheetService', 'calendarService', 'preferences', 'loginService', '$routeParams', '$timeout', 'Notification', "$q",
        function($scope, timesheetService, calendarService, preferences, loginService, $routeParams, $timeout, Notification, $q) {
            var user;

            $scope.projects = [];
            $scope.currentPeriodIndex = 0;
            $scope.timesheetKeys = timesheetService.getTimesheetKeys();
            $scope.logs = [];
            $scope.customUserId = $routeParams.userId;

            loginService.getUser($scope.customUserId).success(function(loggedUser) {
                if(loggedUser){
                    $scope.loading = true;

                    var uniqueProjectAssignments = [],
                        loadedProjects = 0;

                    $scope.customUserName = loggedUser.displayName;
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
                                //project.loading = true;

                                $scope.projects.splice(index, 0, project);
                            }

                            loadedProjects++;
                        }).then(function() {
                            //when all projects are loaded
                            $scope.projects = $scope.getSortedProjects();
                            if(loadedProjects == uniqueProjectAssignments.length){
                                $scope.init();
                            }
                        });
                    });
                }
            });

            $scope.init = function() {
                var promises = [];

                $scope.projects.forEach(function(project) {
                    var today = moment();

                    //scroll into cuttent week
                    project.periods.forEach(function(period, periodIndex) {
                        var momentStart = moment(new Date(period.start)),
                            momentEnd = moment(new Date(period.end));

                        if(today.isBetween(momentStart, momentEnd) || today.isSame(momentStart, 'day') || today.isSame(momentEnd, 'day')){
                            $scope.currentPeriodIndex = preferences.get('currentPeriodIndex') || periodIndex || 0;
                        }
                    });

                    promises.push(initPeriod(project, $scope.currentPeriodIndex));
                });

                $q.all(promises).then(function (){
                    $scope.logs.push({index: $scope.currentPeriodIndex, data: $scope.groupDatePeriodsProjects()});
                    initWatchers("logs[" + ($scope.logs.length - 1) + "].data");
                    $scope.loading = false;
                });
            };

            $scope.introSteps = timesheetService.introSteps;

            function initPeriod(project, periodIndex) {
                var startDate = project.periods[periodIndex].start,
                    endDate = project.periods[periodIndex].end;

                project.periods[periodIndex].timesheet = [];
                project.periods[periodIndex].userTimesheets = [];

                //project.loading = true;

                return timesheetService.getTimesheet(user._id, project._id, startDate, endDate).success(function(dataTimesheet) {
                    project.periods[periodIndex].userTimesheets.push.apply(project.periods[periodIndex].userTimesheets, dataTimesheet.timesheet);
                }).then(function() {
                    //var projectIndex = _.findIndex($scope.projects, {_id: project._id});

                    generateDaysTemplates(project, periodIndex);
                    applyUserTimesheets(project, periodIndex);
                    applyProjectDefaultValues(project, periodIndex);

                    //$scope.logs = $scope.groupDatePeriodsProjects();

                    //initWatchers(projectIndex, periodIndex);
                    //$timeout(function() {
                    //    project.loading = false;
                    //});
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

                        //reset client saved data
                        delete day.color;
                        delete day.placeholder;
                        day.timePlaceholder = sameDateDays[0].timePlaceholder;

                        //if current iterated log is not the first for this date to push
                        if(project.periods[periodIndex].timesheet[timesheetDayIndex] && project.periods[periodIndex].timesheet[timesheetDayIndex].date == day.date){
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
                                var assignedDayType = _.findWhere(project.dayTypes, {id: day.dayId});

                                existedDay.color = assignedDayType.color;
                                existedDay.placeholder = assignedDayType.name;

                                if(!existedDay.timePlaceholder){
                                    existedDay.timePlaceholder = assignedDayType.time;
                                }
                                if(assignedDayType.time < existedDay.timePlaceholder){
                                    existedDay.timePlaceholder = assignedDayType.time;
                                }
                            });
                        }
                    });
                }
            }

            function generateDaysTemplates(project, periodIndex) {
                var startDate = moment(new Date(project.periods[periodIndex].start)),
                    endDate = moment(new Date(project.periods[periodIndex].end)),
                    daysToGenerate = endDate.diff(startDate, 'days'),
                    userRole = project.assignments[0].role,
                    assignment = _.findWhere(project.assignments, {role: userRole, projectId: project._id}),
                    timePlaceholder = 8;

                for(var i = 0; i < daysToGenerate + 1; i++){
                    var dayToPush;

                    //TODO: to template
                    project.template.userId = user._id;
                    //project.template.projectId = project._id;
                    //project.template.projectName = project.name;
                    delete project.template.time;

                    dayToPush = _.clone(project.template);
                    dayToPush.date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");//DD/MMM/ddd
                    dayToPush.role = userRole;
                    dayToPush.isFirstDayRecord = true;
                    dayToPush.userName = user.displayName;
                    // if(assignment){
                    //     timePlaceholder = assignment.workload;
                    // }
                    dayToPush.timePlaceholder = timePlaceholder;

                    project.periods[periodIndex].timesheet.push(dayToPush);
                }
            }

            function initWatchers(property) {
                var timer = null;

                $scope.$watch(property, function(newValue, oldValue) {
                    if(!_.isEqual($scope.getNotEmptyLogs(newValue), $scope.getNotEmptyLogs(oldValue))){
                        var timesheetToSave = angular.copy($scope.getNotEmptyDates());

                        timesheetToSave.map(function(log) {
                            if(log.time !== '' && log.time !== null){
                                log.time = +log.time;
                            }
                            if (log.time == "") {
                                log.time = null;
                            }
                            return log;
                        });

                        if(timer){
                            $timeout.cancel(timer);
                        }

                        var logsToDelete = angular.copy($scope.getLogsToDelete());

                        if (logsToDelete.length || timesheetToSave.length) {
                            timer = $timeout(function () {
                                timesheetService.updateTimesheet(user._id, timesheetToSave, logsToDelete).success(function (data) {
                                    //var periodTimesheet = $scope.projects[projectIndex].periods[periodIndex].timesheet,
                                    var periodTimesheet = $scope.getNotEmptyDates(),
                                        noIdLog = _.find(periodTimesheet, function (log) {
                                            return !log._id;
                                        });

                                    if (noIdLog) {
                                        var dates = $scope.getDates();
                                        var index = 0;
                                        dates.forEach(function (item) {
                                            if (item.time || item.comment) {
                                                if (!item._id) {
                                                    item._id = data.timesheet[index]._id;
                                                }
                                                index++;
                                            }
                                        });
                                        //angular.extend(periodTimesheet, data.timesheet);
                                    }
                                    else {
                                        Notification.success('Changes saved');
                                    }
                                });
                            }, 500);
                        }
                    }
                }, true);
            }

            $scope.addLog = function(log, project, periodIndex) {
                var newRow = angular.copy(project.template),
                    currentPeriod = $scope.getDates(),
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
                newRow.placeholder = log.placeholder;
                newRow.timePlaceholder = log.timePlaceholder;
                newRow.role = log.role;
                newRow.isFirstDayRecord = false;
                newRow.position = maxPosition + 1;

                $scope.setDefaultProject(newRow);

                //angular.extend(newRow, {
                //    date: log.date,
                //    userName: log.userName,
                //    color: log.color,
                //    role: log.role,
                //    isFirstDayRecord: false,
                //    position: maxPosition + 1
                //});

                newRow.hasLog = true;
                var dates = $scope.getDates();
                dates.splice(dayPeriodIndex + sameDateDays.length, 0, newRow);

                //$scope.logs = $scope.groupDatePeriodsProjects();
            };

            $scope.removeRow = function(log, project, periodIndex) {
                var dates = $scope.getDates();

                if(log._id){
                    timesheetService.removeTimesheet(log).success(function() {
                        Notification.success('Changes saved');
                    });


                    //project.periods[periodIndex].timesheet.splice(dayPeriodIndex, 1);

                    //$scope.logs = $scope.groupDatePeriodsProjects();
                }

                dates.splice(dates.indexOf(log), 1);
            };

            $scope.onChangeProjectId = function(log) {
                var project = _.where($scope.projects, {_id: log.projectId})[0];
                log.projectName = project ? project.name : '';
            };

            $scope.showPreviousPeriod = function(projects) {
                var lastPeriod = $scope.currentPeriodIndex;

                if($scope.currentPeriodIndex){
                    $scope.currentPeriodIndex--;

                    var promises = [];
                    projects.forEach(function(project) {
                        project.lastPeriodRecords = project.periods[lastPeriod].timesheet.length;

                        if(!project.periods[$scope.currentPeriodIndex].timesheet){
                            promises.push(initPeriod(project, $scope.currentPeriodIndex));
                        }
                    });

                    $q.all(promises).then(function() {
                        var log = _.filter($scope.logs, function(log) {
                            return log.index == $scope.currentPeriodIndex;
                        })[0];
                        if (!log) {
                            $scope.logs.push({ index: $scope.currentPeriodIndex, data: $scope.groupDatePeriodsProjects() });
                            initWatchers("logs[" + ($scope.logs.length - 1) + "].data");
                        }
                    });
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            $scope.showNextPeriod = function(projects) {
                var lastPeriod = $scope.currentPeriodIndex;

                if($scope.currentPeriodIndex < projects[0].periods.length - 1){
                    $scope.currentPeriodIndex++;

                    var promises = [];
                    projects.forEach(function(project) {
                        project.lastPeriodRecords = project.periods[lastPeriod].timesheet.length;

                        if(!project.periods[$scope.currentPeriodIndex].timesheet){
                            promises.push(initPeriod(project, $scope.currentPeriodIndex));
                        }
                    });

                    $q.all(promises).then(function() {
                        var log = _.filter($scope.logs, function(log) {
                            return log.index == $scope.currentPeriodIndex;
                        })[0];
                        if (!log) {
                            $scope.logs.push({ index: $scope.currentPeriodIndex, data: $scope.groupDatePeriodsProjects() });
                            initWatchers("logs[" + ($scope.logs.length - 1) + "].data");
                        }
                    });
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            $scope.getDates = function () {
                var log = _.filter($scope.logs, function (log) {
                    return log.index == $scope.currentPeriodIndex;
                })[0];
                return log ? log.data : [];
            };

            $scope.getSortedProjects = function () {
                return $scope.projects.sort(function(a, b) {
                    if (a.assignments[0].workload && !b.assignments[0].workload) {
                        return -1;
                    }
                    if (!a.assignments[0].workload && b.assignments[0].workload) {
                        return 1;
                    }
                    if (a.assignments[0].workload && b.assignments[0].workload) {
                        if (+a.assignments[0].workload > +b.assignments[0].workload) {
                            return -1;
                        }
                        if (+a.assignments[0].workload < +b.assignments[0].workload) {
                            return 1;
                        }
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                });
            };
            // $scope.removePlaceholder = function (e) {
            //     $(e.target).removeAttr("placeholder");
            // };

            $scope.getNotEmptyLogs = function (logs) {
                return _.filter(logs, function (item) {
                    return item.time || item.comment;
                });
            };
            $scope.getNotEmptyDates = function () {
                var log = _.filter($scope.logs, function(item) {
                    return item.index == $scope.currentPeriodIndex;
                })[0];
                if (!log) return [];
                return $scope.getNotEmptyLogs(log.data);
            };

            $scope.getLogsToDelete = function () {
                var log = _.filter($scope.logs, function(item) {
                    return item.index == $scope.currentPeriodIndex;
                })[0];
                if (!log) return [];
                return _.filter(log.data, function(item) {
                    return !item.time && !item.comment && item._id;
                });
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

            function getTotalSum() {
                var totalSum = {
                    totalLogged: 0,
                    totalExpected: 0
                };
                var dates = $scope.getDates();
                if (dates) {
                    dates.forEach(function (log) {
                        if (log.time) {
                            totalSum.totalLogged += formatTime(log.time);
                        }

                        if (log.timePlaceholder) {
                            totalSum.totalExpected += formatTime(log.timePlaceholder);
                        }
                    });
                }

                return totalSum;
            };

            $scope.groupDatePeriodsProjects = function () {
                if (!$scope.projects.length || !$scope.projects[0].periods[$scope.currentPeriodIndex].timesheet) return [];

                var allLogs = [];
                $scope.projects[0].periods[$scope.currentPeriodIndex].timesheet.forEach(function (logGroup) {
                    var logOfDate = _.filter(allLogs, function(logInAllLogs) {
                        return logInAllLogs.date == logGroup.date;
                    });

                    if (logOfDate.length == 0) {
                        $scope.projects.forEach(function (project) {
                            //if ($scope.currentPeriodIndex) {
                                var timesheet = project.periods[$scope.currentPeriodIndex].timesheet;
                                timesheet.forEach(function(log) {
                                    if (log.date == logGroup.date) {
                                        if (!log._id) {
                                            var containsEmptyLogThisDay = _.filter(allLogs, function(logInAllLogs) {
                                                return logInAllLogs.date == log.date;
                                            }).length > 0;
                                            if (!containsEmptyLogThisDay && !$scope.someProjectHasLog(log.date)) {
                                                $scope.addLogToAllLogs(log, allLogs);
                                            }
                                        }
                                        else {
                                            $scope.addLogToAllLogs(log, allLogs);
                                        }
                                    }
                                });
                            //}
                        });
                    }
                });
                return allLogs;
            };

            $scope.setDefaultProject = function (log) {
                log.projectId = $scope.projects[0]._id;
                log.projectName = $scope.projects[0].name;
            }

            $scope.addLogToAllLogs = function(log, allLogs){
                if (!log.projectId) {
                    $scope.setDefaultProject(log);
                }

                log.isFirstDayRecord = _.filter(allLogs, function(logInAllLogs) {
                        return logInAllLogs.date == log.date;
                    }).length == 0;
                allLogs.push(log);
            }

            $scope.someProjectHasLog = function (date) {
                var someProjectHasLog = false;
                $scope.projects.forEach(function (project){
                    var timesheet = project.periods[$scope.currentPeriodIndex].timesheet;
                    timesheet.forEach(function(log) {
                        if (log.date == date && (log.projectId || log.time || log.comment)) {
                            someProjectHasLog = true;
                        }
                    });
                });

                return someProjectHasLog;
            }

            $scope.totalLogged = function() {
                var totalSum = getTotalSum();

                return totalSum.totalLogged + 'h/' + totalSum.totalExpected + 'h';
            };

            function formatTime(time){
                if(time && angular.isNumber(time)){
                    time = time;
                }
                else if(time && time.slice(-1) == 'h'){
                    time = time.slice(0, -1);
                }
                else{
                    time = time == "." ? 0 : +time;
                }

                return time;
            }

            $scope.getPeriodLabel = function(period) {
                var periodStart = 0,
                    periodEnd = 0;

                if(period){
                    periodStart = moment(new Date(period.start)).format("DD/MMM/ddd");
                    periodEnd = moment(new Date(period.end)).format("DD/MMM/ddd");
                    return periodStart + ' - ' + periodEnd;
                }
                else{
                    return '';
                }
            };
        }]);