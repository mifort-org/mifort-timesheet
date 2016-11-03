'use strict';

angular.module('mifortTimesheet')
    .directive('projectSummary', function($location, preferences, $rootScope) {
        return {
            scope: true,
            link: function (scope, element, attrs) {

                scope.getLoggedTime = function (projectId) {
                    if (!projectId) return 0;

                    var total = 0;
                    var logs = _.filter(scope.getCurrentLogDates(), {projectId: projectId});
                    logs.forEach(function (log) {
                        if (log.time) {
                            total += +log.time;
                        }
                    });
                    return total;
                };

                // scope.getProjectWorkloadTime = function (project) {
                //     var n = 0;
                //     var projectLogs = _.filter(scope.getLogDates(), {projectId: project._id});
                //     var dates = projectLogs.map(function(log) {
                //         return log.date;
                //     });
                //     var uniqueDates = dates.filter(function (item, pos) {
                //         return dates.indexOf(item) == pos;
                //     });
                //
                //     uniqueDates.forEach(function (date) {
                //         var day = new Date(date).getDay();
                //         var isWeekend = (day == 6) || (day == 0);
                //         if (!isWeekend) n++;
                //     });
                //
                //     return project.assignments[0].workload * n || 0;
                // };

                // scope.getWorkloadTime = function (projectId) {
                //     var project = _.findWhere(scope.projects, {_id: projectId});
                //     return scope.getProjectWorkloadTime(project);
                // };

                scope.getTotalLoggedTime = function () {
                    var total = 0;
                    if (!scope.projects) return 0;
                    scope.projects.forEach(function (project) {
                        total += scope.getLoggedTime(project._id);
                    });
                    return total;
                };

                function initWatchers() {

                    scope.$watch("logs", function (newValue, oldValue) {
                        scope.projectsWithTime = [];

                        scope.projects.forEach(function (project) {
                            if (project.assignments[0].workload) {
                                scope.projectsWithTime.push({id: project._id, name: project.name});
                            }
                        });
                        scope.projects.forEach(function (project) {
                            project.periods[scope.currentPeriodIndex].timesheet.forEach(function (log) {
                                if (log.time && !_.findWhere(scope.projectsWithTime, {name: log.projectName})) {
                                    scope.projectsWithTime.push({id: log.projectId, name: log.projectName});
                                }
                            })
                        });
                    }, true);
                }

                scope.getTotalWorkloadTime = function () {
                    if (!scope.projectsWithTime) return 0;

                    var count = scope.projectsWithTime.length;
                    var total = count * scope.getWorkload();
                    $rootScope.totalTimeWorkload = total;
                    return total;
                };

                scope.getWorkload = function () {
                    return 40;
                };

                scope.getCurrentLog = function () {
                    return _.findWhere(scope.logs, {index: scope.currentPeriodIndex});
                };

                scope.getCurrentLogDates = function () {
                    var log = scope.getCurrentLog();
                    return log ? log.data : [];
                };

                var handler = scope.$root.$on('projectsAndLogsLoaded', function (event, data) {
                    scope.projects = data.projects;
                    scope.logs = data.logs;
                    scope.currentPeriodIndex = data.index;
                    scope.projectsWithTime = [];

                    scope.getTotalWorkloadTime();
                    initWatchers();
                });

                scope.$on('$destroy', handler);
            },
            templateUrl: function () {
                return 'components/projectSummary/projectSummary.html'
            }
        }
    });
