'use strict';

angular.module('myApp.timesheetManagement').factory('timesheetManagementService',
    ['$http', function ($http) {
        var service = {
            getTimesheet: function (projectId, periodId) {
                return {
                    'calendar': [
                        {
                            'date': '01/01/2015',
                            'dateId': 1,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/02/2015',
                            'dateId': 2,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/03/2015',
                            'dateId': 3,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/04/2015',
                            'dateId': 4,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/05/2015',
                            'dateId': 5,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/06/2015',
                            'dateId': 6,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/07/2015',
                            'dateId': 7,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        }
                    ]
                }

            }
        };

        return service;
    }
    ]);
