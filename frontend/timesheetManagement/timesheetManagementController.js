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
        $scope.periodSettings = ['week', 'month', 'decade', 'year'];

        $scope.status = {
            opened: false
        };

        $scope.open = function($event) {
            $scope.status.opened = true;
        };

        $scope.timesheets = timesheetManagementService.getTimesheet(projectId, periodId);
    }]);