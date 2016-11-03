'use strict';

angular.module('mifortTimesheet')
    .directive('projectSummary', function($location, preferences, projectSummaryService) {
        return {
            scope: true,
            link: function (scope, element, attrs) {

                scope.getLoggedTime = function (projectId) {
                    return projectSummaryService.getLoggedTime(projectId, scope.getCurrentLogDates());
                    // if (!projectId) return 0;
                    //
                    // var total = 0;
                    // var logs = _.filter(scope.getCurrentLogDates(), {projectId: projectId});
                    // logs.forEach(function (log) {
                    //     if (log.time) {
                    //         total += +log.time;
                    //     }
                    // });
                    // return total;
                };

                scope.getTotalLoggedTime = function () {
                    return projectSummaryService.getTotalLoggedTime(scope.getCurrentLogDates());

                    // var total = 0;
                    // if (!scope.projects) return 0;
                    // scope.projects.forEach(function (project) {
                    //     total += scope.getLoggedTime(project._id);
                    // });
                    // return total;
                };

                function initWatchers() {

                    scope.$watch("logs", function (newValue, oldValue) {
                        scope.projectsWithTime = projectSummaryService.getProjectsWithTime(scope.projects, scope.getCurrentLogDates());
                        //
                        // scope.projects.forEach(function (project) {
                        //     if (project.assignments[0].workload) {
                        //         scope.projectsWithTime.push({id: project._id, name: project.name});
                        //     }
                        // });
                        // scope.projects.forEach(function (project) {
                        //     project.periods[scope.currentPeriodIndex].timesheet.forEach(function (log) {
                        //         if (log.time && !_.findWhere(scope.projectsWithTime, {name: log.projectName})) {
                        //             scope.projectsWithTime.push({id: log.projectId, name: log.projectName});
                        //         }
                        //     })
                        // });
                    }, true);
                }

                scope.getTotalWorkloadTime = function () {
                    return projectSummaryService.getTotalWorkloadTime(scope.projectsWithTime);
                };

                scope.getWorkload = function () {
                    return projectSummaryService.getWorkload();
                };

                scope.getCurrentLog = function () {
                    return _.findWhere(scope.logs, {index: scope.currentPeriodIndex});
                };

                scope.getCurrentLogDates = function () {
                    var log = scope.getCurrentLog();
                    return log ? log.data : [];
                };

                var handler = scope.$root.$on('projectsAndLogsLoaded', function (event, data) {
                    initWatchers();

                    scope.projects = data.projects;
                    scope.logs = data.logs;
                    scope.currentPeriodIndex = data.index;
                    scope.projectsWithTime = [];

                    //scope.getTotalWorkloadTime();
                });

                scope.$on('$destroy', handler);
            },
            templateUrl: function () {
                return 'components/projectSummary/projectSummary.html'
            }
        }
    });
