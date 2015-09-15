'use strict';

angular.module('myApp.company').factory('companyService',
    ['$http', function ($http) {
        return {
            createCompany: function (companyData) {
                return $http.post('company/', companyData);
            }
        }
    }
    ]);
