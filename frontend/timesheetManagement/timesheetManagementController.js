'use strict';

angular.module('myApp.timesheetManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timesheetManagement', {
            templateUrl: 'timesheetManagement/timesheetManagementView.html',
            controller: 'timesheetManagementController'
        });
    }])

    .controller('timesheetManagementController', ['$scope', 'timesheetManagementService', function ($scope, timesheetManagementService) {
        var projectId, periodId;
        $scope.periodSettings = [
            {
                periodName: 'week',
                daysAmount: 7
            },
            {
                periodName: 'month',
                daysAmount: 30
            },
            {
                periodName: 'decade',
                daysAmount: 90
            },
            {
                periodName: 'year',
                daysAmount: 365
            }
        ];

        $scope.status = {
            opened: false
        };

        $scope.weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        $scope.open = function($event) {
            $scope.status.opened = true;
        };

        $scope.timesheets = timesheetManagementService.getTimesheet(projectId, periodId);
    }]);