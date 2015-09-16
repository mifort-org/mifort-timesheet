'use strict';

angular.module('myApp.timelog').factory('timelogService',
    ['$http', function ($http) {
        return {
            getTimelog: function (userId, projectId, startDate, endDate) {
                return $http.get('timelog/' + userId + '?projectId=' + projectId + '&startDate=' + startDate+ '&endDate=' + endDate);
            },
            removeTimelog: function (log) {
                return $http.delete('timelog/', log);
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
