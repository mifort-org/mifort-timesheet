'use strict';

angular.module('myApp.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html',
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', 'preferences', function ($scope, $location, loginService, preferences) {
        $scope.user = loginService.getUser();
        $scope.login = function () {
            //success
            var key = 'user';
            var value = {id: 123, name: 'John', surname: 'Galt'};
            $scope.$parent.isLoggedIn = true;
            $location.path('/timelog');
            preferences.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
            console.log(localStorage);
        };
    }]);