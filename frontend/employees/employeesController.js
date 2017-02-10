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

angular.module('mifortTimesheet.employees', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/employees', {
            templateUrl: 'employees/employeesView.html',
            controller: 'employeesController'
        });
    }])

    .controller('employeesController', ['$scope', 'employeesService', 'preferences', '$location', 'Notification',
        function($scope, employeesService, preferences, $location, Notification) {
            var companyId = preferences.get('user').companyId;

            $scope.path = $location.path();

            employeesService.getCompanyEmployers(companyId).success(function(employees) {
                employees.forEach(function(employee) {
                    if(employee.external && employee.external.photos.length){
                        employee.photo = employee.external.photos[0].value.split("?")[0] + '?sz=132';
                    }

                    employee.isCollapsed = true;
                });

                $scope.employees = employees;
            });

            $scope.getInitials = function(name) {
                var initials = name.match(/\b\w/g);
                initials = (initials.shift() + initials.pop()).toUpperCase();
                 return initials;
            };

            $scope.calculateWorkload = function(employee) {
                var totalWorkload = 0;

                if(employee.assignments){
                    employee.assignments.forEach(function(assignment) {
                        totalWorkload += +assignment.workload;
                    });
                }

                return totalWorkload;
            };

            $scope.searchEmployees = function(employeeSearch) {
                //delete fields from filter so angular will use it's native search correctly(so it won't leave the empty search properties)
                for(var field in employeeSearch){
                    if(!employeeSearch[field].length
                        && (!angular.isObject(employeeSearch[field]) || employeeSearch[field].projectName === '' || employeeSearch[field].role === '')){
                        delete employeeSearch[field];
                    }
                }

                $scope.activeSearch = angular.copy(employeeSearch);
            };

            $scope.clearSearch = function() {
                $scope.employeeSearch = {};
                $scope.activeSearch = {};
            };

            $scope.hasArchivedProjects = function(assignments) {
                return _.findWhere(assignments, {archived: true});
            };

            $scope.editEmployeeTimesheet = function(userId) {

                $location.path('timesheet/' + userId);
                window.location.reload();
            };

            $scope.removeEmployee = function(employee) {
                $scope.companyEmployees = _.filter($scope.companyEmployees, function(companyEmployee){
                    return companyEmployee._id != employee._id;
                });
                employeesService.removeEmployee(employee._id).success(function() {
                    Notification.success('Changes saved');
                });
            };

        }]);