'use strict';

angular.module('myApp.login').factory('loginService',
    ['$http', function ($http) {
        var service = {
            getUser: function (postRequest) {
                return {
                    '_id': 12312312312,
                    'userId': 13,
                    'createdOn': '01/01/2016',
                    'updatedOn': '01/01/2016',
                    'name': 'Andrew A',
                    'login': 'rest',
                    'workload': 8,
                    'assignments': [
                        {
                            'assignmentId': 1,
                            'userId': 13,
                            'role': 'Developer',
                            'workload': 4,
                            'projectId': 21,
                            'projectName': 'Super puper project'
                        },
                        {
                            'assignmentId': 2,
                            'userId': 13,
                            'role': 'QA',
                            'workload': 4,
                            'projectId': 21,
                            'projectName': 'Super puper project'
                        }
                    ]
                }
            }
        };

        return service;
    }
    ]);
