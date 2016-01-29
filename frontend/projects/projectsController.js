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

    .controller('projectsController', ['$scope', 'projectsService', 'preferences', 'topPanelService', 'Notification', 'notifyingService',
        function($scope, projectsService, preferences, topPanelService, Notification, notifyingService) {
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

            $scope.IntroSteps = [
                {
                    element: '#step1',
                    intro: "<p>This page contains a list of tables for each company project. </p>" +
                    "<p>Each project table has three columns: </p>" +
                    "<p>Assignment - contains the dropdown list with all possible assignments for current company (i.e. Developer, QA, Manager, Team Lead etc.). </p>" +
                    "<p>Workload - set\'s the employee\'s default workload for the current project. </p>" +
                    "<p>Person - contains the search/dropdown with all company\'s employees. Each assigned employee could be deassigned by pressing the red cross button next to that employees table row. " +
                    "Each employee could be assigned on any project any number of times under any roles. </p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Pressing the blue Diamond button at the bottom right corner of the page as well as \"Add Project\" link at the top of page will create a new empty project.</p>",
                    position: 'left'
                },
                {
                    element: '#step3',
                    intro: "<p>Each project has the cross button at the right top corner that will close and archive the project and make it inactive, " +
                    "so assigned users will be unassigned and will not be able to log time on this project.</p>",
                    position: 'left'
                },
                {
                    element: '#step4',
                    intro: "<p>Click on the Project Name will allow the user to change the Project Name.</p>" +
                    "<p>Each project could be minimized or maximized by pressing the arrow icon near the Project Name.</p>",
                    position: 'right'
                }
            ];

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
                var userLostAssignment = _.findWhere(project.assignedEmployers, {_id: assignedEmployee._id}),
                    userGotAssignment = _.findWhere(project.assignedEmployers, {_id: companyEmployeeId}) ||
                        _.findWhere($scope.companyEmployees, {_id: companyEmployeeId}),
                    assignment = userLostAssignment.assignments[assignmentIndex];

                assignment.userId = userGotAssignment._id;

                //if user already assigned somewhere
                if(userGotAssignment.assignments && userGotAssignment.assignments.length){
                    userGotAssignment.assignments.push(assignment);
                }
                else{
                    userGotAssignment.assignments = [assignment];

                    if(!_.findWhere(project.assignedEmployers, {_id: companyEmployeeId})){
                        project.assignedEmployers.push(userGotAssignment);
                    }
                }

                userLostAssignment.assignments.splice(assignmentIndex, 1);

                //remove assignment for one and add for another
                $scope.saveAssignment(project, userLostAssignment);
                $scope.saveAssignment(project, userGotAssignment);
            };

            $scope.addAssignment = function(project, employee) {
                var userForAssignment = _.findWhere($scope.companyEmployees, {_id: employee._id});

                if(userForAssignment){
                    var userWithAssignments = _.findWhere(project.assignedEmployers, {_id: employee._id}),
                        newAssignment = {
                            projectId: project._id,
                            projectName: project.name,
                            role: project.availablePositions[0],
                            userId: userForAssignment._id,
                            workload: ''
                        };

                    //if user has assignments
                    if(userWithAssignments){
                        userWithAssignments.assignments.push(newAssignment);
                    }
                    else{
                        userForAssignment.assignments = [newAssignment];
                        project.assignedEmployers.push(userForAssignment);
                    }

                    $scope.saveAssignment(project, _.clone(userWithAssignments || userForAssignment));
                }
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