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

angular.module('mifortTimesheet.employeesReport', ['ngRoute', 'constants'])

    .config(['$routeProvider', 'appVersion' , function($routeProvider, appVersion) {
        $routeProvider.when('/employees-report', {
            templateUrl: 'employeesReport/employeesReport.html?rel=' + appVersion,
            controller: 'employeesReportController'
        });
    }])

    .controller('employeesReportController', ['$scope', 'employeesReportService','preferences', 'uiGridConstants', 'topPanelService', '$timeout', '$location',
        function($scope,employeesReportService, preferences, uiGridConstants, topPanelService, $timeout, $location) {
            var companyId = preferences.get('user').companyId,
                userRole = preferences.get('user').role.toLowerCase(),
                headerHeight = 38+12,
                maxVisiblePages = 5,
                columns = employeesReportService.columns;

            $scope.introSteps = employeesReportService.introSteps;

            if(userRole == 'owner' || userRole == 'manager'){
                $scope.userIsManager = true;
            }
            else{
                $scope.userIsManager = false;
            }

            $scope.getAggregatedComments = function(comments) {
                if(comments && comments.length){
                    //remove empty comments
                    var cleanComments = comments.filter(function(e) {
                        return e ? e.replace(/(\r\n|\n|\r)/gm, "") : ""
                    });

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
                filters: [],
                pageSize: 10,
                page: 1,
                groupBy: ['userName'],
                isCommentNeeded: true,
                isreadyForApproveNeeded: true

            };
            $scope.pageRange = $scope.reportSettings.pageSize * ($scope.reportSettings.page - 1) + 1 +"-" +$scope.reportSettings.pageSize * $scope.reportSettings.page;
            if(!$scope.userIsManager){
                $scope.reportSettings.filters.push({
                    field: "userName",
                    value: [preferences.get('user').displayName]
                });
            }

            $scope.reports = [
                {
                    title: 'Employee',
                    active: true,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = ['userName'];
                        $scope.reportSettings.isCommentNeeded = true;
                    },
                    columnsOrder: ['userName', 'time', 'comments', 'userName']
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
                reportFilters: [],

                onRegisterApi: function(gridApi) {
                    $scope.gridApi = gridApi;
                    $scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
                    $scope.getReport();
                }
            };
            $scope.sortChanged = function(grid, sortColumns) {
                $scope.reportSettings.page = 1;

                if(sortColumns.length === 0 || (sortColumns[0] && !sortColumns[0].sort)){
                    $scope.reportSettings.sort = {
                        field: 'date',
                        asc: false
                    };

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
                        default:
                            $scope.reportSettings.sort = {};
                    }

                    $scope.getReport();
                }
            };

            employeesReportService.getFilters(companyId).success(function(data) {
                $scope.timesheetGridOptions.reportFilters = $scope.timesheetGridOptions.reportFilters.concat(data);
            });

            $scope.$watch('timesheetGridOptions.reportFilters', function(newValue, oldValue) {
                if(oldValue && newValue && newValue != oldValue){
                    //$scope.reportSettings.filters = [];
                    var dateFilter = _.where(newValue, {field: 'date'})[0],
                        usedFilters = $scope.reportSettings.filters || employeesReportService.getSavedFilters(),
                        dateFilterIndex = _.findIndex(usedFilters, {field: 'date'});
                    if(dateFilter){
                        preferences.set("redirectDate", dateFilter.start);
                    }
                    if(dateFilter && dateFilterIndex != -1){
                        usedFilters[dateFilterIndex] = dateFilter;
                    }
                    else if(dateFilter){
                        usedFilters.push(dateFilter);
                    }

                    if(employeesReportService.getSavedFilters()[1]){
                        var savedFilters = employeesReportService.getSavedFilters();
                        usedFilters = employeesReportService.getSavedFilters();
                    }

                    newValue.forEach(function(filter) {
                        var filterToPush = {
                            field: filter.field
                        };

                        //proper names for backend
                        switch(filterToPush.field){
                            case 'projects':
                                filterToPush.field = 'projectName';
                                break;
                            case 'users':
                                filterToPush.field = 'userId';
                                break;
                        }

                        var checkedFilters = _.where(filter.value, {isChecked: true}),
                            usedFilterIndex = _.findIndex(usedFilters, {field: filterToPush.field});

                        filterToPush.value = checkedFilters.map(function(checkedFilter) {
                            return checkedFilter.name._id || checkedFilter.name;
                        });

                        if(filterToPush.value.length && usedFilterIndex == -1){
                            usedFilters.push(filterToPush);
                        }
                        else if(filterToPush.value.length && usedFilterIndex !== -1){
                            usedFilters[usedFilterIndex] = filterToPush;
                        }
                        // else if(usedFilterIndex !== -1 && filterToPush.field != 'date'){
                        //     usedFilters.splice(usedFilterIndex, 1);
                        // }
                    });

                    $scope.reportSettings.filters = usedFilters;
                    $scope.getReport();
                }
            }, true);
            $scope.getReport = function() {
                var dateFilterIndex = _.findIndex($scope.reportSettings.filters, function(reportFilter) {
                    return reportFilter.field == 'date';
                });

                if(dateFilterIndex >= 0){
                    employeesReportService.saveSavedFilters($scope.reportSettings.filters);
                    employeesReportService.getReport($scope.reportSettings).success(function(data, status, headers) {
                        var columnsOrder = $scope.reports[_.findIndex($scope.reports, {active: true})].columnsOrder;

                        $scope.reportData = data;
                        data.forEach(function (val,i,data) {
                            if(data[i].size === 0){
                                data[i].readyForApprove = "Not Ready";
                            }else{
                                data[i].readyForApprove === true ? data[i].readyForApprove = "Ready" : data[i].readyForApprove = "Not Ready";
                            }
                            val.expectedTime = preferences.get("workHours");
                        });

                        //add columns to grid
                        if(data.length){
                            $scope.timesheetGridOptions.columnDefs = [];
                            $scope.timesheetGridOptions.columnDefs.length = columnsOrder.length;

                            for(var column in data[0]){
                                if(columns[column]){
                                    var indexToPush = _.indexOf(columnsOrder, column);

                                    $scope.timesheetGridOptions.columnDefs[indexToPush] = columns[column];

                                }
                            }
                            $scope.timesheetGridOptions.columnDefs.splice(1, 0, employeesReportService.employeeColuns.expectedTime);
                            $scope.timesheetGridOptions.columnDefs[columnsOrder.length] = employeesReportService.employeeColuns.status;
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
                        }).getSavedFilters();
                    });
                }
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
                $scope.additionalHeight = $('.popover').height() - 75;
                if($scope.additionalHeight < $('.gridStyle').height() - 40){
                    $scope.additionalHeight = 0;
                }
                return new Array(n);
            };

            $scope.downloadCsv = function() {
                if($scope.reportSettings.groupBy && $scope.reportSettings.groupBy.length){
                    employeesReportService.downloadAggregationCsv($scope.reportSettings).success(function(data) {
                        window.location = data.url;
                    });
                }
                else{
                    employeesReportService.downloadCsv($scope.reportSettings).success(function(data) {
                        window.location = data.url;
                    });
                }
            };

            $scope.downloadPdf = function(id) {
                $scope.reportSettings.projectId = id;
                employeesReportService.downloadPdf($scope.reportSettings).success(function(data) {
                    window.location = data.url;
                });
            };

            $scope.perPageChanged = function(perPage) {
                $scope.reportSettings.pageSize = perPage;
                $scope.reportSettings.page = 1;
                $scope.pageRange = $scope.reportSettings.pageSize * ($scope.reportSettings.page - 1) + 1 +"-" +$scope.reportSettings.pageSize * $scope.reportSettings.page;
                $scope.getReport();
            };

            $scope.$on('handleBroadcast', function() {
                if(topPanelService.linkName == 'csv'){
                    $scope.downloadCsv();
                } else if (topPanelService.linkName == 'pdf') {
                    $scope.downloadPdf(topPanelService.projectId);
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

            $scope.editEmployeeTimesheet = function(userName) {
                var usersFilter = _.findWhere($scope.timesheetGridOptions.reportFilters, {field: 'users'}),
                    user = _.find(usersFilter.value, function(filterValue) {
                        return filterValue.name.displayName == userName;
                    });

                preferences.set('location','Report');
                $scope.locations = preferences.get('location');
                $location.path('timesheet/' + user.name._id);
                // window.location.reload();

            };
        }]);
