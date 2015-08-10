'use strict';

angular.module('myApp.peopleReport', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/peopleReport', {
            templateUrl: 'peopleReport/peopleReportView.html',
            controller: 'peopleReportController'
        });
    }])

    .controller('peopleReportController', ['$scope', function ($scope) {
        $scope.page = 'peopleReport';
    }]);