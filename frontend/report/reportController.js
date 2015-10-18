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

angular.module('myApp.report', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/Report', {
            templateUrl: 'report/reportView.html',
            controller: 'reportController'
        });
    }])

    .controller('reportController', ['$scope', function($scope) {
        $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];

        $scope.gridOptions = {
            enableFiltering: true,
            columnDefs: [
                {field: 'Data'},
                {field: 'User'},
                {field: 'Project'},
                {field: 'Assignment'},
                {field: 'Time'},
                {field: 'Action'}
            ],
            data: 'reportColumns'
        };
    }]);