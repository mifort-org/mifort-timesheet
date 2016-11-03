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

    .controller('timesheetController', ['$scope', 'timesheetService', 'calendarService', 'preferences', 'loginService', '$routeParams', '$timeout', 'Notification', "$q", "$rootScope",
        function($scope, timesheetService, calendarService, preferences, loginService, $routeParams, $timeout, Notification, $q, $rootScope) {
            var user;

            $scope.projects = [];
            $scope.currentPeriodIndex = 0;
            $scope.timesheetKeys = timesheetService.getTimesheetKeys();
            $scope.logs = [];
            $scope.filteredLogs = [];
            $scope.customUserId = $routeParams.userId;
            $scope.grid = {options: {reportFilters: []}};

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

                            var filterProjects = $scope.projects.map(function(project) {
                                return {_id: project._id, name: project.name};
                            });
                            $scope.grid.options.reportFilters = [{field: "projects", value: filterProjects}];

                            if(loadedProjects == uniqueProjectAssignments.length){
                                $scope.init();
                            }
                        });
                    });
                }
            });

            $scope.addLogs = function (period, index) {
                $scope.logs.push({index: index, data: $scope.groupDatePeriodsProjects(index)});
            };

            $scope.currentPeriodLogsLoaded = function () {
                $scope.$root.$emit('projectsAndLogsLoaded', { projects: $scope.projects, logs: $scope.logs, index: $scope.currentPeriodIndex});
            };

            $scope.init = function() {
                var promises = [];

                $scope.projects.forEach(function(project) {
                    var today = moment();

                    //scroll into cuttent week
                    project.periods.forEach(function(period, periodIndex) {
                        var momentStart = moment(new Date(period.start)),
                            momentEnd = moment(new Date(period.end));

                        if(today.isBetween(momentStart, momentEnd) || today.isSame(momentStart, 'day') || today.isSame(momentEnd, 'day')){
                            $scope.currentPeriodIndex = +preferences.get('currentPeriodIndex') || periodIndex || 0;
                        }
                    });

                    project.periods.forEach(function (period, index) {
                        promises.push(initPeriod(project, index));
                    })
                });

                $q.all(promises).then(function (){
                    $scope.projects[0].periods.forEach(function (period, index) {
                        $scope.addLogs(period, index);
                    });
                    initWatchers("logs");
                    $scope.currentPeriodLogsLoaded();

                    $scope.filteredLogs = $scope.getFilteredDates();
                    $scope.watchFilterChanges();

                    $scope.projects.forEach(function (project) {
                        applyProjectDefaultValues(project, $scope.currentPeriodIndex);
                    });

                    $scope.loading = false;
                });
            };

            $scope.introSteps = timesheetService.introSteps;

            function initPeriod(project, periodIndex) {
                var startDate = project.periods[periodIndex].start,
                    endDate = project.periods[periodIndex].end;

                project.periods[periodIndex].timesheet = [];
                project.periods[periodIndex].userTimesheets = [];

                return timesheetService.getTimesheet(user._id, project._id, startDate, endDate).success(function(dataTimesheet) {
                    project.periods[periodIndex].userTimesheets.push.apply(project.periods[periodIndex].userTimesheets, dataTimesheet.timesheet);
                }).then(function() {
                    //var projectIndex = _.findIndex($scope.projects, {_id: project._id});

                    generateDaysTemplates(project, periodIndex);
                    applyUserTimesheets(project, periodIndex);
                    //applyProjectDefaultValues(project, periodIndex);

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
                        //var existedDays = _.where(project.periods[periodIndex].timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});
                        var existedDays = $scope.getSameDateDays($scope.getLogDates(), day.date);

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
                    timePlaceholder = project.assignments[0].workload;

                for(var i = 0; i < daysToGenerate + 1; i++){
                    var dayToPush;

                    //TODO: to template
                    project.template.userId = user._id;
                    //project.template.projectId = project._id;
                    //project.template.projectName = project.name;
                    delete project.template.time;

                    dayToPush = _.clone(project.template);
                    dayToPush.date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");
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
                    var newLogs = newValue[$scope.currentPeriodIndex].data,
                        oldLogs = oldValue[$scope.currentPeriodIndex].data;
                    if(newLogs.length >= oldLogs.length) {

                        var newValueToCompare = $scope.getNotEmptyLogs(newLogs).map(function(log) {
                            return {projectId: log.projectId, time: log.time, comment: log.comment};
                        });

                        var oldValueToCompare = $scope.getNotEmptyLogs(oldLogs).map(function(log) {
                            return {projectId: log.projectId, time: log.time, comment: log.comment};
                        });

                        if(!_.isEqual(newValueToCompare, oldValueToCompare)) {

                            var dates = $scope.getNotEmptyDates();
                            var timesheetToSave = angular.copy(dates);

                            timesheetToSave.map(function (log) {
                                if (log.time !== '' && log.time !== null) {
                                    log.time = +log.time;
                                }
                                if (log.time == "") {
                                    log.time = null;
                                }
                                return log;
                            });

                            if (timer) {
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
                                            //var dates = $scope.getDates();
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
                                        //else {
                                            Notification.success('Changes saved');
                                        //}
                                    });
                                }, 500);
                            }
                        }
                    }
                }, true);
            }

            $scope.calcNewLogPosition = function (logs, date) {
                var sameDateDays = $scope.getSameDateDays(logs, date);

                var maxPosition = 0;

                sameDateDays.forEach(function(sameDateDay) {
                    if(sameDateDay.position > maxPosition){
                        maxPosition = sameDateDay.position;
                    }
                });

                return maxPosition + 1;
            };

            $scope.getSameDateDays = function (logs, date) {
                return _.filter(logs, function (log) {
                    return log.date == date;
                });
            };

            $scope.addLog = function(log, project, periodIndex) {
                var newRow = angular.copy(project.template),
                    currentPeriod = $scope.getLogDates(),
                    dayPeriodIndex = _.findIndex(currentPeriod, {date: log.date});

                newRow.date = log.date;
                newRow.userName = log.userName;
                newRow.color = log.color;
                newRow.placeholder = log.placeholder;
                newRow.timePlaceholder = project.assignments[0].workload;
                newRow.role = log.role;
                newRow.isFirstDayRecord = false;
                newRow.position = $scope.calcNewLogPosition(currentPeriod, log.date);

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
                newRow.isCreatedManually = true;
                currentPeriod.splice(dayPeriodIndex + $scope.getSameDateDays(currentPeriod, log.date).length, 0, newRow);

                $scope.filteredLogs = $scope.getFilteredDates();
            };

            $scope.removeRow = function(log, project, periodIndex) {
                var dates = $scope.getLogDates();

                if(log._id){
                    timesheetService.removeTimesheet(log).success(function() {
                        Notification.success('Changes saved');
                    });
                }

                dates.splice(dates.indexOf(log), 1);

                $scope.filteredLogs = $scope.getFilteredDates();
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
                        //var log = $scope.getCurrentLog();

                        $scope.currentPeriodLogsLoaded();

                        $scope.filteredLogs = $scope.getFilteredDates();
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
                        //var log = $scope.getCurrentLog();

                        $scope.currentPeriodLogsLoaded();

                        $scope.filteredLogs = $scope.getFilteredDates();
                    });
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            $scope.getCurrentLog = function () {
                return _.findWhere($scope.logs, {index: $scope.currentPeriodIndex});
            };

            $scope.getLogDates = function () {
                var log = $scope.getCurrentLog();
                return log ? log.data : [];
            };

            $scope.getCheckedProjectFilters = function () {
                var filterProjects = _.findWhere($scope.grid.options.reportFilters, {field: "projects"});
                var checkedProjects = _.filter(filterProjects.value, {isChecked: true});
                return checkedProjects.length ? checkedProjects : filterProjects.value;
            };

            $scope.getFilteredLogs = function (logs) {
                if (!logs.length) return [];

                var checkedProjects = $scope.getCheckedProjectFilters();
                return _.filter(logs, function (logPeriod) {
                    return _.filter(checkedProjects, {_id: logPeriod.projectId}).length > 0;
                });
            };

            $scope.onSearchProjectByText = function () {
                var text = this.$parent.searchProjectByText.toLocaleLowerCase();

                var filterProjects = $scope.projects.map(function(project) {
                    return {_id: project._id, name: project.name};
                });
                $scope.grid.options.reportFilters = [{field: "projects", value: filterProjects}];
                var filterProjectsByName = _.filter($scope.grid.options.reportFilters[0].value, function (filter) {
                    return filter.name.toLowerCase().startsWith(text);
                });
                filterProjectsByName.forEach(function (project) {
                    project.isChecked = false;
                });
                $scope.grid.options.reportFilters[0].value = filterProjectsByName;
            };

            $scope.getFilteredDates = function () {
                var data = $scope.getLogDates();
                var filteredLogs = $scope.getFilteredLogs(data);
                var startDate = moment(new Date($scope.projects[0].periods[$scope.currentPeriodIndex].start)),
                    endDate = moment(new Date($scope.projects[0].periods[$scope.currentPeriodIndex].end)),
                    daysToGenerate = endDate.diff(startDate, 'days');

                var logs = [];
                for(var i = 0; i < daysToGenerate + 1; i++) {
                    var date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");

                    var logsOnDate = $scope.getSameDateDays(filteredLogs, date);

                    if (!logsOnDate.length) {
                        var newRow = angular.copy(data[0]);
                        newRow.date = date;
                        newRow.time = null;
                        newRow.comment = null;
                        newRow._id = null;
                        newRow.isCreatedManually = false;
                        newRow.position = $scope.calcNewLogPosition(data, date);

                        $scope.setDefaultProject(newRow);
                        newRow.isFirstDayRecord = $scope.isFirstDayRecord(logs, date);

                        logs.push(newRow);

                        var dayPeriodIndex = _.findIndex(data, {date: date});
                        data.splice(dayPeriodIndex + $scope.getSameDateDays(data, date).length, 0, newRow);

                        applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);
                    }
                    else {
                        var wasAdded = false;
                        logsOnDate.forEach(function (log, index) {
                            if (log._id || log.time || log.comment || log.isCreatedManually ||
                                (!index && $scope.isAtOrAfterIndexCreatedManuallyLog(index, logsOnDate))) {
                                log.isFirstDayRecord = $scope.isFirstDayRecord(logs, log.date);

                                logs.push(log);

                                applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);

                                wasAdded = true;
                            }
                        });
                        if (!wasAdded) {
                            var log = logsOnDate[0];

                            log.isFirstDayRecord = $scope.isFirstDayRecord(logs, log.date);

                            logs.push(log);

                            applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);
                        }
                    }
                }

                return logs;
            };

            $scope.isAtOrAfterIndexCreatedManuallyLog = function (index, logs) {
                for (var i = index; i < logs.length; i++) {
                    if (logs[i].isCreatedManually) {
                        return true;
                    }
                }
                return false;
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

            $scope.getNotEmptyLogs = function (logs) {
                return _.filter(logs, function (item) {
                    return item.time || item.comment;
                });
            };

            $scope.getNotEmptyDates = function () {
                var dates = $scope.getLogDates();
                return $scope.getNotEmptyLogs(dates);
            };

            $scope.getLogsToDelete = function () {
                var dates = $scope.getLogDates();
                return _.filter(dates, function(item) {
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

            $scope.assignProject = function(projectId, log) {
                var project = _.findWhere($scope.projects, {_id: projectId});
                log.projectName = project ? project.name : '';
                log.projectId = projectId;
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

            // $scope.getAllLogs = function () {
            //     var allLogs = [];
            //     $scope.logs.forEach(function (logs) {
            //         logs.data.forEach(function (log) {
            //             allLogs.push(log);
            //         });
            //     });
            //     return allLogs;
            // };

            $scope.getTotalLoggedTime = function () {
                var total = 0;

                $scope.filteredLogs.forEach(function (log) {
                    if (log.time) {
                        total += formatTime(log.time);
                    }
                });
                return total;
            };

            // $scope.getTotalWorkloadTime = function(){
            //     var total = 0;
            //
            //     var logs = $scope.getAllLogs();
            //     $scope.projects.forEach(function (project) {
            //         var projectLogs = _.filter(logs, {projectId: project._id});
            //         total += $scope.getProjectWorkloadTime(project, projectLogs);
            //     });
            //
            //     return total;
            // };

            $scope.getTotalWorkload = function () {
                return $rootScope.totalTimeWorkload;
            };

            $scope.getProjectWorkloadTime = function (project, logs) {
                var n = 0;

                var dates = logs.map(function(log) {
                    return log.date;
                });
                var uniqueDates = dates.filter(function (item, pos) {
                    return dates.indexOf(item) == pos;
                });

                uniqueDates.forEach(function (date) {
                    var day = new Date(date).getDay();
                    var isWeekend = (day == 6) || (day == 0);
                    if (!isWeekend) n++;
                });

                return project.assignments[0].workload * n || 0;
            };

            $scope.watchFilterChanges = function () {
                $scope.$watch("grid.options.reportFilters", function (newValue, oldValue) {
                    $scope.filteredLogs = $scope.getFilteredDates();
                }, true);
            };

            $scope.groupDatePeriodsProjects = function (periodIndex) {
                if (!$scope.projects.length || !$scope.projects[0].periods[periodIndex].timesheet) return [];

                var allLogs = [];
                $scope.projects[0].periods[periodIndex].timesheet.forEach(function (logGroup) {
                    var logOfDate = $scope.getSameDateDays(allLogs, logGroup.date);

                    if (logOfDate.length == 0) {
                        $scope.projects.forEach(function (project) {
                            //if ($scope.currentPeriodIndex) {
                                var timesheet = project.periods[periodIndex].timesheet;
                                timesheet.forEach(function(log) {
                                    if (log.date == logGroup.date) {
                                        if (!log._id) {
                                            var hasLogThisDay = $scope.getSameDateDays(allLogs, log.date).length > 0;
                                            if (!hasLogThisDay && !$scope.someProjectHasLog(log.date)) {
                                                $scope.addLogToArray(log, allLogs);
                                            }
                                        }
                                        else {
                                            $scope.addLogToArray(log, allLogs);
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
                var checked = $scope.getCheckedProjectFilters();
                var project = checked.length ? checked[0] : $scope.projects[0];
                log.projectId = project._id;
                log.projectName = project.name;
            };

            $scope.addLogToArray = function(log, allLogs){
                if (!log.projectId) {
                    $scope.setDefaultProject(log);
                }

                allLogs.push(log);
            };

            $scope.isFirstDayRecord = function (allLogs, date) {
                return $scope.getSameDateDays(allLogs, date).length == 0;
            };

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

            $scope.isStartEndPeriodSameMonth = function (period) {
                if (period) {
                    var periodStart = moment(new Date(period.start)),// 0
                        periodEnd = moment(new Date(period.end));// 0
                    return periodStart.format("MMM") == periodEnd.format("MMM")
                }
                return false;
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
                if(period){
                    var periodStart = moment(new Date(period.start)),// 0
                        periodEnd = moment(new Date(period.end));// 0
                    if(periodStart.format("MMM") == periodEnd.format("MMM")){
                        periodStart = periodStart.format("DD");
                    }
                    else{
                        periodStart = periodStart.format("DD MMM");
                    }
                    periodEnd = periodEnd.format("DD MMM");
                    return periodStart + ' - ' + periodEnd;
                }
                else{
                    return '';
                }
            };

        }]);