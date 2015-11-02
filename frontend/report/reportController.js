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

    .controller('reportController', ['$scope', 'reportService', 'preferences', function($scope, reportService, preferences) {
        var companyId = preferences.get('user').companyId;
        $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];

        $scope.reportSettings = {
            companyId: companyId,
            sort: {
                'field': 'time',
                'asc': true
            },
            pageSize: 10,
            page: 1
        };
        $scope.gridOptions = {
            enableFiltering: true,
            enableHorizontalScrollbar: 0,
            columnDefs: [
                {
                    field: 'date',
                    enableColumnResizing: true,
                    filters: [
                        {
                            placeholder: 'greater than'
                        },
                        {
                            placeholder: 'less than'
                        }
                    ]
                },
                {
                    field: 'userName',
                    enableColumnResizing: true,
                    menuItems: [
                        {
                            title: 'Grid ID',
                            action: function() {
                                alert('Grid ID: ' + this.grid.id);
                            }
                        }
                    ]
                },
                {
                    field: 'projectName',
                    enableColumnResizing: true
                },
                {
                    field: 'role',
                    enableColumnResizing: true
                },
                {
                    field: 'time',
                    enableColumnResizing: true
                }
            ],
            data: 'reportData'
        };

        reportService.getFilters(companyId).success(function(data) {
            $scope.filters = data;
            $scope.filters.push({
                    "field": "date",
                    "start": "01/01/2011",
                    "end": "02/02/2114"
                }
            );
            $scope.reportSettings.filters = [];


            reportService.getReport(companyId, $scope.reportSettings).success(function(data) {
                $scope.reportData = data;
            });
        });
    }]);