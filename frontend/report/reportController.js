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

angular.module('mifortTimesheet.report', ['ngRoute', 'constants'])

    .config(['$routeProvider', 'appVersion', function ($routeProvider, appVersion) {
        $routeProvider.when('/report', {
            templateUrl: 'report/reportView.html?rel=' + appVersion,
            controller: 'reportController'
        });
    }])

    .controller('reportController', ['$scope', 'reportService', 'preferences', 'uiGridConstants', 'topPanelService', '$timeout', '$location',
        function ($scope, reportService, preferences, uiGridConstants, topPanelService, $timeout, $location) {
            var companyId = preferences.get('user').companyId,
                userRole = preferences.get('user').role.toLowerCase(),
                headerHeight = 38 + 12,
                maxVisiblePages = 5,
                columns = reportService.columns;

            $scope.introSteps = reportService.introSteps;

            if (userRole == 'owner' || userRole == 'manager') {
                $scope.userIsManager = true;
            }
            else {
                $scope.userIsManager = false;
            }

            $scope.getAggregatedComments = function (comments) {
                if (comments && comments.length) {
                    //remove empty comments
                    var cleanComments = comments.filter(function (e) {
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
                page: 1
            };

            if (!$scope.userIsManager) {
                $scope.reportSettings.filters.push({
                    field: "userName",
                    value: [preferences.get('user').displayName]
                });
            }

            $scope.reports = [
                {
                    title: 'Log',
                    active: true,
                    setSettings: function () {
                        $scope.reportSettings.groupBy = [];
                        $scope.reportSettings.isCommentNeeded = false;
                    },
                    columnsOrder: ['date', 'userName', 'projectName', 'time', 'comment']
                },
                {
                    title: 'Project',
                    active: false,
                    setSettings: function () {
                        $scope.reportSettings.groupBy = ['projectName'];
                        $scope.reportSettings.isCommentNeeded = false;
                    },
                    columnsOrder: ['projectName', 'time']
                },
                {
                    title: 'Employee',
                    active: false,
                    setSettings: function () {
                        $scope.reportSettings.groupBy = ['userName'];
                        $scope.reportSettings.isCommentNeeded = true;
                    },
                    columnsOrder: ['userName', 'time', 'comments']
                },
                {
                    title: 'Project & Employee',
                    active: false,
                    setSettings: function () {
                        $scope.reportSettings.groupBy = ['userName', 'projectName'];
                        $scope.reportSettings.isCommentNeeded = true;
                    },
                    columnsOrder: ['projectName', 'userName', 'time', 'comments']
                }
            ];
            function local_active() {
                var key_name = ["Employee Name", "Project Name"];
                var nameExist = false;
                for (var i in key_name) {
                    var k = key_name[i];
                    if (localStorage[k]) {
                        var self = JSON.parse(localStorage[k]);
                        var reg = /filtered/;
                        for (var l in self) {
                            if (l.search(reg) != -1) {
                                if (self[l] === true) {
                                    nameExist = true;
                                }
                            }
                        }
                    }
                    var reportFilterElements = document.getElementsByClassName("report-filter");
                    if (reportFilterElements[i]) {
                        if (nameExist) {
                            document.getElementsByClassName("report-filter")[i].classList.add("active");
                        } else {
                            document.getElementsByClassName("report-filter")[i].classList.remove("active");
                        }
                    }
                    nameExist = 0;
                }
            }

            setTimeout(function () {
                local_active();
            }, 400);
            var data_filter = {};
            document.onclick = function (e) {
                var target = e.target;
                var id;
                if (target.type === "checkbox") {
                    var name = target.parentNode.parentNode.firstElementChild.innerHTML;
                    var check = target.parentNode.parentNode.getElementsByTagName("input");
                    for (var c in check) {
                        if (check[c].type === "checkbox")
                            data_filter[check[c].id] = check[c].checked;
                    }
                    id = target.id;
                    data_filter[id] = target.checked;
                    localStorage.setItem(name, JSON.stringify(data_filter));
                    // document.getElementsByClassName(target.tagName);
                }
                if (target.className === "report-filter" || target.className === "report-filter active") {
                    var filter_bt = document.getElementsByClassName("popover-content");
                    var parent = target.parentNode.parentNode.parentNode.parentNode;
                    var key = $(parent).find('.header-area.sortable')[0].children[1].firstElementChild.innerHTML;
                    var value_filter = {};
                    if (localStorage[key]) {
                        value_filter = JSON.parse(localStorage[key]);
                    }

                    setTimeout(function () {
                        for (var k in value_filter) {
                            document.getElementById(k).checked = value_filter[k];
                        }
                    }, 10);
                }
                setTimeout(function () {
                    if (document.getElementsByClassName('popover ').length === 0) {
                        data_filter = {};
                    }
                }, 160);
            };

            $scope.changeActiveReport = function (activeIndex) {
                $scope.reportSettings.page = 1;

                $scope.reports.map(function (report) {
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
                columnDefs: reportService.getLastDefinedColumns(),
                data: 'reportData',
                reportFilters: [],

                onRegisterApi: function (gridApi) {
                    $scope.gridApi = gridApi;
                    $scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
                    $scope.getReport();
                }
            };

            $scope.sortChanged = function (grid, sortColumns) {
                $scope.reportSettings.page = 1;

                if (sortColumns.length === 0 || (sortColumns[0] && !sortColumns[0].sort)) {
                    $scope.reportSettings.sort = {
                        field: 'date',
                        asc: false
                    };

                    $scope.getReport();
                } else {
                    switch (sortColumns[0].sort.direction) {
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

            reportService.getFilters(companyId).success(function (data) {
                $scope.timesheetGridOptions.reportFilters = $scope.timesheetGridOptions.reportFilters.concat(data);
            });

            $scope.$watch('timesheetGridOptions.reportFilters', function (newValue, oldValue) {
                if (oldValue && newValue && newValue != oldValue) {
                    //$scope.reportSettings.filters = [];
                    var dateFilter = _.where(newValue, {field: 'date'})[0],
                        usedFilters = $scope.reportSettings.filters || reportService.getSavedFilters(),
                        dateFilterIndex = _.findIndex(usedFilters, {field: 'date'});

                    if (dateFilter && dateFilterIndex != -1) {
                        usedFilters[dateFilterIndex] = dateFilter;
                    }
                    else if (dateFilter) {
                        usedFilters.push(dateFilter);
                    }

                    if (reportService.getSavedFilters()[1]) {
                        var savedFilters = reportService.getSavedFilters();
                        usedFilters = reportService.getSavedFilters();
                    }

                    newValue.forEach(function (filter) {
                        var filterToPush = {
                            field: filter.field
                        };

                        //proper names for backend
                        switch (filterToPush.field) {
                            case 'projects':
                                filterToPush.field = 'projectName';
                                break;
                            case 'users':
                                filterToPush.field = 'userId';
                                break;
                        }

                        var checkedFilters = _.where(filter.value, {isChecked: true}),
                            usedFilterIndex = _.findIndex(usedFilters, {field: filterToPush.field});

                        filterToPush.value = checkedFilters.map(function (checkedFilter) {
                            return checkedFilter.name._id || checkedFilter.name;
                        });

                        if (filterToPush.value.length && usedFilterIndex == -1) {
                            usedFilters.push(filterToPush);
                        }
                        else if (filterToPush.value.length && usedFilterIndex !== -1) {
                            usedFilters[usedFilterIndex] = filterToPush;
                        }
                            else if (filterToPush.field !== 'date' && !filterToPush.value.length && usedFilterIndex !== -1) {
                                usedFilters.splice(usedFilterIndex, 1);
                            }
                        // else if(usedFilterIndex !== -1 && filterToPush.field != 'date'){
                        //     usedFilters.splice(usedFilterIndex, 1);
                        // }
                    });

                    $scope.reportSettings.filters = usedFilters;
                    $scope.getReport();
                }
            }, true);

            $scope.getReport = function () {
                var dateFilterIndex = _.findIndex($scope.reportSettings.filters, function (reportFilter) {
                    return reportFilter.field == 'date';
                });

                if (dateFilterIndex >= 0) {
                    reportService.saveSavedFilters($scope.reportSettings.filters);
                    reportService.getReport($scope.reportSettings).success(function (data, status, headers) {
                        var columnsOrder = $scope.reports[_.findIndex($scope.reports, {active: true})].columnsOrder;

                        $scope.reportData = data;

                        //add columns to grid

                        reportService.saveLastDefinedColumns([]);
                        var newColumns = [];
                        newColumns.length = columnsOrder.length;

                        for (var i = 0; i < columnsOrder.length; i++) {
                            var column = columnsOrder[i];
                            if (columns[column]) {
                                newColumns[i] = columns[column];
                            }
                        }

                        $scope.timesheetGridOptions.columnDefs = newColumns;
                        reportService.saveLastDefinedColumns(newColumns);

                        $scope.gridHeight = {
                            height: ((data.length) * ($scope.timesheetGridOptions.rowHeight + 1)) + headerHeight + "px"
                        };

                        if (headers()['x-total-count']) {
                            $scope.totalCount = headers()['x-total-count'];
                            $scope.totalPages = Math.ceil($scope.totalCount / $scope.reportSettings.pageSize);
                        }
                    }).finally(function () {
                        //call the directive 'cuttedComment' to reRender comments
                        $timeout(function () {
                            $scope.$broadcast('activeReportChanged');
                        }).getSavedFilters();
                    });
                }
            };
            $scope.openPage = function (pageIndex) {
                $scope.reportSettings.page = pageIndex;
                $scope.getReport();
            };

            $scope.nextPage = function () {
                if ($scope.reportSettings.page < $scope.totalPages) {
                    $scope.reportSettings.page++;
                    $scope.getReport();
                }
            };

            $scope.prevPage = function () {
                if ($scope.reportSettings.page > 1) {
                    $scope.reportSettings.page--;
                    $scope.getReport();
                }
            };

            $scope.range = function (n) {
                return new Array(n);
            };

            $scope.downloadCsv = function () {
                if ($scope.reportSettings.groupBy && $scope.reportSettings.groupBy.length) {
                    reportService.downloadAggregationCsv($scope.reportSettings).success(function (data) {
                        window.location = data.url;
                    });
                }
                else {
                    reportService.downloadCsv($scope.reportSettings).success(function (data) {
                        window.location = data.url;
                    });
                }
            };

            $scope.downloadPdf = function (id) {
                if ($scope.reportSettings.groupBy && $scope.reportSettings.groupBy.length) {
                    reportService.downloadAggregationPdf($scope.reportSettings).success(function (data) {
                        window.location = data.url;
                    });
                }
                else {
                    $scope.reportSettings.projectId = id;
                    reportService.downloadPdf($scope.reportSettings).success(function (data) {
                        window.location = data.url;
                    });
                }
            };

            $scope.perPageChanged = function (perPage) {
                $scope.reportSettings.pageSize = perPage;
                $scope.reportSettings.page = 1;
                $scope.getReport();
            };

            $scope.$on('handleBroadcast', function () {
                if (topPanelService.linkName == 'csv') {
                    $scope.downloadCsv();
                } else if (topPanelService.linkName == 'pdf') {
                    $scope.downloadPdf(topPanelService.projectId);
                }
            });

            $scope.showOriginalPage = function (pageNumber) {
                if ($scope.reportSettings.page + 2 >= pageNumber &&
                    $scope.reportSettings.page - 2 <= pageNumber) {
                    return true;
                }
                else if (($scope.reportSettings.page < 3 && pageNumber <= maxVisiblePages) ||
                    ($scope.reportSettings.page + 1 >= $scope.totalPages && pageNumber + 4 >= $scope.totalPages)) {
                    return true;
                }
            };

            $scope.showFirstPage = function () {
                if ($scope.totalPages > maxVisiblePages &&
                    ($scope.reportSettings.page > 4 || $scope.reportSettings.page - 3 > 0)) {
                    return true;
                }
            };

            $scope.showFirstDots = function () {
                if ($scope.totalPages > maxVisiblePages &&
                    ($scope.reportSettings.page > 4)) {
                    return true;
                }
            };

            $scope.showLastPage = function () {
                if ($scope.totalPages > maxVisiblePages && $scope.reportSettings.page + 3 <= $scope.totalPages) {
                    return true;
                }
            };

            $scope.showLastDots = function () {
                if ($scope.reportSettings.page + 4 <= $scope.totalPages) {
                    return true;
                }
            };

            $scope.editEmployeeTimesheet = function (userName) {
                var usersFilter = _.findWhere($scope.timesheetGridOptions.reportFilters, {field: 'users'}),
                    user = _.find(usersFilter.value, function (filterValue) {
                        return filterValue.name.displayName == userName;
                    });

                $scope.locations = localStorage.setItem('location', 'Report');
                $location.path('timesheet/' + user.name._id);
                // window.location.reload();

            };

        }]);
