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

angular.module('mifortTimelog')
    .directive('projectRow', function() {
        return {
            scope: true,
            link: function(scope) {
                scope.addAssignment = function(project, employee) {
                    var userForAssignment = _.findWhere(scope.companyEmployees, {_id: employee._id});

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

                        scope.saveAssignment(project, _.clone(userWithAssignments || userForAssignment));
                    }

                    //employee = {};
                };
            },
            templateUrl: 'components/projectRow/projectRow.html'
        };
    });