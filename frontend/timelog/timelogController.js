'use strict';

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetManagementService', 'preferences', function ($scope, $filter, timelogService, timesheetManagementService, preferences) {
        $scope.currentTimelogIndex = 0;
        $scope.isCollapsed = false;
        $scope.timelogKeys = timelogService.getTimelogKeys();

        timesheetManagementService.getProject(preferences.get('user').assignments[0].projectId).success(function (data) {
            $scope.project = data;
        }).then(function () {
            timelogService.getTimelog(preferences.get('user')._id, $scope.project._id, $scope.project.periods[0].start, $scope.project.periods[0].end).success(function (data) {
                $scope.init(data.timelog);
            })
        });

        $scope.init = function (userTimelog) {
            $scope.timelog = [];
            var startDate = moment(new Date($scope.project.periods[0].start)),
                endDate = moment(new Date($scope.project.periods[$scope.project.periods.length - 1].end)),
                daysToGenerate = endDate.diff(startDate, 'days');

            for (var i = 0; i < daysToGenerate + 1; i++) {
                var dayToPush;

                $scope.project.template.workload = preferences.get('user').workload;
                $scope.project.template.userId = preferences.get('user')._id;
                $scope.project.template.projectId = $scope.project._id;
                $scope.project.template.projectName = $scope.project.name;

                dayToPush = _.clone($scope.project.template);
                dayToPush.date = angular.copy(startDate).add(i, 'days').calendar();
                dayToPush.isFirstDayRecord = true;

                $scope.timelog.push(dayToPush);
            }

            if ($scope.project.defaultValues) {
                $scope.project.defaultValues.forEach(function (day) {
                    var dayExisted = _.findWhere($scope.timelog, {date: moment(new Date(day.date)).calendar()});
                    if(dayExisted){
                        angular.extend(dayExisted, day);
                    }
                });
            }

            //$scope.timelog = angular.extend($scope.timelog, userTimelog);
            userTimelog.forEach(function (day, index) {
                var timelogDayIndex = _.findIndex($scope.timelog, {date: moment(new Date(day.date)).calendar()});
                day.isFirstDayRecord = false;

                //if current iterated log is not the first for this date to push
                if(userTimelog[index - 1] && userTimelog[index - 1].date == day.date){
                    $scope.timelog.splice(timelogDayIndex + 1, 0, day);
                }
                else{
                    day.isFirstDayRecord = true;
                    angular.extend(_.findWhere($scope.timelog, {date: day.date}), day);
                }
            });

            $scope.timelogAssigments = preferences.get('user').assignments.map(function (assignment) {
                return assignment.role
            });

            splitPeriods();

            $scope.$watch('timelog', function () {
                timelogService.updateTimelog(preferences.get('user')._id, $scope.timelog);
            }, true);
        };

        function splitPeriods () {
            $scope.splittedTimelog = [];
            $scope.project.periods.forEach(function (period) {
                var timelogPeriod,
                    startIndex = _.findIndex($scope.timelog, {date: moment(new Date(period.start)).calendar()}),
                    endIndex = _.findIndex($scope.timelog, {date: moment(new Date(period.end)).calendar()});

                timelogPeriod = $scope.timelog.slice(startIndex, endIndex + 1);
                $scope.splittedTimelog.push(timelogPeriod);
            });
        }

        $scope.addRow = function (log, dayIndex) {
            var newRow = angular.copy($scope.project.template);
            newRow.date = log.date;
            newRow.isNotFirstDayRecord = true;
            $scope.timelog.splice(dayIndex+1, 0, newRow);
            splitPeriods();
        };

        $scope.removeRow = function (log, dayIndex) {
            $scope.timelog.splice(dayIndex, 1);
            splitPeriods();
        };

        $scope.isWeekend = function (date) {
            return $filter('isWeekendDay')(date);
        };

        $scope.previousPeriod = function () {
            $scope.currentTimelogIndex--;
        };

        $scope.nextPeriod = function () {
            $scope.currentTimelogIndex++;
        };
    }]);