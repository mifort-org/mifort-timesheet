'use strict';

angular.module('myApp.projects', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html',
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', 'projectsService', 'preferences', function ($scope, projectsService, preferences) {
        $scope.projectsKeys = [
            'Employee',
            'Assignment',
            'Workload'
        ];
        $scope.currentProjectIndex = 0;

         projectsService.getProjects(preferences.get('user').companyId).success(function(projects) {
             $scope.projects = projects;

             //projectsService.getAssignedUsers('');
        });
        projectsService.getAssignments(preferences.get('user').companyId);
    }]);