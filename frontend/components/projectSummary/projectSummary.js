'use strict';

angular.module('mifortTimesheet')
    .directive('projectSummary', function($location, preferences, projectSummaryService) {
        return {
            scope: true,
            link: function (scope, element, attrs) {

                scope.getLoggedTime = function (projectId) {
                    return projectSummaryService.getLoggedTime(projectId, scope.getCurrentLogDates());
                };

                scope.getTotalLoggedTime = function () {
                    return projectSummaryService.getTotalLoggedTime(scope.getCurrentLogDates());
                };

                function initWatchers() {

                    scope.$watch("logs", function (newValue, oldValue) {
                        scope.projectsWithTime = projectSummaryService.getProjectsWithTime(scope.projects, scope.getCurrentLogDates());
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

                });

                scope.$on('$destroy', handler);
            },
            templateUrl: function () {
                return 'components/projectSummary/projectSummary.html'
            }
        }
    });
