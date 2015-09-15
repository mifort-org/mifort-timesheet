'use strict';

angular.module('myApp.projects', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html',
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', '$location', 'projectsService', function ($scope, $location, projectsService) {
        $scope.timelogKeys = [
            'Employee',
            'Assignment',
            'Workload'
        ]
    }]);