/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

angular.module('mifortTimelog.projects', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html',
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', 'projectsService', 'preferences', 'topPanelService', 'Notification',
        function($scope, projectsService, preferences, topPanelService, Notification) {
        var companyId = preferences.get('user').companyId;

        $scope.projectsKeys = [
            'Employee',
            'Assignment',
            'Workload'
        ];
        $scope.assignments = [
            'Developer',
            'QA'
        ];
        $scope.currentProjectIndex = 0;

        projectsService.getProjects(companyId).success(function(projects) {
            $scope.projects = projects;
            $scope.availablePositions = projects[0].availablePositions;

            $scope.projects.forEach(function(project) {
                projectsService.getAssignedEmployers(project._id).success(function(assignedEmployers) {
                    project.assignedEmployers = assignedEmployers;
                    project.isCollapsed = false;
                    project.projectEdit = false;
                });
            });
        });

        projectsService.getCompanyEmployers(companyId).success(function(employees) {
            $scope.companyEmployees = employees;
        });

        $scope.changeProjectName = function(project) {
            projectsService.saveOrCreateProject(project).success(function() {
                Notification.success('Changes saved');
            });
        };

        $scope.addProject = function() {
            var newProject = {
                name: 'New Project',
                companyId: companyId
            };

            $scope.projects.push(newProject);
            projectsService.saveOrCreateProject(newProject).success(function(project) {
                $scope.projects[$scope.projects.length - 1] = project;
                Notification.success('Changes saved');
            });
        };

        $scope.saveAssignment = function(project, assignedEmployee, employee, previousEmployeeId, assignmentIndex) {
            projectsService.saveAssignment(project._id, assignedEmployee).success(function() {
                Notification.success('Changes saved');
            });
        };

        $scope.removeProject = function(project, projectIndex) {
            $scope.projects.splice(projectIndex, 1);
            if(project._id){
                projectsService.removeProject(project._id);
            }
        };

        $scope.changeRole = function(project, assignedEmployee, assignment, availablePosition) {
            assignment.role = availablePosition;
            $scope.saveAssignment(project, assignedEmployee);
        };
            
        $scope.changeUser = function(project, assignedEmployee, companyEmployeeId, assignmentIndex) {
            var userLostAssignment = assignedEmployee,
                userGotAssignment = _.findWhere(project.assignedEmployers, {_id: companyEmployeeId}) ||
                                    _.findWhere(companyEmployees, {_id: companyEmployeeId}),
                assignment = userLostAssignment.assignments[assignmentIndex];

            assignment.userId = userGotAssignment._id;

            //if user already assigned somewhere
            if(userGotAssignment.assignments){
                userGotAssignment.assignments.push(assignment);
            }
            else{
                userGotAssignment.assignments = [assignment];
            }

            userLostAssignment.assignments.splice(assignmentIndex, 1);

            //remove assignment for one and add for another
            $scope.saveAssignment(project, userLostAssignment);
            $scope.saveAssignment(project, userGotAssignment);
        };

        $scope.removeAssignment = function(project, assignedEmployee, assignmentIndex) {
            assignedEmployee.assignments.splice(assignmentIndex, 1);
            $scope.saveAssignment(project, assignedEmployee);
        };

        $scope.$on('handleBroadcast', function() {
            if(topPanelService.linkName = 'project'){
                $scope.addProject();
            }
        });
    }]);