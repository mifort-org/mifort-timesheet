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
        $routeProvider.when('/report', {
            templateUrl: 'report/reportView.html',
            controller: 'reportController'
        });
    }])

    .controller('reportController', ['$scope', 'reportService', 'preferences', 'uiGridConstants', 'topPanelService', function($scope, reportService, preferences, uiGridConstants, topPanelService) {
        var companyId = preferences.get('user').companyId,
            headerHeight = 38;

        $scope.ranges = {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
            'Last 7 days': [moment().subtract('days', 7), moment()],
            'Last 30 days': [moment().subtract('days', 30), moment()],
            'This month': [moment().startOf('month'), moment().endOf('month')]
        };

        $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];
        $scope.perPage = [5, 10, 20, 50, 100];
        $scope.totalCount = 0;
        $scope.projects = [];

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
            ranges: $scope.ranges,
            paginationPageSizes: [25, 50, 75],
            paginationPageSize: 25,
            enableFiltering: true,
            enableHorizontalScrollbar: 0,
            enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
            rowHeight: 30,
            columnDefs: [
                {
                    field: 'date',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span report-date-picker class="report-filter"></span></div>'
                },
                {
                    field: 'userName',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="userName" col-title="UserName"></span></div>'
                },
                {
                    field: 'projectName',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="projectName" col-title="ProjectName"></span></div>'
                },
                {
                    field: 'role',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.role.role}}</div>',
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="role" col-title="Role"></span></div>'
                },
                {
                    field: 'time',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="time"></span></div>'
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
                $scope.getReport();
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

                $scope.getReport();
            }
        };

        reportService.getFilters(companyId).success(function(data) {
            $scope.filtersSettings = data;

            $scope.gridOptions.projectFilters = data;
        });

        $scope.$watch('gridOptions.projectFilters', function(newValue, oldValue) {
            if(newValue && newValue != oldValue){
                $scope.reportSettings.filters = [];

                newValue.forEach(function(filter) {
                    var filterToPush = {
                            field: filter.field
                        },
                        checkedFilters = _.where(filter.value, {isChecked: true});

                    filterToPush.value = checkedFilters.map(function(checkedFilter) {
                        return checkedFilter.name
                    });

                    if(filterToPush.value.length){
                        $scope.reportSettings.filters.push(filterToPush);
                    }
                });

                $scope.getReport();
            }
        }, true);

        $scope.getReport = function() {
            reportService.getReport($scope.reportSettings).success(function(data, status, headers) {
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
            $scope.getReport();
        };

        $scope.nextPage = function() {
            if($scope.reportSettings.page < $scope.totalPages){
                $scope.reportSettings.page++;
                $scope.getReport();
            }
        };

        $scope.prevPage = function() {
            if($scope.reportSettings.page > 1){
                $scope.reportSettings.page--;
                $scope.getReport();
            }
        };

        $scope.range = function(n) {
            return new Array(n);
        };

        $scope.downloadCsv = function() {
            reportService.downloadCsv($scope.reportSettings).success(function(data) {
                window.location = data.url;
            });
        };

        $scope.perPageChanged = function() {
            $scope.reportSettings.page = 1;
            $scope.getReport();
        };

        $scope.$on('handleBroadcast', function() {
            if(topPanelService.linkName = 'report'){
                $scope.downloadCsv();
            }
        });
    }]);