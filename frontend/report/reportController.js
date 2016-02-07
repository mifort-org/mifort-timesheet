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

angular.module('mifortTimesheet.report', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/report', {
            templateUrl: 'report/reportView.html',
            controller: 'reportController'
        });
    }])

    .controller('reportController', ['$scope', 'reportService', 'preferences', 'uiGridConstants', 'topPanelService', 'notifyingService',
        function($scope, reportService, preferences, uiGridConstants, topPanelService, notifyingService) {
            var companyId = preferences.get('user').companyId,
                headerHeight = 38,
                maxVisiblePages = 5;

            $scope.ranges = {
                'Today': [moment(), moment()],
                //'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 days': [moment().subtract(7, 'days'), moment()],
                'Last 30 days': [moment().subtract(30, 'days'), moment()],
                'This month': [moment().startOf('month'), moment().endOf('month')]
            };

            $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];
            $scope.perPage = [10, 20, 50, 100];
            $scope.totalCount = 0;
            $scope.projects = [];

            $scope.reportSettings = {
                companyId: companyId,
                sort: {
                    field: 'date',
                    asc: true
                },
                filters: [],
                pageSize: 10,
                page: 1
            };

            $scope.timesheetGridOptions = {
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
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span report-date-picker id="step2" class="report-filter"></span></div>'
                    },
                    {
                        field: 'userName',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="userName" col-title="User Name"></span></div>'
                    },
                    {
                        field: 'projectName',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="projectName" col-title="Project Name"></span></div>'
                    },
                    {
                        field: 'role',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.role}}</div>',
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="role" col-title="Role"></span></div>'
                    },
                    {
                        field: 'time',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        enableFiltering: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Time"></span></div>'
                    },
                    {
                        field: 'comment',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        enableSorting: false,
                        enableFiltering: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Comment"></span></div>'
                    }
                ],
                data: 'reportData',

                onRegisterApi: function(gridApi) {
                    $scope.gridApi = gridApi;
                    $scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
                    $scope.sortChanged($scope.gridApi.grid, [$scope.timesheetGridOptions.columnDefs[1]]);
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
                $scope.timesheetGridOptions.reportFilters = data;
            });

            $scope.$watch('timesheetGridOptions.reportFilters', function(newValue, oldValue) {
                if(newValue && newValue != oldValue){
                    $scope.reportSettings.filters = [];

                    var dateFilter = _.where(newValue, {field: 'date'})[0];

                    if(dateFilter){
                        $scope.reportSettings.filters.push(dateFilter)
                    }

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
                        height: ((data.length) * ($scope.timesheetGridOptions.rowHeight + 1)) + headerHeight + "px"
                    };

                    if(headers()['x-total-count']){
                        $scope.totalCount = headers()['x-total-count'];
                        $scope.totalPages = Math.ceil($scope.totalCount / $scope.reportSettings.pageSize);
                    }
                });
            };

            $scope.IntroSteps = [
                {
                    element: '#step1',
                    intro: "<p>This is a table of all logs among the application. Each column could be sorted by clicking on column name " +
                    "and each of them has filter that could be opened on the filter button next to column name.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Date column keeps all logs dates and could be filtered by choosing the period from the list or period or by custom period chosen from calendar.</p>" +
                    "<p>User, Project and Assignment columns has dropdown filter with the quick search field and checkboxes to choose the filtered options.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step3',
                    intro: "<p>In Report controls section you could choose for how many records you want to see on page.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step4',
                    intro: "<p>You could also switch pages.</p>",
                    position: 'left'
                },
                {
                    element: '#print',
                    intro: "<p>You could print or export the report by pressing the top panel buttons Print/CSV/PDF.</p>",
                    position: 'left'
                }
            ];

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

            $scope.perPageChanged = function(perPage) {
                $scope.reportSettings.pageSize = perPage;
                $scope.reportSettings.page = 1;
                $scope.getReport();
            };

            $scope.$on('handleBroadcast', function() {
                if(topPanelService.linkName = 'report'){
                    $scope.downloadCsv();
                }
            });

            //$scope.dateFilterChanged = function(dates) {
            //    var dateFilter = {
            //        "field": "date",
            //        "start": moment(new Date(dates.startDate)).format('MM/DD/YYYY'),
            //        "end": moment(new Date(dates.endDate)).format('MM/DD/YYYY')
            //    };
            //
            //    $scope.reportSettings.filters.push(dateFilter);
            //    $scope.getReport();
            //};

            $scope.showOriginalPage = function(pageNumber) {
                if($scope.reportSettings.page + 2 >= pageNumber &&
                    $scope.reportSettings.page - 2 <= pageNumber){
                    return true;
                }
                else if(($scope.reportSettings.page < 3 && pageNumber <= maxVisiblePages) ||
                    ($scope.reportSettings.page + 1 >= $scope.totalPages && pageNumber + 4 >= $scope.totalPages)){
                    return true;
                }
            };

            $scope.showFirstPage = function() {
                if($scope.totalPages > maxVisiblePages &&
                    ($scope.reportSettings.page > 4 || $scope.reportSettings.page - 3 > 0)){
                    return true;
                }
            };

            $scope.showFirstDots = function() {
                if($scope.totalPages > maxVisiblePages &&
                    ($scope.reportSettings.page > 4)){
                    return true;
                }
            };

            $scope.showLastPage = function() {
                if($scope.totalPages > maxVisiblePages && $scope.reportSettings.page + 3 <= $scope.totalPages){
                    return true;
                }
            };

            $scope.showLastDots = function() {
                if($scope.reportSettings.page + 4 <= $scope.totalPages){
                    return true;
                }
            };
        }]);