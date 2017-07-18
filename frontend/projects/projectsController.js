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

angular.module('mifortTimesheet.projects', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html',
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', 'projectsService', 'preferences', 'topPanelService', 'Notification',
        function ($scope, projectsService, preferences, topPanelService, Notification) {
            var companyId = preferences.get('user').companyId,
                timer = null,
                basicSteps = [
                    {
                        element: '#step1',
                        intro: "<p>This section contains a company project. </p>" +
                        "<p>Each project table has three columns: </p>" +
                        "<ul class=\"dotted-list\"><li><strong>Assignment</strong> - contains the dropdown list with all possible assignments for current company (i.e. Developer, QA, Manager, Team Lead etc.). </li>" +
                        "<li><strong>Workload</strong> - set\'s the employee\'s default workload for the current project. </li>" +
                        "<li><strong>Person</strong> - contains the search/dropdown with all company\'s employees. Each assigned employee could be deassigned by pressing the red cross button next to that employees table row. " +
                        "Each employee could be assigned on any project any number of times with any roles.</li></ul>",
                        position: 'bottom'
                    },
                    {
                        element: '#step2',
                        intro: "<p>Pressing the blue Diamond button as well as \"<strong>Add Project</strong>\" link at the top of page will create a new empty project.</p>",
                        position: 'left'
                    },
                    {
                        element: '#step4',
                        intro: "<p>Click on the Project Name will allow you to change it.</p>" +
                        "<p>Pressing the arrow icon will minimize or maximize the project.</p>",
                        position: 'right'
                    }
                ],
                activeProjectsIntroSteps = [
                    {
                        element: '#step3',
                        intro: "<p>Pressing the \"archive\" button will close and archive the project and make it inactive," +
                        "so user will not be able to log time on this project.</p>",
                        position: 'left'
                    },
                    {
                        element: '#step5',
                        intro: "<p>Pressing the \"dearchive\" button will dearchive the project and make it active back," +
                        "so user will be able to log time on this project.</p>",
                        position: 'left'
                    },
                    {
                        element: '#step6',
                        intro: "<p>Pressing the \"remove\" button will delete archived project completely. " +
                        "All timesheets with logged time for deleted projects will not be deleted.</p>",
                        position: 'left'
                    }
                ];

            $scope.showActiveProjects = true;

            $scope.projectsKeys = [
                'Employee',
                'Workload'
            ];
            $scope.assignments = [
                'Developer',
                'QA'
            ];
            $scope.currentProjectIndex = 0;

            projectsService.getProjects(companyId).success(function (projects) {
                if (projects.length) {
                    $scope.projects = _.sortBy(projects, function (project) {
                        return project.name.toLowerCase();
                    });
                    $scope.availablePositions = projects[0].availablePositions;

                    $scope.projects.forEach(function (project) {
                        projectsService.getAssignedEmployers(project._id).success(function (assignedEmployers) {
                            project.assignedEmployers = _.sortBy(assignedEmployers, 'displayName') || [];
                            project.isCollapsed = !project.active;
                            project.projectEdit = false;
                            project.loading = false;
                        });
                    });
                }
                else {
                    $scope.projects = [];
                }

            });
            /*$scope.Sort = function (){
             projectsService.getProjects(companyId).success(function (projects) {
             if (projects.length) {
             $scope.projects = _.sortBy(projects, 'name');
             $scope.availablePositions = projects[0].availablePositions;

             $scope.projects.forEach(function (project) {
             projectsService.getAssignedEmployers(project._id).success(function (assignedEmployers) {
             project.assignedEmployers = _.sortBy(assignedEmployers, 'displayName') || [];
             project.isCollapsed = !project.active;
             project.projectEdit = false;
             project.loading = false;
             });
             });
             }
             else {
             $scope.projects = [];
             }

             });
             };*/
            $scope.introSteps = [
                {
                    element: '#step1',
                    intro: "<p>This section contains a company project. </p>" +
                    "<p>Each project table has three columns: </p>" +
                    "<ul class=\"dotted-list\"><li><strong>Assignment</strong> - contains the dropdown list with all possible assignments for current company (i.e. Developer, QA, Manager, Team Lead etc.). </li>" +
                    "<li><strong>Workload</strong> - set\'s the employee\'s default workload for the current project. </li>" +
                    "<li><strong>Person</strong> -F contains the search/dropdown with all company\'s employees. Each assigned employee could be deassigned by pressing the red cross button next to that employees table row. " +
                    "Each employee could be assigned on any project any number of times with any roles.</li></ul>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Pressing the blue Diamond button as well as \"<strong>Add Project</strong>\" link at the top of page will create a new empty project.</p>",
                    position: 'left'
                },
                {
                    element: '#step3',
                    intro: "<p>Pressing the \"archive\" button will close and archive the project and make it inactive," +
                    "so user will not be able to log time on this project.</p>" +
                    "<p>Pressing the \"dearchive\" button will dearchive the project and make it active back," +
                    "so user will be able to log time on this project.</p>" +
                    "<p>Pressing the \"remove\" button will delete archived project completely. " +
                    "All timesheets with logged time for deleted projects will not be deleted.</p>",
                    position: 'left'
                },
                {
                    element: '#step4',
                    intro: "<p>Click on the Project Name will allow you to change it.</p>" +
                    "<p>Pressing the arrow icon will minimize or maximize the project.</p>",
                    position: 'right'
                }
            ];

            projectsService.getCompanyEmployers(companyId).success(function (employees) {
                $scope.companyEmployees = employees;
            });
            $scope.ProjectShow = true;

            $scope.changeProjectName = function (project) {
                // var counter = null;
                // for (var i = 0; i < $scope.projects.length; i++) {
                //     if ($scope.projects[i].name == project.name) {
                //         counter++;
                //         break;
                //     }
                // }
                // if (counter) {
                //     project.projectEdit = true;
                //     Notification.error('This name is already taken');
                // } else {
                projectsService.saveOrCreateProject(project).success(function () {
                    Notification.success('Changes saved');
                });
                // }
            };

            $scope.addProject = function () {
                projectsService.getProjects(companyId).success(function (projects) {
                    $scope.projects = projects;
                });
                var projectNumber = $scope.projects.length + 1;
                var newProject = {
                    name: 'New Project' + ' ' + projectNumber,
                    companyId: companyId
                };

                $scope.showActiveProjects = true;

                projectsService.saveOrCreateProject(newProject).success(function (project) {
                    project.assignedEmployers = [];
                    $scope.projects.unshift(project);
                    Notification.success('Changes saved');
                });
                document.getElementsByClassName("main-container")[0].scrollTop = "0";
            };

            $scope.saveAssignment = function (project, assignedEmployee, employee, previousEmployeeId, assignmentIndex) {
                projectsService.saveAssignment(project._id, assignedEmployee).success(function () {
                    Notification.success('Changes saved');
                });
            };

            $scope.archiveProject = function (project, projectIndex) {
                if (project._id) {
                    projectsService.archiveProject(project._id).success(function (data) {
                        project.active = false;
                        project.isCollapsed = true;
                    });
                }
            };

            $scope.dearchiveProject = function (project) {
                if (project._id) {
                    projectsService.dearchiveProject(project._id).success(function (data) {
                        project.active = true;
                        project.isCollapsed = false;
                    });
                }
            };

            $scope.removeProject = function (project, projectIndex) {
                $scope.projects.splice(projectIndex, 1);

                if (project._id) {
                    projectsService.removeProject(project._id).success(function () {
                        Notification.success('Changes saved');
                    });
                }
            };

            $scope.changeRole = function (project, assignedEmployee, assignment, availablePosition) {
                assignment.role = availablePosition;
                $scope.saveAssignment(project, assignedEmployee);
            };

            $scope.changeUser = function (project, assignedEmployee, companyEmployeeId) {

                var companyEmployee = _.findWhere($scope.companyEmployees, {_id: companyEmployeeId});

                var userLostAssignment = _.findWhere(project.assignedEmployers, {_id: assignedEmployee._id});

                var assignment = _.findWhere(userLostAssignment.assignments, {projectId: project._id});
                var assignmentIndex = userLostAssignment.assignments.indexOf(assignment);

                assignment.userId = companyEmployeeId;

                var userGotAssignment = {
                    _id: companyEmployeeId,
                    assignments: [assignment],
                    displayName: companyEmployee.displayName
                };

                var assignedEmployer = _.findWhere(project.assignedEmployers, {_id: userLostAssignment._id});
                project.assignedEmployers.splice(project.assignedEmployers.indexOf(assignedEmployer), 1);

                project.assignedEmployers.push(userGotAssignment);

                userLostAssignment.assignments.splice(assignmentIndex, 1);

                //remove assignment for one and add for another
                $scope.saveAssignment(project, userLostAssignment);
                $scope.saveAssignment(project, userGotAssignment);
            };

            $scope.addAssignment = function (project, employee) {
                var userForAssignment = _.findWhere($scope.companyEmployees, {_id: employee._id});

                if (userForAssignment) {
                    var newAssignment = {
                        projectId: project._id,
                        projectName: project.name,
                        role: project.availablePositions[0],
                        userId: userForAssignment._id,
                        workload: ''
                    };

                    userForAssignment.assignments = [newAssignment];

                    var got = _.clone(userForAssignment);
                    got.assignments = _.filter(got.assignments, function (assignment) {
                        return assignment.projectId == project._id;
                    });
                    project.assignedEmployers.push(got);

                    $scope.saveAssignment(project, _.clone(userForAssignment));
                }
            };

            $scope.removeAssignment = function (project, assignedEmployee, assignmentIndex) {
                assignedEmployee.assignments.splice(assignmentIndex, 1);
                $scope.saveAssignment(project, assignedEmployee);
                var index = project.assignedEmployers.indexOf(_.findWhere(project.assignedEmployers, {_id: assignedEmployee._id}));
                project.assignedEmployers.splice(index, 1);
            };

            $scope.notAssignedEmployees = function (project) {
                if (!$scope.companyEmployees) return [];
                var employees = [];
                $scope.companyEmployees.forEach(function (employee) {
                    if (!_.findWhere(project.assignedEmployers, {_id: employee._id})) {
                        employees.push(employee);
                    }
                });
                return employees;
            };

            $scope.$on('handleBroadcast', function () {
                if (topPanelService.linkName == 'project') {
                    $scope.addProject();
                }
            });

            $scope.toggleEditButton = function (project) {
                project.projectEdit = !project.projectEdit;
            };

            $scope.checkProjectName = function (project) {
                var counter = null;
                for (var i = 0; i < $scope.projects.length; i++) {
                    if ($scope.projects[i].name == project.name && project._id != $scope.projects[i]._id) {
                        counter++;
                        break;
                    }
                }
                if (counter) {
                    project.projectEdit = true;
                    Notification.error('This name is already taken');
                } else if (!project.name) {
                    Notification.error('No project name');
                } else {
                    $scope.changeProjectName(project);
                    $scope.toggleEditButton(project);

                }
            };
        }]);