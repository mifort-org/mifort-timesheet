'use strict';

angular.module('myApp.projects', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html',
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', 'projectsService', 'preferences', function ($scope, projectsService, preferences) {
        var companyId = preferences.get('user').companyId;
        $scope.projectsKeys = [
            'Employee',
            'Assignment',
            'Workload'
        ];
        $scope.currentProjectIndex = 0;

         projectsService.getProjects(companyId).success(function(projects) {
             $scope.projects = projects;

             $scope.projects.forEach(function(project) {
                 projectsService.getAssignedUsers(project._id).success(function(projectUsers) {
                     project.employees = projectUsers;
                     project.isCollapsed = false;
                 });
             });
        });

        projectsService.getCompanyEmployers(companyId).success(function(employees) {
            $scope.companyEmployees = employees;
        });

        $scope.changeProjectName = function(project) {
            projectsService.saveOrCreateProject(project);
        };

        $scope.addProject = function() {
            var newProject = {
                name: 'New Project',
                companyId: companyId
            };
            $scope.projects.push(newProject);
            projectsService.saveOrCreateProject(newProject).success(function(project) {
                newProject = project;
            });
        }
    }]);