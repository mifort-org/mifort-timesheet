'use strict';

angular.module('myApp.projectManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/projectManagement', {
            templateUrl: 'frontend/projectManagement/projectManagementView.html',
            controller: 'projectManagementController'
        });
    }])

    .controller('projectManagementController', ['$scope', function ($scope) {
        $scope.page = 'projectManagement';
    }]);