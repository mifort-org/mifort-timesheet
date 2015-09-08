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
                            'role': '',
                            'time': 4,
                            'comment': 'AAAAA'
                        }
                    ],
                    'periods': []
                };
            }
        };
    }
    ]);
