'use strict';

angular.module('myApp.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html',
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', 'preferences', '$cookies', function ($scope, $location, loginService, preferences, $cookies) {
        $scope.$parent.isLoggedIn = false;
        //$scope.user = loginService.getUser();

        if($cookies.get('user')){

        };
        $scope.login = function () {
            $scope.$parent.isLoggedIn = true;
            $location.path('/timelog');
            preferences.set('user', typeof $scope.user === 'object' ? JSON.stringify($scope.user) : $scope.user);
            console.log(localStorage);
        };
    }]);