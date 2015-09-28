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
             console.log($scope.projects);
             $scope.projects.forEach(function(project) {
                 projectsService.getAssignedUsers(project._id).success(function(projectUsers) {
                     project.employees = projectUsers;
                 });
             });

        });
        projectsService.getAssignments(preferences.get('user').companyId);
    }]);