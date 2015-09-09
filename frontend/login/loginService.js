'use strict';

angular.module('myApp.login').factory('loginService',
    ['$http', function ($http) {
        return {
            getUser: function () {
                return $http.get('user/');
            }
        };
    }
    ]);
