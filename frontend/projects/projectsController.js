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

angular.module('mifortTimesheet.projects', ['ngRoute', 'constants'])

    .config(['$routeProvider', 'appVersion', function ($routeProvider, appVersion) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html?rel=' + appVersion,
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', '$q', 'projectsService', 'preferences', 'topPanelService', 'Notification',
        function ($scope, $q, projectsService, preferences, topPanelService, Notification) {
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
            var newProjectIndex;
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

            $scope.companiesData = preferences.get('companiesData') || {};
            if(!$scope.companiesData[companyId]){
                $scope.companiesData[companyId] = {}
            }
            if(!$scope.companiesData[companyId].projectAssignments){
                $scope.companiesData[companyId].projectAssignments = []
            }

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
                projectsService.saveOrCreateProject(project).success(function () {
                    Notification.success('Changes saved');
                });
            };

            $scope.addProject = function () {
                if (!newProjectIndex) {
                    newProjectIndex = $scope.projects.length;
                }
                newProjectIndex++;
                var newProject = {
                    name: 'New Project' + ' ' + newProjectIndex,
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

            $scope.saveAssignment = function (project, assignedEmployee, employee) {
                assignedEmployee.assignments.forEach(function (assigned) {
                    if (assigned.workload[0] == '.') {
                        assigned.workload = '0' + assigned.workload;
                    }
                    if (assigned.workload > 8 && assigned.workload <= 24) {
                        Notification.warning({
                            message: 'You have filled in more then 8h per assignment for an employee',
                            delay: 4000
                        });
                    }
                });

                var assignId = assignedEmployee._id,
                    assignWorkload = 0;

                var assignments = [];
                $scope.projects.forEach(function (project) {
                    project.assignedEmployers.forEach(function (assignProject) {
                        if (assignProject._id == assignId) {
                            assignments = assignments.concat(assignProject.assignments);
                        }
                    })
                });

                assignments.forEach(function (assign) {
                    assignWorkload += parseInt(assign.workload);
                });

                if (assignWorkload > 24) {
                    Notification.error({
                        message:'You are trying to fill in more then 24h per day for an employee',
                        delay: 4000
                    });
                }
                else {
                    if (assignWorkload > 16 && assignWorkload <= 24) {
                        Notification.warning({
                            message: 'You have filled in more then 16h per day for an employee',
                            delay: 4000
                        });
                    }

                    $scope.saveAssignmentInLS(project, assignedEmployee);
                    $scope.prepareAssignmentsQueue();
                }
            };

            $scope.saveAssignmentInLS = function (project, employee) {
                var assignments = $scope.companiesData[companyId].projectAssignments;

                var isProjectExists = assignments.some(function(item, index){
                    if (item.projectId === project._id && item.userId === employee._id) {
                        assignments[index].employee = employee;
                        if(assignments[index].isSent){
                            assignments[index].isChanged = true;
                            assignments[index].isSaved = false;
                        }

                        return true;
                    }
                });

                if (!isProjectExists) {
                    assignments.push({
                        projectId: project._id,
                        userId: employee._id,
                        employee: employee
                    });
                }

                preferences.set('companiesData', $scope.companiesData);
            };

            $scope.sendAssignmentsQueue = function(assignments){
                var promises = [];
                assignments.forEach(function (assignment) {
                    if (!assignment.isSent || assignment.isChanged){
                        //TODO remove assignment.projectId after server api changes
                        var employee = assignment.employee,
                            projectId = employee.assignments[0] ? employee.assignments[0].projectId : assignment.projectId;

                        var promise = projectsService.saveAssignment(projectId, employee).then(function () {
                            if(!assignment.isChanged){
                                assignment.isSaved = true;
                            }
                        });

                        assignment.isSent = true;
                        assignment.isChanged = false;
                        preferences.set('companiesData', $scope.companiesData);
                        promises.push(promise);
                    }
                });

                return promises;
            };

            $scope.prepareAssignmentsQueue = _.debounce(function (isOnLoad) {
                var assignments = $scope.companiesData[companyId].projectAssignments,
                    promises = $scope.sendAssignmentsQueue(assignments);

                if (promises.length > 0) {
                    $q.all(promises).then(function() {
                        var msgSuccess = isOnLoad ? 'Latest changes were saved' : 'Changes  saved';
                        Notification.success(msgSuccess);
                        //TODO remove isSaved flags, refactor assignments to object after server api changes
                        assignments = assignments.filter(function(item){
                            return !item.isSaved;
                        });
                        $scope.companiesData[companyId].projectAssignments = assignments;
                        preferences.set('companiesData', $scope.companiesData);
                    }, function (){
                        Notification.warning({
                            message: 'Changes saved locally and will be sent later',
                            delay: 4000
                        });
                    });
                }
            }, 2000);
            $scope.prepareAssignmentsQueue(true);

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

            $scope.checkProjectNameLength = function (projectName) {
                var name = projectName;
                if (projectName && typeof projectName == 'string' && projectName.length > 140) {
                    name = projectName.slice(0, 140);
                }
                return name;
            };
        }]);
