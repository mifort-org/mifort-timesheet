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

    .controller('reportController', ['$scope', 'reportService', 'preferences', 'uiGridConstants', 'topPanelService', '$timeout',
        function($scope, reportService, preferences, uiGridConstants, topPanelService, $timeout) {
            var companyId = preferences.get('user').companyId,
                userRole = preferences.get('user').role.toLowerCase(),
                headerHeight = 38,
                maxVisiblePages = 5,
                columns = {
                    date: {
                        field: 'Date',
                        width: 100,
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        enableFiltering: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span report-date-picker id="step2" class="report-filter"></span></div>'
                    },
                    userName: {
                        field: 'Employee Name',
                        width: 150,
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        filterHeaderTemplate: '<div ng-if="$parent.grid.appScope.userIsManager" class="ui-grid-filter-container">{{userIsManager}}<span dropdown-filter class="dropdown-filter" col-name="employeeName" col-title="Employee Name"></span></div>'
                    },
                    projectName: {
                        field: 'Project Name',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="projectName" col-title="Project Name"></span></div>'
                    },
                    role: {
                        field: 'Role',
                        width: 140,
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.role}}</div>',
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="role" col-title="Role"></span></div>'
                    },
                    time: {
                        field: 'Time',
                        width: 81,
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        enableFiltering: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Time"></span></div>'
                    },
                    comment: {
                        field: 'Comment',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        enableSorting: false,
                        enableFiltering: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Comment"></span></div>',
                        cellTemplate: '<span cutted-comment></span>'
                    },
                    comments: {
                        field: 'Comments',
                        enableColumnResizing: true,
                        enableColumnMenu: false,
                        enableSorting: false,
                        enableFiltering: false,
                        filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Comments"></span></div>',
                        cellTemplate: '<span cutted-comment></span>'
                    }
                };

            if(userRole == 'owner' || userRole == 'manager'){
                $scope.userIsManager = true;
            }
            else{
                $scope.userIsManager = false;
            }

            $scope.getAggregatedComments = function(comments) {
                if(comments && comments.length){
                    //remove empty comments
                    var cleanComments = comments.filter(function(e){ return e.replace(/(\r\n|\n|\r)/gm,"")});

                    return cleanComments.join(", ")
                }
            };

            $scope.ranges = {
                'Today': [moment(), moment()],
                //'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 days': [moment().subtract(7, 'days'), moment()],
                'Last 30 days': [moment().subtract(30, 'days'), moment()],
                'This month': [moment().startOf('month'), moment().endOf('month')]
            };

            //default settings, field: "date" value must match the dateRangePicker default value
            $scope.reportSettings = {
                companyId: companyId,
                sort: {
                    field: 'date',
                    asc: false
                },
                filters: [{
                    field: "date",
                    start:  moment(new Date($scope.ranges['This month'][0])).format('MM/DD/YYYY'),
                    end: moment(new Date($scope.ranges['This month'][1])).format('MM/DD/YYYY')
                }],
                pageSize: 10,
                page: 1
            };

            if(!$scope.userIsManager){
                $scope.reportSettings.filters.push({
                    field: "userName",
                    value: [preferences.get('user').displayName]
                });
            }

            $scope.reports = [
                {
                    title: 'Log',
                    active: true,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = [];
                        $scope.reportSettings.isCommentNeeded = false;
                    }
                },
                {
                    title: 'Project total',
                    active: false,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = ['projectName'];
                        $scope.reportSettings.isCommentNeeded = false;
                    }
                },
                {
                    title: 'Employee',
                    active: false,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = ['userName'];
                        $scope.reportSettings.isCommentNeeded = true;
                    }
                },
                {
                    title: 'Project + Employee total',
                    active: false,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = ['userName', 'projectName'];
                        $scope.reportSettings.isCommentNeeded = true;
                    }
                }
            ];

            $scope.changeActiveReport = function(activeIndex) {
                $scope.reportSettings.page = 1;

                $scope.reports.map(function(report) {
                    report.active = false;

                    return report;
                });

                $scope.reports[activeIndex].active = true;
                $scope.reports[activeIndex].setSettings();
                $scope.getReport();
            };

            $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];
            $scope.perPage = [10, 20, 50, 100];
            $scope.totalCount = 0;
            $scope.projects = [];

            $scope.timesheetGridOptions = {
                ranges: $scope.ranges,
                paginationPageSizes: [25, 50, 75],
                paginationPageSize: 25,
                enableFiltering: true,
                enableHorizontalScrollbar: 0,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                rowHeight: 30,
                columnDefs: [],
                data: 'reportData',

                onRegisterApi: function(gridApi) {
                    $scope.gridApi = gridApi;
                    $scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
                    $scope.getReport();
                }
            };

            $scope.sortChanged = function(grid, sortColumns) {
                $scope.reportSettings.page = 1;

                if(sortColumns.length === 0 || (sortColumns[0] && !sortColumns[0].sort)){
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
                $scope.timesheetGridOptions.reportFilters = data;
            });

            $scope.$watch('timesheetGridOptions.reportFilters', function(newValue, oldValue) {
                if(oldValue && newValue && newValue != oldValue){
                    //$scope.reportSettings.filters = [];

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

                    //add columns to grid
                    if(data.length){
                        $scope.timesheetGridOptions.columnDefs = [];

                        for(var column in data[0]){
                            if(columns[column]){
                                $scope.timesheetGridOptions.columnDefs.push(columns[column]);
                            }
                        }
                    }

                    $scope.gridHeight = {
                        height: ((data.length) * ($scope.timesheetGridOptions.rowHeight + 1)) + headerHeight + "px"
                    };

                    if(headers()['x-total-count']){
                        $scope.totalCount = headers()['x-total-count'];
                        $scope.totalPages = Math.ceil($scope.totalCount / $scope.reportSettings.pageSize);
                    }
                }).finally(function() {
                    //call the directive 'cuttedComment' to reRender comments
                    $timeout(function() {
                        $scope.$broadcast('activeReportChanged');
                    });
                });
            };

            $scope.introSteps = [
                {
                    element: '#step1',
                    intro: "<p>This is a table of all logs among the application. Each column could be sorted by clicking on column name " +
                    "and each of them has filter that could be opened on the filter button next to column name.</p>" +
                    "<p>User, Project and Assignment columns has dropdown filter with the quick search field and checkboxes to choose the filtered options.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Switch tabs to change the column to be aggregated.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step3',
                    intro: "<p>Use aggregation field to set the period of time to show.</p>",
                    position: 'bottom'
                },
                {
                    element: '#print',
                    intro: "<p>You could print or export the report by pressing the top panel buttons Print/CSV.</p>",
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
                if($scope.reportSettings.groupBy && $scope.reportSettings.groupBy.length){
                    reportService.downloadAggregationCsv($scope.reportSettings).success(function(data) {
                        window.location = data.url;
                    });
                }
                else{
                    reportService.downloadCsv($scope.reportSettings).success(function(data) {
                        window.location = data.url;
                    });
                }
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