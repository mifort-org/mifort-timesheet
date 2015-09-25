'use strict';

angular.module('myApp.projects').factory('projectsService',
    ['$http', function ($http) {
        return {
            getAssignments: function (projects) {
                return $http.get('project/' + projects);
            },
            createProject: function (projectsData) {
                return $http.post('projects/', projectsData);
            },
            getProjects: function(companyId){
                return $http.get('projects?companyId=' + companyId);
            }
        }
    }
    ]);
