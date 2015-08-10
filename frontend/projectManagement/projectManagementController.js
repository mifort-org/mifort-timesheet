'use strict';

angular.module('myApp.projectManagement', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/projectManagement', {
            templateUrl: 'projectManagement/projectManagementView.html',
            controller: 'projectManagementController'
        });
    }])

    .controller('projectManagementController', ['$scope', function ($scope) {
        $scope.page = 'projectManagement';
    }]);