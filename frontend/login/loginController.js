'use strict';

angular.module('myApp.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html',
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', function ($scope, $location, loginService) {
        $scope.user = loginService.post();
        $scope.login = function () {
            $location.path('/timelog');
        };
    }]);