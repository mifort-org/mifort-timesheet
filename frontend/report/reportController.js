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
        var headerHeight = 38;

        $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];
        $scope.perPage = [5, 10, 20, 50, 100];
        $scope.totalCount = 0;

        $scope.reportSettings = {
            companyId: companyId,
            sort: {
                field: 'date',
                asc: true
            },
            filters: [],
            pageSize: 5,
            page: 1
        };

        $scope.gridOptions = {
            paginationPageSizes: [25, 50, 75],
            paginationPageSize: 25,
            enableFiltering: true,
            enableHorizontalScrollbar: 0,
            rowHeight: 30,
            columnDefs: [
                {
                    field: 'date',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" row-title="Date"></span></div>'
                },
                {
                    field: 'userName',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" row-title="UserName"></span></div>'
                },
                {
                    field: 'projectName',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" row-title="ProjectName"></span></div>'
                },
                {
                    field: 'role',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.role.role}}</div>',
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" row-title="Role"></span></div>'
                },
                {
                    field: 'time',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" row-title="time"></span></div>'
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
            $scope.reportSettings.page = 1;

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
            reportService.getReport(reportSettings).success(function(data, status, headers) {
                $scope.reportData = data;

                $scope.gridHeight = {
                    height: ((data.length) * ($scope.gridOptions.rowHeight + 1)) + headerHeight + "px"
                };

                if(headers()['x-total-count']){
                    $scope.totalCount = headers()['x-total-count'];
                    $scope.totalPages = Math.ceil($scope.totalCount / $scope.reportSettings.pageSize);
                }
            });
        };

        $scope.openPage = function(pageIndex) {
            $scope.reportSettings.page = pageIndex;
            $scope.getReport($scope.reportSettings);
        };

        $scope.nextPage = function() {
            if($scope.reportSettings.page < $scope.totalPages){
                $scope.reportSettings.page++;
                $scope.getReport($scope.reportSettings);
            }
        };

        $scope.prevPage = function() {
            if($scope.reportSettings.page > 1){
                $scope.reportSettings.page--;
                $scope.getReport($scope.reportSettings);
            }
        };

        $scope.range = function(n) {
            return new Array(n);
        };

        $scope.downloadCsv = function() {
            reportService.downloadCsv($scope.reportSettings).success(function(data) {
                window.location = data.url;
            });
        }
    }]);