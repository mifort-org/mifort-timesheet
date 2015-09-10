'use strict';

angular.module('myApp.timelog').factory('timelogService',
    ['$http', function ($http) {
        return {
            getTimelog: function (userId, periodId) {
                return $http.get('project/' + projectId);
                
                return {
                    'timelog': [
                        {
                            "_id": "55d041ef0232c58c2e9dae5c",
                            "date": "01/05/2015",
                            "time": 6,
                            "comment": "Save the world!123",
                            "userId": "u1",
                            "projectId": "p1",
                            "projectName": "Super project",
                            "role": "Developer",
                            "workload": 8
                        }
                    ]
                }
            },
            getTimelogKeys: function () {
                return {
                    'date': 'Date',
                    'dateId': 'Assigment',
                    'time': 'Time',
                    'comment': 'Comment'
                }
            },
            updateTimelog: function (userId, periodId) {
                //return $http.put(url.restRoot + userId + '?periodId=' + periodId);
            }
        }
    }
    ]);
