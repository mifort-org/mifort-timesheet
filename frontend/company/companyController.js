'use strict';

angular.module('myApp.company', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/companyCreate', {
            templateUrl: 'company/companyView.html',
            controller: 'companyController'
        });

        $routeProvider.when('/companyEdit', {
            templateUrl: 'company/companyEditView.html',
            controller: 'companyController'
        });
    }])

    .controller('companyController', ['$scope', '$location', 'companyService', 'preferences', function ($scope, $location, companyService, preferences) {
        $scope.company = {
            name: null,
            position: null,
            emails: []
        };

        if($location.path() == '/companyEdit'){
            companyService.getCompany(preferences.get('user').companyId).success(function(company) {
                $scope.company = company;
            });
        }

        $scope.createCompany = function () {
            companyService.createCompany($scope.company).success(function () {
                $location.path('/timesheetManagement');
            });
        };

        $scope.saveCompany = function () {
            companyService.saveCompany($scope.company).success(function () {
                $location.path('/timesheetManagement');
            });
        };

        $scope.$watch('company.emails', function (newValue) {
            if (newValue && typeof newValue == 'string') {
                $scope.company.emails = newValue.split(/[\s,]+/);
            }
        }, true);
    }]);