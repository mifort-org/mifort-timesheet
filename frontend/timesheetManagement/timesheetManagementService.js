'use strict';

angular.module('myApp.timesheetManagement').factory('timesheetManagementService',
    ['$http', function ($http) {
        return {
            getCompany: function (companyId) {
                return $http.get('company/' + companyId);
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
                return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            }
        };
    }
    ]);
