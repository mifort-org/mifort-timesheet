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

    .controller('employeesController', ['$scope', 'employeesService', 'preferences',
        function($scope, employeesService, preferences) {
            var companyId = preferences.get('user').companyId;

            employeesService.getCompanyEmployers(companyId).success(function(employees) {
                employees.forEach(function(employee) {
                    if(employee.external && employee.external.photos.length){
                        employee.photo = employee.external.photos[0].value.split("?")[0] + '?sz=132';
                    }
                });

                $scope.employees = employees;
            });

            $scope.getInitials = function(name) {
                var initials = name.match(/\b\w/g);
                initials = (initials.shift() + initials.pop()).toUpperCase();
                 return initials;
            };
        }]);