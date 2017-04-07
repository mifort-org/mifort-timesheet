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

angular.module('mifortTimesheet.company', ['ngRoute'])

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

    .controller('companyController', ['$scope', '$location', '$window', 'companyService', 'preferences', '$rootScope', 'Notification',
        function ($scope, $location, $window, companyService, preferences, $rootScope, Notification) {
        $scope.user = preferences.get('user');

        $scope.s3Regions = [
            { name: 'US East (N. Virginia)', endpoint: 'us-east-1' },
            { name: 'US East (Ohio)', endpoint: 'us-east-2' },
            { name: 'US West (N. California)', endpoint: 'us-west-1' },
            { name: 'US West (Oregon)', endpoint: 'us-west-2' },
            { name: 'Asia Pacific (Mumbai)', endpoint: 'ap-south-1' },
            { name: 'Asia Pacific (Seoul)', endpoint: 'ap-northeast-2' },
            { name: 'Asia Pacific (Singapore)', endpoint: 'ap-southeast-1' },
            { name: 'Asia Pacific (Sydney)', endpoint: 'ap-southeast-2' },
            { name: 'Asia Pacific (Tokyo)', endpoint: 'ap-northeast-1' },
            { name: 'EU (Frankfurt)', endpoint: 'eu-central-1' },
            { name: 'EU (Ireland)', endpoint: 'eu-west-1' },
            { name: 'EU (London)', endpoint: 'eu-west-2' },
        ];

        $scope.company = {
            name: null,
            emails: [],
            backup: 'none',
            lastBackupDate: undefined,
            backupServer: {
                type: undefined
            }
        };

        $scope.possibleRoles = [
            'Owner',
            'Manager',
            'Employee'
        ];

        if($location.path() == '/company'){
            companyService.getCompany($scope.user.companyId).success(function(company) {
                $scope.company = company;
                $scope.company.emails = [];
                $scope.company.backup = $scope.company.backup || 'none';
                $scope.company.lastBackupDate = $scope.company.lastBackupDate;
                $scope.company.backupServer = $scope.company.backupServer || {type: undefined};
                $scope.introSteps.push({
                    element: '#step4',
                    intro: "<p>Table with all invited employees and roles.</p>" +
                    "<p><strong>Name</strong> column shows employee\'s Name if he already logged in and shared google account data, otherwise his email will be shown instead of name.</p>" +
                    "<p><strong>Role</strong> column shows the assigned role of employee. Company owner can change employee's roles and remove an employee from company.</p>" +
                    "<p>Pressing the Continue button saves all data and redirect to Projects page.</p>",
                    position: 'top'
                });
                $scope.introSteps.push(
                    {
                        element: '#step5',
                        intro: "<p>Chose where you want want to store backups</p>",
                        position: 'top'
                    });
                $scope.introSteps.push(
                    {
                        element: '#step6',
                        intro: "<p>Chose the frequency of backups or just do it right now</p>",
                        position: 'top'
                    });
            });

            getEmployees();
        }

        function getEmployees(){
            companyService.getCompanyEmployees($scope.user.companyId).success(function(companyEmployees) {
                $scope.companyEmployees = companyEmployees;
            });
        }

        $scope.introSteps = [
            {
                element: '#step1',
                intro: "<p>Use this field to change the company name.</p>",
                position: 'bottom'
            },
            {
                element: '#step2',
                intro: "<p>Invite more employees by adding their emails to the \"Invite Employees\" field splitted by comma.</p>",
                position: 'left'
            },
            {
                element: '#step3',
                intro: "<p>Pressing the Invite button will send the emails to invited employees and add them to \"Invited Employees\" table to change company roles.</p>",
                position: 'top'
            }
        ];

        $scope.createCompany = function () {
            companyService.createCompany($scope.company).success(function (data) {
                $scope.user.companyId = data._id;
                preferences.set('user', $scope.user);
                $rootScope.companyId = data._id;
                $location.path('/calendar');
            });
        };

        $scope.saveCompany = function () {
            console.log($scope.company);
            companyService.saveCompany($scope.company).success(function (data) {
                Notification.success('Changes saved');
                $rootScope.$broadcast('companyNameChanged', data.name);
            });
        };

        $scope.inviteEmployees = function() {
            companyService.saveCompany($scope.company).success(function () {
                getEmployees();
                $scope.company.emails = [];
                Notification.success('Changes saved');
            });
        };
        $scope.companyBackupNow = function(e) {
            var body = {
                _id: $scope.user.companyId,
                serverType: $scope.company.backupServer.type,
                login: $scope.company.backupServer.login,
                pass: $scope.company.backupServer.pass,
                path: $scope.company.backupServer.path,
            };
            companyService.companyBackup($scope.user.companyId, body).success(function () {
                Notification.success('Successful backup');
            });
        };

        $scope.companyExport = function(e) {
            companyService.companyExport($scope.user.companyId).then(function () {
                Notification.success('Successful export');
            });
        };

        $scope.changeRole = function(employee, role) {
            employee. role = role;
            companyService.changeRole(employee).success(function() {
                Notification.success('Changes saved');
            });
        };

        $scope.removeEmployee = function(employee) {
            $scope.companyEmployees = _.filter($scope.companyEmployees, function(companyEmployee){
                return companyEmployee._id != employee._id;
            });
            companyService.removeEmployee(employee._id).success(function() {
                Notification.success('Changes saved');
            });
        };

        $scope.setS3Region = function(region) {
            $scope.company.backupServer.region = region;
            $scope.saveCompany();
        };

        $scope.$watch('company.emails', function (newValue) {
            if (newValue && typeof newValue == 'string') {
                $scope.company.emails = newValue.split(/[\s,]+/);
            }
        }, true);
    }]);