'use strict';

angular.module('myApp.timesheetManagement').factory('timesheetManagementService',
    ['$http', function ($http) {
        return {
            getProject: function (projectId, periodId) {
                return {
                    'id': '13',
                    'name': 'Super Project',
                    'description': 'Bla bla bla',
                    'createdOn': '01/01/2015',
                    'updatedOn': '01/02/2015',
                    'template': {
                        'date': '',
                        'role': '',
                        'time': '8',
                        'comment': ''
                    },
                    'defaultValues': [
                        {
                            'date': '01/04/2015',
                            'role': '',
                            'time': 4,
                            'comment': 'AAAAA'
                        }
                    ],
                    'periods': [
                        {
                            "start": "01/04/2015",
                            "end": "01/10/2015"
                        },
                        {
                            "start": "01/11/2015",
                            "end": "01/17/2015"
                        },
                        {
                            "start": "01/18/2015",
                            "end": "01/24/2015"
                        },
                        {
                            "start": "01/25/2015",
                            "end": "01/31/2015"
                        },
                        {
                            "start": "02/01/2015",
                            "end": "02/07/2015"
                        },
                        {
                            "start": "02/08/2015",
                            "end": "02/14/2015"
                        },
                        {
                            "start": "02/15/2015",
                            "end": "02/19/2015"
                        }]
                };
            }
        };
    }
    ]);
