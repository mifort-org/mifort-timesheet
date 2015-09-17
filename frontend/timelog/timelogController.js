'use strict';

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetManagementService', 'preferences', function($scope, $filter, timelogService, timesheetManagementService, preferences) {
        $scope.isCollapsed = false;
        $scope.projects = [];
        $scope.timelogKeys = timelogService.getTimelogKeys();
        $scope.assignments = preferences.get('user').assignments;

        $scope.assignments.forEach(function(assignment, index) {
            timesheetManagementService.getProject(assignment.projectId).success(function(project) {
                project.userTimelogs = [];
                project.currentTimelogIndex = 0;
                $scope.projects.push(project);
            }).then(function() {
                var currentProject = $scope.projects[index],
                    startDate = currentProject.periods[0].start,
                    endDate = currentProject.periods[0].end;
                timelogService.getTimelog(preferences.get('user')._id, currentProject._id, startDate, endDate).success(function(projectTimelog) {
                    var projectUserTimelogs = $scope.projects[index].userTimelogs;

                    projectUserTimelogs.push.apply(projectUserTimelogs, projectTimelog.timelog);

                    if($scope.assignments.length == index + 1) {
                        $scope.init();
                    }
                });
            });
        });

        $scope.init = function() {
            $scope.projects.forEach(function(project, projectIndex) {
                var startDate = moment(new Date(project.periods[0].start)),
                    endDate = moment(new Date(project.periods[project.periods.length - 1].end)),
                    daysToGenerate = endDate.diff(startDate, 'days');

                project.timelog = [];
                project.splittedTimelog = [];

                //template timelogs
                for (var i = 0; i < daysToGenerate + 1; i++) {
                    var dayToPush;

                    project.template.workload = preferences.get('user').workload;
                    project.template.userId = preferences.get('user')._id;
                    project.template.projectId = project._id;
                    project.template.projectName = project.name;

                    dayToPush = _.clone(project.template);
                    dayToPush.date = angular.copy(startDate).add(i, 'days').calendar();
                    dayToPush.isFirstDayRecord = true;

                    project.timelog.push(dayToPush);
                }

                //timelogs data from timesheet
                if(project.defaultValues) {
                    project.defaultValues.forEach(function(day) {
                        var dayExisted = _.findWhere(project.timelog, {date: moment(new Date(day.date)).calendar()});
                        if(dayExisted) {
                            angular.extend(dayExisted, day);
                        }
                    });
                }

                //user timelogs
                project.userTimelogs.forEach(function(day, index) {
                    var timelogDayIndex = _.findIndex(project.timelog, {date: moment(new Date(day.date)).calendar()});
                    day.isFirstDayRecord = false;

                    //if current iterated log is not the first for this date to push
                    if(project.userTimelogs[index - 1] && project.userTimelogs[index - 1].date == day.date) {
                        project.timelog.splice(timelogDayIndex + 1, 0, day);
                    }
                    else {
                        day.isFirstDayRecord = true;
                        angular.extend(_.findWhere(project.timelog, {date: day.date}), day);
                    }
                });

                $scope.timelogAssigments = preferences.get('user').assignments.map(function(assignment) {
                    return assignment.role
                });

                splitPeriods(project);

                $scope.$watch('projects['+projectIndex+']', function(newValue, oldValue) {
                    if(newValue && newValue.timelog != oldValue.timelog && newValue.timelog.length >= oldValue.timelog.length) {
                        timelogService.updateTimelog(preferences.get('user')._id, newValue.timelog);
                    }
                }, true);
            });
        };

        function splitPeriods(project) {
            project.splittedTimelog = [];
            project.periods.forEach(function(period) {
                var timelogPeriod,
                    startIndex = _.findIndex(project.timelog, {date: moment(new Date(period.start)).calendar()}),
                    endIndex = _.findIndex(project.timelog, {date: moment(new Date(period.end)).calendar()});

                timelogPeriod = project.timelog.slice(startIndex, endIndex + 1);
                project.splittedTimelog.push(timelogPeriod);
            });
        }

        $scope.addRow = function(log, dayIndex, project) {
            var newRow = angular.copy(project.template);
            newRow.date = log.date;
            newRow.isNotFirstDayRecord = true;
            project.timelog.splice(dayIndex + 1, 0, newRow);
            splitPeriods(project);
        };

        $scope.removeRow = function(log, dayIndex, project) {
            timelogService.removeTimelog(log).success(function() {
                project.splittedTimelog[project.currentTimelogIndex].splice(dayIndex, 1);
                project.timelog.splice(dayIndex, _.findIndex(project.timelog, {$$hashKey: log.$$hashKey}));
                splitPeriods(project);
            });
        };

        $scope.isWeekend = function(date) {
            return $filter('isWeekendDay')(date);
        };

        $scope.previousPeriod = function(project) {
            project.currentTimelogIndex--;
        };

        $scope.nextPeriod = function(project) {
            project.currentTimelogIndex++;
        };
    }]);