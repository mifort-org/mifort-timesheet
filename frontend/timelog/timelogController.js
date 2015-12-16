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

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetService', 'preferences', 'loginService', '$timeout',
        function($scope, $filter, timelogService, timesheetService, preferences, loginService, $timeout) {
        var user = preferences.get('user');
        $scope.projects = [];
        $scope.isCollapsed = false;
        $scope.timelogKeys = timelogService.getTimelogKeys();
        $scope.userName = user.displayName;

        loginService.getUser().success(function (user) {
            if(user){
                $scope.assignments = user.assignments;

                $scope.assignments.forEach(function(assignment, index) {
                    if(!index || index && assignment.projectId != $scope.assignments[index-1].projectId){
                        timelogService.getProject(assignment.projectId).success(function(project) {
                            if(project && project.active) {
                                project.currentPeriodIndex = 0;
                                $scope.projects.push(project);
                            }
                        }).then(function() {

                            if(index == $scope.assignments.length - 1){
                                $scope.init();
                            }
                        });
                    }
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

        function initPeriod(project, periodIndex){
            var startDate = project.periods[periodIndex].start,
                endDate = project.periods[periodIndex].end;

            project.periods[periodIndex].timelog = [];
            project.periods[periodIndex].userTimelogs = [];

            timelogService.getTimelog(user._id, project._id, startDate, endDate).success(function(dataTimelog) {
                project.periods[periodIndex].userTimelogs.push.apply(project.periods[periodIndex].userTimelogs, dataTimelog.timelog);
            }).then(function() {
                var projectIndex = _.findIndex($scope.projects, {_id: project._id});

                generateDaysTemplates(project, periodIndex);
                applyProjectDefaultValues(project, periodIndex);
                applyUserTimelogs(project, periodIndex);
                initWatchers(projectIndex, periodIndex);
            });
        }

        function applyUserTimelogs(project, periodIndex){
            var period = project.periods[periodIndex];

            project.periods[periodIndex].userTimelogs.forEach(function(day, index) {
                var timelogDayIndex = _.findIndex(period.timelog, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});

                //if current iterated log is not the first for this date to push
                if(project.periods[periodIndex].timelog[index - 1] && project.periods[periodIndex].timelog[index - 1].date == day.date) {
                    if(!period.timelog[timelogDayIndex]._id){
                        day.isFirstDayRecord = true;
                        period.timelog[timelogDayIndex] = day;
                    }
                    else{
                        day.isFirstDayRecord = false;
                        period.timelog.splice(timelogDayIndex + 1, 0, day);
                    }
                }
                else {
                    day.isFirstDayRecord = true;
                    if(!_.findWhere(period.timelog, {date: day.date}).comment){
                        //_.findWhere(period.timelog, {date: day.date}).comment = period.timelog[timelogDayIndex].comment;
                        _.findWhere(period.timelog, {date: day.date}).comment = day.comment;
                    }
                    angular.extend(period.timelog[timelogDayIndex], day);
                }
            });
        }

        function applyProjectDefaultValues(project, periodIndex){
            if(project.defaultValues) {
                project.defaultValues.forEach(function(day) {
                    var dayExisted = _.findWhere(project.periods[periodIndex].timelog, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});
                    if(dayExisted) {
                        angular.extend(dayExisted, day);

                        if(!dayExisted.comment){
                            dayExisted.comment = day.comment;
                        }
                    }
                });
            }
        }

        function generateDaysTemplates(project, periodIndex){
            var startDate = moment(new Date(project.periods[periodIndex].start)),
                endDate = moment(new Date(project.periods[periodIndex].end)),
                daysToGenerate = endDate.diff(startDate, 'days');

            for (var i = 0; i < daysToGenerate + 1; i++) {
                var dayToPush;

                //TODO: to template
                project.template.workload = user.workload;
                project.template.userId = user._id;
                project.template.projectId = project._id;
                project.template.projectName = project.name;

                dayToPush = _.clone(project.template);
                dayToPush.date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");
                dayToPush.isFirstDayRecord = true;
                dayToPush.userName = $scope.userName;

                project.periods[periodIndex].timelog.push(dayToPush);
            }
        }

        function initWatchers(projectIndex, periodIndex){
            var timer = null;

            $scope.$watch('projects[' + projectIndex + '].periods[' + periodIndex +'].timelog', function(newValue, oldValue) {
                if(newValue != oldValue && newValue.length >= oldValue.length) {
                    if(timer){
                        $timeout.cancel(timer);
                    }

                    newValue.map(function(timelogDay) {
                        delete timelogDay.color;

                        return timelogDay;
                    });

                    timer = $timeout(function() {
                        timelogService.updateTimelog(user._id, newValue).success(function(data) {
                            var periodTimelog = $scope.projects[projectIndex].periods[periodIndex].timelog,
                                noIdLog = _.find(periodTimelog, function(log) {
                                    return !log._id;
                                });

                            if(noIdLog){
                                angular.extend(periodTimelog, data.timelog);
                            }

                            //angular.extend(periodTimelog, data.timelog);
                        });
                    }, 500)
                }
            }, true);
        }

        $scope.addRow = function(log, project, periodIndex) {
            var newRow = angular.copy(project.template),
                dayPeriodIndex = _.findIndex(project.periods[periodIndex].timelog, {date: log.date});

            newRow.date = log.date;
            newRow.userName = log.userName;
            newRow.isFirstDayRecord = false;

            project.periods[periodIndex].timelog.splice(dayPeriodIndex + 1, 0, newRow);
        };

        $scope.removeRow = function(log, project, periodIndex) {
            if(log._id) {
                var dayPeriodIndex = _.findIndex(project.periods[periodIndex].timelog, {_id: log._id});
                timelogService.removeTimelog(log);

                project.periods[periodIndex].timelog.splice(dayPeriodIndex, 1);
            }
        };

        $scope.isWeekend = function(date) {
            return new Date(date).getDay() == 6 || new Date(date).getDay() == 0;
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
    }]);