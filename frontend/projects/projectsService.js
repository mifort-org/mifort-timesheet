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

angular.module('mifortTimelog.projects').factory('projectsService',
    ['$http', function($http) {
        return {
            saveAssignment: function(projectId, user) {
                return $http.post('user/assignment/' + projectId, user);
            },
            saveOrCreateProject: function(project) {
                return $http.post('project/', project);
            },
            getProjects: function(companyId) {
                return $http.get('projects?companyId=' + companyId);
            },
            getAssignedEmployers: function(projectId) {
                return $http.get('/user/project/' + projectId);
            },
            getCompanyEmployers: function(companyId) {
                return $http.get('/user/company/' + companyId);
            },
            removeProject: function(projectId) {
                return $http.get('/project/deactivate/' + projectId);
            }
        }
    }
    ]);
