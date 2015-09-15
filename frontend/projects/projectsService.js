'use strict';

angular.module('myApp.projects').factory('projectsService',
    ['$http', function ($http) {
        return {
            getProjects: function (projects) {
                return $http.get('projects/', projects);
            },
            createProject: function (projectsData) {
                return $http.post('projects/', projectsData);
            }
        }
    }
    ]);
