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

    .controller('reportController', ['$scope', 'reportService', 'preferences', 'uiGridConstants', function($scope, reportService, preferences, uiGridConstants) {
        var companyId = preferences.get('user').companyId;
        $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];

        $scope.reportSettings = {
            companyId: companyId,
            sort: {
                field: 'date',
                asc: true
            },
            filters: [],
            pageSize: 3,
            page: 1
        };

        $scope.gridOptions = {
            paginationPageSizes: [25, 50, 75],
            paginationPageSize: 25,
            enableFiltering: true,
            enableHorizontalScrollbar: 0,
            columnDefs: [
                {
                    field: 'date',
                    enableColumnResizing: true
                },
                {
                    field: 'userName',
                    enableColumnResizing: true
                },
                {
                    field: 'projectName',
                    enableColumnResizing: true
                },
                {
                    field: 'role',
                    enableColumnResizing: true,
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.role.role}}</div>'
                },
                {
                    field: 'time',
                    enableColumnResizing: true
                }
            ],
            data: 'reportData',

            onRegisterApi: function(gridApi) {
                $scope.gridApi = gridApi;
                $scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
                $scope.sortChanged($scope.gridApi.grid, [$scope.gridOptions.columnDefs[1]]);
            }
        };

        $scope.sortChanged = function(grid, sortColumns) {
            if(sortColumns.length === 0 || !sortColumns[0].sort){
                $scope.getReport($scope.reportSettings);
            }else{
                switch(sortColumns[0].sort.direction){
                    case uiGridConstants.ASC:
                        $scope.reportSettings.sort = {
                            field: sortColumns[0].field,
                            asc: true
                        };
                        break;

                    case uiGridConstants.DESC:
                        $scope.reportSettings.sort = {
                            field: sortColumns[0].field,
                            asc: false
                        };
                        break;
                }

                $scope.getReport($scope.reportSettings);
            }
        };

        reportService.getFilters(companyId).success(function(data) {
            $scope.filtersSettings = data;
        });

        $scope.getReport = function(reportSettings) {
            reportService.getReport(companyId, reportSettings).success(function(data) {
                $scope.reportData = data;
            });
        }
    }]);