'use strict';

angular.module('myApp.timesheetManagement').factory('timesheetManagementService',
    ['$http', function ($http) {
        return {
            getProject: function (projectId) {
                return $http.get('project/' + projectId);
            },
            saveProject: function (parameters) {
                $http.post('project', parameters);
            },
            getPeriodSettings: function () {
                return [
                    {periodName: 'Week'},
                    {periodName: 'Month'}
                ]
            },
            getDayTypes: function () {
                return [
                    {typeName: 'Weekend'},
                    {typeName: 'Holiday'}
                ]
            },
            getWeekDays: function () {
                return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            }
        };
    }
    ]);
