'use strict';

angular.module('myApp.projects', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html',
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', 'projectsService', 'preferences', '$timeout', function($scope, projectsService, preferences, $timeout) {
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
                    project.projectAssignments = [];
                    assignedEmployers.forEach(function(employee) {
                        if(employee.assignments.length > 1){
                            employee.assignments.forEach(function(assignment) {
                                var projectAssignment = _.clone(employee);

                                projectAssignment.assignments = [assignment];
                                project.projectAssignments.push(projectAssignment);
                            });
                        }
                        else{
                            project.projectAssignments.push(employee);
                        }
                    });
                    project.isCollapsed = false;
                    //temp, remove after backend validation
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
                $scope.projects[$scope.projects.length - 1] = project;
            });
        };

        $scope.saveAssignment = function(project, employee) {
            var aggregatedEmployee,
                aggregatedEmployeeAssignments = [];

            _.filter(project.projectAssignments, {_id: employee._id}).forEach(function(assignment) {
                aggregatedEmployeeAssignments.push(assignment.assignments[0]);
            });

            aggregatedEmployee = _.clone(employee);
            aggregatedEmployee.assignments = aggregatedEmployeeAssignments;
            projectsService.saveAssignment(project._id, aggregatedEmployee);
        };

        $scope.removeProject = function(project, projectIndex) {
            $scope.projects.splice(projectIndex, 1);
            projectsService.removeProject(project._id);
        };

        $scope.removeAssignment = function(project, assignment, assignmentIndex) {
            project.projectAssignments.splice(assignmentIndex, 1);
            $scope.saveAssignment(project, assignment);
        };
    }]);