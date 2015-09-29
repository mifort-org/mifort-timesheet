'use strict';

angular.module('myApp.company').factory('companyService',
    ['$http', function ($http) {
        return {
            createCompany: function (company) {
                return $http.put('company', company);
            },
            getCompany: function(companyId) {
                return $http.get('company/' + companyId);
            },
            saveCompany: function(company) {
                return $http.put('company', company);
            }
        }
    }
    ]);
