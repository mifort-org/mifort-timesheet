'use strict';

angular.module('myApp.projects').factory('projectsService',
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
            }
        }
    }
    ]);
