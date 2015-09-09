'use strict';

angular.module('myApp.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html',
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', '$cookies', function ($scope, $location, loginService, $cookies) {
        $scope.$parent.isLoggedIn = false;
        $scope.user = loginService.getUser().success(function (data) {
            if(data){
                $cookies.put('user', data)
                $scope.$parent.isLoggedIn = true;
                $location.path('/timelog');
            }
        });

        $scope.login = function () {
            $scope.$parent.isLoggedIn = true;
            $location.path('/timelog');
            console.log(localStorage);
            console.log($cookies.getAll());
        };
    }]);