'use strict';

angular.module('myApp.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html',
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', 'preferences', function ($scope, $location, loginService, preferences) {
        $scope.$parent.isLoggedIn = false;
        $scope.user = loginService.getUser();
        $scope.login = function () {
            var value = {id: 1001, name: 'John', surname: 'Galt'};
            $scope.$parent.isLoggedIn = true;
            $location.path('/timelog');
            preferences.set('user', typeof value === 'object' ? JSON.stringify(value) : value);
            console.log(localStorage);
        };
    }]);