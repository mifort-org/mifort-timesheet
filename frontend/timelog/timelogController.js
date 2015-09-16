'use strict';

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetManagementService', 'preferences', function($scope, $filter, timelogService, timesheetManagementService, preferences) {
        $scope.currentTimelogIndex = 0;
        $scope.isCollapsed = false;
        $scope.projects = [];
        $scope.userTimelogs = [];
        $scope.timelog = [];
        $scope.splittedTimelog = [];
        $scope.timelogKeys = timelogService.getTimelogKeys();
        $scope.assignments = preferences.get('user').assignments;

        $scope.assignments.forEach(function(assignment, index) {
            timesheetManagementService.getProject(assignment.projectId).success(function(project) {
                $scope.projects.push(project);
            }).then(function() {
                var currentProject = $scope.projects[index],
                    startDate = currentProject.periods[0].start,
                    endDate = currentProject.periods[0].end;
                timelogService.getTimelog(preferences.get('user')._id, currentProject._id, startDate, endDate).success(function(projectTimelog) {
                    $scope.userTimelogs.push.apply($scope.userTimelogs, projectTimelog.timelog);

                    if($scope.assignments.length == index + 1) {
                        $scope.init();
                    }
                })
            });
        });

        $scope.init = function() {
            $scope.projects.forEach(function(project) {
                var startDate = moment(new Date(project.periods[0].start)),
                    endDate = moment(new Date(project.periods[project.periods.length - 1].end)),
                    daysToGenerate = endDate.diff(startDate, 'days');

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

                    $scope.timelog.push(dayToPush);
                }

                //timelogs data from timesheet
                if(project.defaultValues) {
                    project.defaultValues.forEach(function(day) {
                        var dayExisted = _.findWhere($scope.timelog, {date: moment(new Date(day.date)).calendar()});
                        if(dayExisted) {
                            angular.extend(dayExisted, day);
                        }
                    });
                }

                //user timelogs
                $scope.userTimelogs.forEach(function(day, index) {
                    var timelogDayIndex = _.findIndex($scope.timelog, {date: moment(new Date(day.date)).calendar()});
                    day.isFirstDayRecord = false;

                    //if current iterated log is not the first for this date to push
                    if($scope.userTimelogs[index - 1] && $scope.userTimelogs[index - 1].date == day.date) {
                        $scope.timelog.splice(timelogDayIndex + 1, 0, day);
                    }
                    else {
                        day.isFirstDayRecord = true;
                        angular.extend(_.findWhere($scope.timelog, {date: day.date}), day);
                    }
                });

                $scope.timelogAssigments = preferences.get('user').assignments.map(function(assignment) {
                    return assignment.role
                });

                splitPeriods(project);
            });


            $scope.$watch('timelog', function() {
                timelogService.updateTimelog(preferences.get('user')._id, $scope.timelog);
            }, true);
        };

        function splitPeriods(project) {
            project.periods.forEach(function(period) {
                var timelogPeriod,
                    startIndex = _.findIndex($scope.timelog, {date: moment(new Date(period.start)).calendar()}),
                    endIndex = _.findIndex($scope.timelog, {date: moment(new Date(period.end)).calendar()});

                timelogPeriod = $scope.timelog.slice(startIndex, endIndex + 1);
                $scope.splittedTimelog.push(timelogPeriod);
            });
        }

        $scope.addRow = function(log, dayIndex) {
            var newRow = angular.copy($scope.project.template);
            newRow.date = log.date;
            newRow.isNotFirstDayRecord = true;
            $scope.timelog.splice(dayIndex + 1, 0, newRow);
            splitPeriods();
        };

        $scope.removeRow = function(log, dayIndex) {
            $scope.timelog.splice(dayIndex, 1);
            timelogService.removeTimelog(log);
            splitPeriods();
        };

        $scope.isWeekend = function(date) {
            return $filter('isWeekendDay')(date);
        };

        $scope.previousPeriod = function() {
            $scope.currentTimelogIndex--;
        };

        $scope.nextPeriod = function() {
            $scope.currentTimelogIndex++;
        };
    }]);