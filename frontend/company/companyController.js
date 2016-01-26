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

angular.module('mifortTimelog.company', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/company-create', {
            templateUrl: 'company/companyView.html',
            controller: 'companyController'
        });

        $routeProvider.when('/company', {
            templateUrl: 'company/companyEditView.html',
            controller: 'companyController'
        });
    }])

    .controller('companyController', ['$scope', '$location', 'companyService', 'preferences', '$rootScope', 'notifyingService', '$timeout',
        function ($scope, $location, companyService, preferences, $rootScope, notifyingService, $timeout) {
        $scope.user = preferences.get('user');

        $scope.company = {
            name: null,
            emails: []
        };

        $scope.possibleRoles = [
            'Owner',
            'Manager',
            'Employee'
        ];

        $timeout(function() {
            initIntro();
            notifyingService.subscribe('startIntro', $scope.startIntro, $scope);
        });

        if($location.path() == '/company'){
            companyService.getCompany($scope.user.companyId).success(function(company) {
                $scope.company = company;
                $scope.company.emails = [];
                $scope.IntroOptions.steps.push({
                    element: '#step4',
                    intro: "<p>Also user will see a two-column table (pic #) with all invited employees and their roles (Owner, Manager, Employee, HRM).</p>" +
                    "<p>Name column will show employee\'s Name if he already logged in and shared google account data, otherwise his email will be shown instead of name.</p>" +
                    "<p>Role column will show the assigned role of employee. Here company owner can change employee's roles and remove an employee from their company.</p>" +
                    "<p>After pressing the Continue button user will be redirected to Projects page.</p>",
                    position: 'top'
                })
            });

            getEmployees();
        }

        function getEmployees(){
            companyService.getCompanyEmployees($scope.user.companyId).success(function(companyEmployees) {
                $scope.companyEmployees = companyEmployees;
            });
        }

        function initIntro() {
            $scope.IntroOptions = {
                steps: [
                    {
                        element: '#step1',
                        intro: "<p>Where he can change company name.</p>",
                        position: 'bottom'
                    },
                    {
                        element: '#step2',
                        intro: "<p>invite more employees by adding their emails to the \"Invite Employees\" field splitted by comma.</p>",
                        position: 'left'
                    },
                    {
                        element: '#step3',
                        intro: "<p>Pressing the Invite button will sent the emails to invited employees and add them to \"Invited Employees\" table to change company roles.</p>",
                        position: 'top'
                    }
                ],
                showStepNumbers: false,
                showBullets: true,
                exitOnOverlayClick: true,
                exitOnEsc: true,
                nextLabel: '<strong>next</strong>',
                prevLabel: '<strong>previos</strong>',
                skipLabel: 'Exit',
                doneLabel: 'Done'
            };
        }

        $scope.createCompany = function () {
            companyService.createCompany($scope.company).success(function (data) {
                $scope.user.companyId = data._id;
                preferences.set('user', $scope.user);
                $rootScope.companyId = data._id;
                $location.path('/timesheet');
            });
        };

        $scope.saveCompany = function () {
            companyService.saveCompany($scope.company).success(function (data) {
                $rootScope.$broadcast('companyNameChanged', data.name);
                $location.path('/timesheet');
            });
        };

        $scope.inviteEmployees = function() {
            companyService.saveCompany($scope.company).success(function () {
                getEmployees();
                $scope.company.emails = [];
            });
        };

        $scope.changeRole = function(employee, role) {
            employee. role = role;
            companyService.changeRole(employee);
        };

        $scope.removeEmployee = function(employee) {
            $scope.companyEmployees = _.filter($scope.companyEmployees, function(companyEmployee){
                return companyEmployee._id != employee._id;
            });
            companyService.removeEmployee(employee._id);
        };

        $scope.$watch('company.emails', function (newValue) {
            if (newValue && typeof newValue == 'string') {
                $scope.company.emails = newValue.split(/[\s,]+/);
            }
        }, true);
    }]);