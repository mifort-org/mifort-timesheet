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

angular.module('mifortTimelog.timelog', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', 'timelogService', 'timesheetService', 'preferences', 'loginService', '$timeout',
        function($scope, timelogService, timesheetService, preferences, loginService, $timeout) {
            var user;
            $scope.projects = [];
            $scope.isCollapsed = false;
            $scope.timelogKeys = timelogService.getTimelogKeys();

            loginService.getUser().success(function(loggedUser) {
                if(loggedUser){
                    var uniqueProjectAssignments = [];
                    var loadedProjects = 0;
                    user = loggedUser;
                    $scope.userName = user.displayName;

                    user.assignments.forEach(function(assignment) {
                        uniqueProjectAssignments.push(assignment.projectId);
                    });
                    uniqueProjectAssignments = _.uniq(uniqueProjectAssignments);

                    //get timelogs
                    uniqueProjectAssignments.forEach(function(assignment, index) {
                        timelogService.getProject(assignment).success(function(project) {
                            if(project && project.active){
                                project.currentPeriodIndex = 0;
                                project.assignments = _.where(user.assignments, {projectId: project._id});
                                $scope.projects.push(project);
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

                    project.periods.forEach(function(period, periodIndex) {
                        if(today >= moment(new Date(period.start)) && today <= moment(new Date(period.end))){
                            project.currentPeriodIndex = periodIndex;
                        }
                    });

                    initPeriod(project, project.currentPeriodIndex);
                });
            };

            function initPeriod(project, periodIndex) {
                var startDate = project.periods[periodIndex].start,
                    endDate = project.periods[periodIndex].end;

                project.periods[periodIndex].timelog = [];
                project.periods[periodIndex].userTimelogs = [];

                timelogService.getTimelog(user._id, project._id, startDate, endDate).success(function(dataTimelog) {
                    project.periods[periodIndex].userTimelogs.push.apply(project.periods[periodIndex].userTimelogs, dataTimelog.timelog);
                }).then(function() {
                    var projectIndex = _.findIndex($scope.projects, {_id: project._id});

                    generateDaysTemplates(project, periodIndex);
                    applyUserTimelogs(project, periodIndex);
                    applyProjectDefaultValues(project, periodIndex);
                    initWatchers(projectIndex, periodIndex);
                });
            }

            function applyUserTimelogs(project, periodIndex) {
                var period = project.periods[periodIndex];

                project.periods[periodIndex].userTimelogs.forEach(function(day, index) {
                    var timelogDayIndex = _.findIndex(period.timelog, {date: moment(new Date(day.date)).format("MM/DD/YYYY")}),
                        sameDateDays,
                        lastDayWithSameDate;

                    if(timelogDayIndex != -1){
                        sameDateDays = _.where(period.timelog, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});
                        lastDayWithSameDate = _.findIndex(period.timelog, {_id: sameDateDays[sameDateDays.length - 1]._id});

                        delete day.color;

                        //if current iterated log is not the first for this date to push
                        if(project.periods[periodIndex].timelog[index - 1] && project.periods[periodIndex].timelog[index - 1].date == day.date){
                            if(!period.timelog[timelogDayIndex]._id){
                                day.isFirstDayRecord = true;
                                period.timelog[timelogDayIndex] = day;
                            }
                            else{
                                day.isFirstDayRecord = false;
                                day.position = day.position ? day.position : period.timelog[timelogDayIndex].position + 1;
                                period.timelog.splice(lastDayWithSameDate + 1, 0, day);
                            }
                        }
                        else{
                            day.isFirstDayRecord = true;
                            if(!_.findWhere(period.timelog, {date: day.date}).comment){
                                //_.findWhere(period.timelog, {date: day.date}).comment = period.timelog[timelogDayIndex].comment;
                                _.findWhere(period.timelog, {date: day.date}).comment = day.comment;
                            }
                            angular.extend(period.timelog[timelogDayIndex], day);
                        }
                    }

                });
            }

            function applyProjectDefaultValues(project, periodIndex) {
                if(project.defaultValues){
                    project.defaultValues.forEach(function(day) {
                        var existedDays = _.where(project.periods[periodIndex].timelog, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});

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
                    dayToPush.userName = $scope.userName;

                    project.periods[periodIndex].timelog.push(dayToPush);
                }
            }

            function initWatchers(projectIndex, periodIndex) {
                var timer = null;

                $scope.$watch('projects[' + projectIndex + '].periods[' + periodIndex + '].timelog', function(newValue, oldValue) {
                    if(newValue != oldValue && newValue.length >= oldValue.length){
                        var timelogToSave = _.map(newValue, _.clone);

                        if(timer){
                            $timeout.cancel(timer);
                        }

                        timer = $timeout(function() {
                            timelogService.updateTimelog(user._id, timelogToSave).success(function(data) {
                                var periodTimelog = $scope.projects[projectIndex].periods[periodIndex].timelog,
                                    noIdLog = _.find(periodTimelog, function(log) {
                                        return !log._id;
                                    });

                                if(noIdLog){
                                    angular.extend(periodTimelog, data.timelog);
                                }
                            });
                        }, 500)
                    }
                }, true);
            }

            $scope.addLog = function(log, project, periodIndex) {
                var newRow = angular.copy(project.template),
                    currentPeriod = project.periods[periodIndex].timelog,
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
                newRow.isFirstDayRecord = false;
                newRow.position = maxPosition + 1;

                currentPeriod.splice(dayPeriodIndex + sameDateDays.length, 0, newRow);
            };

            $scope.removeRow = function(log, project, periodIndex) {
                if(log._id){
                    var dayPeriodIndex = _.findIndex(project.periods[periodIndex].timelog, {_id: log._id});
                    timelogService.removeTimelog(log);

                    project.periods[periodIndex].timelog.splice(dayPeriodIndex, 1);
                }
            };

            $scope.showPreviousPeriod = function(project) {
                if(project.currentPeriodIndex){
                    project.currentPeriodIndex--;

                    if(!project.periods[project.currentPeriodIndex].timelog){
                        initPeriod(project, project.currentPeriodIndex);
                    }
                }
            };

            $scope.showNextPeriod = function(project) {
                if(project.currentPeriodIndex < project.periods.length - 1){
                    project.currentPeriodIndex++;

                    if(!project.periods[project.currentPeriodIndex].timelog){
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

            //$scope.status = {
            //    isopen: false
            //};
            //
            //$scope.toggleDropdown = function($event) {
            //    $event.preventDefault();
            //    $event.stopPropagation();
            //    $scope.status.isopen = !$scope.status.isopen;
            //};
            //
            //$scope.assingRole = function(role, log) {
            //    log.role = role;
            //}
        }]);