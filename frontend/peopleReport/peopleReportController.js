'use strict';

angular.module('myApp.peopleReport', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/peopleReport', {
            templateUrl: 'frontend/peopleReport/peopleReportView.html',
            controller: 'peopleReportController'
        });
    }])

    .controller('peopleReportController', ['$scope', function ($scope) {
        $scope.page = 'peopleReport';
    }]);