'use strict';

angular.module('myApp.report', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/report', {
            templateUrl: 'report/reportView.html',
            controller: 'reportController'
        });
    }])

    .controller('reportController', ['$scope', function($scope) {
        $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];

        $scope.gridOptions = {
            enableFiltering: true,
            columnDefs: [
                {field: 'Data'},
                {field: 'User'},
                {field: 'Project'},
                {field: 'Assignment'},
                {field: 'Time'},
                {field: 'Action'}
            ],
            data: 'reportColumns'
        };
    }]);