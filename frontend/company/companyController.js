/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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