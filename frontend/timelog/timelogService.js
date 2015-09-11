'use strict';

angular.module('myApp.timelog').factory('timelogService',
    ['$http', function ($http) {
        return {
            getTimelog: function (userId, projectId, startDate, endDate) {
                return $http.get('timelog/' + userId + '?projectId=' + projectId + '&startDate=' + startDate+ '&endDate=' + endDate);
                
                //return {
                //    'timelog': [
                //        {
                //            "_id": "55d041ef0232c58c2e9dae5c",
                //            "date": "01/05/2015",
                //            "time": 6,
                //            "comment": "Save the world!123",
                //            "userId": "u1",
                //            "projectId": "p1",
                //            "projectName": "Super project",
                //            "role": "Developer",
                //            "workload": 8
                //        }
                //    ]
                //}
            },
            getTimelogKeys: function () {
                return {
                    'date': 'Date',
                    'dateId': 'Role',
                    'time': 'Time',
                    'comment': 'Comment'
                }
            },
            updateTimelog: function (userId, timetog) {
                return $http.post('timelog', {'timelog': timetog});
            }
        }
    }
    ]);
