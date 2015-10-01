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
        $scope.assignments = [
            'Developer',
            'QA',
            'Teamlead',
            'Manager',
            'SEO',
            'CTO',
            'Junior Developer',
            'Senior Developer',
            'Junior QA',
            'Senior QA',
            'Designer',
            'UX'
        ];
        $scope.currentProjectIndex = 0;

         projectsService.getProjects(companyId).success(function(projects) {
             $scope.projects = projects;

             $scope.projects.forEach(function(project) {
                 projectsService.getAssignedEmployers(project._id).success(function(assignedEmployers) {
                     project.employees = assignedEmployers;
                     project.isCollapsed = false;
                     //temp
                     project.projectEdit = false;
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
                $scope.projects[$scope.projects.length-1] = project;
            });
        };

        $scope.saveAssignment = function(project, employee) {
            projectsService.saveAssignment(project._id, employee).success(function(project) {
                true
            });
        }
    }]);