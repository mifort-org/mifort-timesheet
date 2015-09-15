'use strict';

angular.module('myApp.company', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/company', {
            templateUrl: 'company/companyView.html',
            controller: 'companyController'
        });
    }])

    .controller('companyController', ['$scope', '$location', 'companyService', function ($scope, $location, companyService) {
        $scope.company = {
            name: null,
            position: null,
            emails: []
        };

        $scope.createCompany = function () {
            companyService.createCompany($scope.company).success(function () {
                $location.path('/timesheetManagement');
            });
        };

        $scope.$watch('emails', function (newValue) {
            if (newValue) {
                $scope.company.emails = newValue.split(/[\s,]+/);
            }
        }, true);
    }]);