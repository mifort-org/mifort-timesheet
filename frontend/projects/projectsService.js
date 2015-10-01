'use strict';

angular.module('myApp.projects').factory('projectsService',
    ['$http', function ($http) {
        return {
            saveAssignment: function (projectId, assignment) {
                return $http.post('user/assignment/' + projectId, assignment);
            },
            saveOrCreateProject: function (project) {
                return $http.post('project/', project);
            },
            getProjects: function(companyId){
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
