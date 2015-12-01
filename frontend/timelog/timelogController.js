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

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetService', 'preferences', 'loginService', function($scope, $filter, timelogService, timesheetService, preferences, loginService) {
        $scope.projects = [];
        $scope.isCollapsed = false;
        $scope.timelogKeys = timelogService.getTimelogKeys();
        $scope.userName = preferences.get('user').displayName;

        loginService.getUser().success(function (user) {
            if(user){
                $scope.assignments = user.assignments;

                $scope.assignments.forEach(function(assignment, index) {
                    if(!index || index && assignment.projectId != $scope.assignments[index-1].projectId){
                        timelogService.getProject(assignment.projectId).success(function(project) {
                            if(project && project.active) {
                                project.userTimelogs = [];
                                project.currentTimelogIndex = 0;
                                $scope.projects.push(project);
                            }
                        }).then(function(data) {
                            var currentProject = data.data;

                            if(currentProject && currentProject.active) {
                                var startDate = currentProject.periods[0].start,
                                    endDate = currentProject.periods[currentProject.periods.length - 1].end;

                                timelogService.getTimelog(preferences.get('user')._id, currentProject._id, startDate, endDate).success(function(projectTimelog) {
                                    var projectUserTimelogs = currentProject.userTimelogs;

                                    projectUserTimelogs.push.apply(projectUserTimelogs, projectTimelog.timelog);

                                    //if($scope.assignments.length == index + 1) {
                                        $scope.init();
                                    //}
                                });
                            }
                        });
                    }
                });
            }
        });

        $scope.init = function() {
            $scope.projects.forEach(function(project, projectIndex) {
                var startDate = moment(new Date(project.periods[0].start)),
                    endDate = moment(new Date(project.periods[project.periods.length - 1].end)),
                    daysToGenerate = endDate.diff(startDate, 'days'),
                    today = moment().format("MM/DD/YYYY"),
                    todayIndex = 0;

                project.timelog = [];
                project.splittedTimelog = [];

                generateDaysTemplates(project, daysToGenerate, startDate);
                applyProjectDefaultValues(project, startDate);
                applyUserTimelogs(project);
                splitPeriods(project);
                initWatchers(project, projectIndex);

               //scroll pages to current day
                $scope.projects[projectIndex].splittedTimelog.forEach(function(period, periodIndex) {
                    if(_.findIndex(period, {date: today}) >= 0){
                        todayIndex = periodIndex;
                    }
                });

                project.currentTimelogIndex = todayIndex;
            });
        };

        function splitPeriods(project) {
            project.splittedTimelog = [];
            project.periods.forEach(function(period) {
                var timelogPeriod,
                    startIndex = _.findIndex(project.timelog, {date: moment(new Date(period.start)).format("MM/DD/YYYY")}),
                    endIndex = _.findLastIndex(project.timelog, {date: moment(new Date(period.end)).format("MM/DD/YYYY")});

                timelogPeriod = project.timelog.slice(startIndex, endIndex + 1);
                project.splittedTimelog.push(timelogPeriod);
            });
        }

        function applyUserTimelogs(project){
            project.userTimelogs.forEach(function(day, index) {
                var timelogDayIndex = _.findIndex(project.timelog, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});

                //if current iterated log is not the first for this date to push
                if(project.userTimelogs[index - 1] && project.userTimelogs[index - 1].date == day.date) {
                    if(!project.timelog[timelogDayIndex]._id){
                        day.isFirstDayRecord = true;
                        project.timelog[timelogDayIndex] = day
                    }
                    else{
                        day.isFirstDayRecord = false;
                        project.timelog.splice(timelogDayIndex + 1, 0, day);
                    }
                }
                else {
                    day.isFirstDayRecord = true;
                    if(!_.findWhere(project.timelog, {date: day.date}).comment){
                        _.findWhere(project.timelog, {date: day.date}).comment = project.timelog[timelogDayIndex].comment;
                    }
                    angular.extend(project.timelog[timelogDayIndex], day);
                }
            });
        }

        function applyProjectDefaultValues(project){
            if(project.defaultValues) {
                project.defaultValues.forEach(function(day) {
                    var dayExisted = _.findWhere(project.timelog, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});
                    if(dayExisted) {
                        angular.extend(dayExisted, day);

                        if(!dayExisted.comment){
                            dayExisted.comment = day.comment;
                        }
                    }
                });
            }
        }

        function generateDaysTemplates(project, daysToGenerate, startDate){
            for (var i = 0; i < daysToGenerate + 1; i++) {
                var dayToPush;

                project.template.workload = preferences.get('user').workload;
                project.template.userId = preferences.get('user')._id;
                project.template.projectId = project._id;
                project.template.projectName = project.name;

                dayToPush = _.clone(project.template);
                dayToPush.date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");
                dayToPush.isFirstDayRecord = true;
                dayToPush.userName = $scope.userName;

                project.timelog.push(dayToPush);
            }
        }

        function initWatchers(project, projectIndex){
            project.splittedTimelog.forEach(function(period, index) {
                var typingTimer = null;

                $scope.$watch('projects[' + projectIndex + '].splittedTimelog[' + index +']', function(newValue, oldValue) {
                    if(newValue != oldValue && newValue.length >= oldValue.length) {
                        clearTimeout(typingTimer);

                        newValue.map(function(timelogDay) {
                            delete timelogDay.color;

                            return timelogDay;
                        });

                        typingTimer = setTimeout(function() {
                            timelogService.updateTimelog(preferences.get('user')._id, newValue).success(function(data) {
                                var noIdLog = _.find(project.timelog, function(log) {
                                    return !log._id;
                                });

                                data.timelog.forEach(function(log, logIndex) {
                                    var timelogHasSuchRecord = _.filter(project.timelog, function(timelogDay) {
                                        return timelogDay._id == log._id;
                                    });

                                    if(!timelogHasSuchRecord.length){
                                        noIdLog._id = log._id;
                                    }
                                });
                            });
                        }, 250)
                    }
                }, true);
            });
        }

        $scope.addRow = function(log, project) {
            var newRow = angular.copy(project.template),
                dayIndex = _.findIndex(project.timelog, {date: log.date});
            newRow.date = log.date;
            newRow.userName = log.userName;
            newRow.isFirstDayRecord = false;
            project.timelog.splice(dayIndex + 1, 0, newRow);
            splitPeriods(project);
        };

        $scope.removeRow = function(log, dayIndex, project) {
            if(log._id) {
                timelogService.removeTimelog(log);

                project.splittedTimelog[project.currentTimelogIndex].splice(dayIndex, 1);
                project.timelog.splice(dayIndex, 1);
                splitPeriods(project);
            }
        };

        //date, userId, projectId, projectName, userName
        $scope.isWeekend = function(date) {
            return new Date(date).getDay() == 0 || new Date(date).getDay() == 1;
        };

        $scope.showPreviousPeriod = function(project) {
            if(project.currentTimelogIndex){
                project.currentTimelogIndex--;
            }
        };

        $scope.showNextPeriod = function(project) {
            if(project.currentTimelogIndex < project.splittedTimelog.length - 1){
                project.currentTimelogIndex++;
            }
        };
    }]);