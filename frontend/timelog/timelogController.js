'use strict';

angular.module('myApp.timelog', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timelog', {
            templateUrl: 'timelog/timelogView.html',
            controller: 'timelogController'
        });
    }])

    .controller('timelogController', ['$scope', '$filter', 'timelogService', 'timesheetManagementService', 'preferences', function ($scope, $filter, timelogService, timesheetManagementService, preferences) {

        timesheetManagementService.getProject(preferences.get('user').assignments[0].projectId).success(function (data) {
            $scope.project = data;
        }).then(function () {
            timelogService.getTimelog(preferences.get('user')._id, $scope.project._id, $scope.project.periods[0].start, $scope.project.periods[0].end).success(function (data) {
                $scope.init(data.timelog);
            })
        });

        $scope.init = function (userTimelog) {
            $scope.timelog = [];
            var startDate = $scope.project.periods[0].start;

            for (var i = 0; i < 150; i++) {
                var dayToPush = _.clone($scope.project.template);
                dayToPush.date = moment(new Date(startDate)).add(i, 'days').calendar();
                dayToPush.workload = preferences.get('user').workload;
                dayToPush.userId = preferences.get('user')._id;
                dayToPush.projectId = $scope.project._id;
                dayToPush.projectName = $scope.project.name;
                $scope.timelog.push(dayToPush);
            }

            //$scope.timelog = angular.extend($scope.timelog, userTimelog);
            userTimelog.forEach(function (day) {
                angular.extend(_.findWhere($scope.timelog, {date: day.date}), day);
            });

            $scope.timelogAssigments = preferences.get('user').assignments.map(function (assignment) {
                return assignment.role
            });

            if ($scope.project.defaultValues) {
                $scope.project.defaultValues.forEach(function (day) {
                    var dayExisted = _.findWhere($scope.timelog, {date: moment(new Date(day.date)).calendar()});
                    if(dayExisted){
                        angular.extend(dayExisted, day);
                    }
                });
            }

            $scope.splittedTimelog = [];
            $scope.project.periods.forEach(function (period) {
                var timelogPeriod,
                    startIndex = _.findIndex($scope.timelog, {date: moment(new Date(period.start)).calendar()}),
                    endIndex = _.findIndex($scope.timelog, {date: moment(new Date(period.end)).calendar()});

                timelogPeriod = $scope.timelog.slice(startIndex, endIndex + 1);
                $scope.splittedTimelog.push(timelogPeriod);
            });

            $scope.$watch('timelog', function () {
                console.log('Tmelog saved');
                timelogService.updateTimelog(preferences.get('user')._id, $scope.timelog);
            }, true);
        };

        $scope.currentTimelogIndex = 0;
        $scope.timelogKeys = timelogService.getTimelogKeys();


        $scope.addRow = function (dateId, rowIndex) {
            var newRow = $filter('getByProperty')($scope.project.template, dateId, 'dateId');
            $scope.timelog.splice(rowIndex, 0, newRow);
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