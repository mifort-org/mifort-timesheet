'use strict';

angular.module('myApp.projects').factory('projectsService',
    ['$http', function ($http) {
        return {
            getAssignments: function (projects) {
                return $http.get('project/' + projects);
            },
            saveOrCreateProject: function (project) {
                return $http.post('project/', project);
            },
            getProjects: function(companyId){
                return $http.get('projects?companyId=' + companyId);
            },
            getAssignedUsers: function(projectId) {
                return $http.get('users?projectId=' + projectId);
            },
            getCompanyEmployers: function(companyId) {
                return $http.get('users?companyId=' + companyId);
            }
        }
    }
    ]);
