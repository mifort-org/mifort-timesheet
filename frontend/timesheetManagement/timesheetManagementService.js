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
                        },
                        {
                            'date': '01/08/2015',
                            'dateId': 1,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/09/2015',
                            'dateId': 2,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/10/2015',
                            'dateId': 3,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/11/2015',
                            'dateId': 4,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/12/2015',
                            'dateId': 5,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/13/2015',
                            'dateId': 6,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/14/2015',
                            'dateId': 7,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/15/2015',
                            'dateId': 1,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/016/2015',
                            'dateId': 2,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/017/2015',
                            'dateId': 3,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/018/2015',
                            'dateId': 4,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/19/2015',
                            'dateId': 5,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/20/2015',
                            'dateId': 6,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/21/2015',
                            'dateId': 7,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/22/2015',
                            'dateId': 1,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/23/2015',
                            'dateId': 2,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/24/2015',
                            'dateId': 3,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/25/2015',
                            'dateId': 4,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/26/2015',
                            'dateId': 5,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/27/2015',
                            'dateId': 6,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/28/2015',
                            'dateId': 7,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/29/2015',
                            'dateId': 7,
                            'time': 8,
                            'assignmentId': 0,
                            'comment': ''
                        },
                        {
                            'date': '01/30/2015',
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
