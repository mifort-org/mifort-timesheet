'use strict';

angular.module('mifortTimesheet')
    .directive('projectSummary', function($location, preferences, $rootScope) {
        return {
            scope: true,
            link: function (scope, element, attrs) {

                scope.getLoggedTime = function (projectId) {
                    var total = 0;
                    var project = _.findWhere(scope.projects, {_id: projectId});
                    if(project) {
                        project.periods[scope.currentPeriodIndex].timesheet.forEach(function (log) {
                            if (log.projectId == projectId && log.time) {
                                total += +log.time;
                            }
                        });
                        if (total.toFixed() != total) {
                            return total.toFixed(2);
                        }
                    }
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
                    if (scope.projects) {
                        scope.projects.forEach(function (project) {
                            project.periods[scope.currentPeriodIndex].timesheet.forEach(function (log) {
                                if (log.time) {
                                    total += +log.time;
                                }
                            });
                        });
                    }
                    if (total.toFixed() != total) {
                        return total.toFixed(2);
                    }
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
                        // scope.getLogDates().forEach(function (log) {
                    //
                    // });
                    }, true);
                }

                scope.getNotEmptyLogs = function (logs) {
                    return _.filter(logs, function (item) {
                        return item.time || item.comment;
                    });
                };

                scope.getTotalWorkloadTime = function (countProject) {
                    $rootScope.totalTimeWorkload = countProject*40; // !!!!!
                    scope.$root.$emit('totaltime', { totalTime: countProject*40});
                    var totalTime = countProject*40;
                    this.$root.totaltime = totalTime;
                    return totalTime;
                };

                scope.getCurrentLog = function () {
                    return _.findWhere(scope.logs, {index: scope.currentPeriodIndex});
                };

                scope.getLogDates = function () {
                    var log = scope.getCurrentLog();
                    return log ? log.data : [];
                };

                scope.totalWorkloadLogs = function () {
                    scope.$root.$emit('totalWorkloadLogs', {logsCurrentPeriod: scope.getLoggedTime()});
                };

                var handler = scope.$root.$on('projectsAndLogsLoaded', function (event, data) {
                    scope.projects = data.projects;
                    scope.logs = data.logs;
                    scope.currentPeriodIndex = data.index;
                    scope.projectsWithTime = [];

                    scope.totalWorkloadLogs();
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
