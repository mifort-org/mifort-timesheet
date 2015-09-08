'use strict';

angular.module('myApp.timesheetManagement').factory('timesheetManagementService',
    ['$http', function ($http) {
        return {
            getProjet: function (projectId, periodId) {
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
                            'date': '01/01/2015',
                            'comment': 'AAAAA'
                        }
                    ],
                    'periods': [
                        {
                            'end': '01/05/2015'
                        },
                        {
                            'start': '01/06/2015',
                            'end': '01/08/2015'
                        },
                        {
                            'start': '01/09/2015',
                            'end': '01/13/2015'
                        },
                        {
                            'start': '01/14/2015',
                            'end': '01/14/2015'
                        },
                        {
                            'start': '01/15/2015'
                        }
                    ]
                };
            }
        };
    }
    ]);
