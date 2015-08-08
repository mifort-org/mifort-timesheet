'use strict';

angular.module('myApp.timesheetManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/timesheetManagement', {
            templateUrl: 'frontend/timesheetManagement/timesheetManagementView.html',
            controller: 'timesheetManagementController'
        });
    }])

    .controller('timesheetManagementController', ['$scope', function ($scope) {
        $scope.page = 'timesheetManagement';
    }]);